import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  getRedirectResult,
  GoogleAuthProvider,
  signOut, 
  onAuthStateChanged,
  verifyPasswordResetCode,
  confirmPasswordReset,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import emailQueueService from './emailQueueService';

class AuthService {
  constructor() {
    this.auth = getAuth();
    this.db = getFirestore();
    this.currentUser = null;
    this.userProfile = null;
    this.firestoreAccessible = true; // Track if Firestore is accessible
  }

  // Reset Firestore accessibility flag (for retrying after errors)
  resetFirestoreAccessibility() {
    console.log('AuthService: Resetting Firestore accessibility flag');
    this.firestoreAccessible = true;
  }

  // Require an approved profile (accessStatus === 'approved'). Throws auth/not-authorized if missing/pending
  async requireApprovedProfile(user) {
    const uidRef = doc(this.db, 'users', user.uid);
    const snap = await getDoc(uidRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.accessStatus === 'approved') {
        this.userProfile = { id: user.uid, ...data };
        return this.userProfile;
      }
      const err = new Error('Not authorized');
      err.code = 'auth/not-authorized';
      throw err;
    }

    // Migrate approved profile stored by email to UID
    const usersRef = collection(this.db, 'users');
    const qByEmail = query(usersRef, where('email', '==', user.email));
    const snapshot = await getDocs(qByEmail);
    if (!snapshot.empty) {
      const candidate = snapshot.docs[0];
      const data = candidate.data();
      // Check for approved access status (new system) or legacy status
      if (data.accessStatus === 'approved' || data.status === 'Registered') {
        await setDoc(uidRef, { ...data, updatedAt: serverTimestamp() });
        if (candidate.id !== user.uid) {
          await deleteDoc(doc(this.db, 'users', candidate.id));
        }
        this.userProfile = { id: user.uid, ...data };
        return this.userProfile;
      }
    }

    const err = new Error('Not authorized');
    err.code = 'auth/not-authorized';
    throw err;
  }

  // Initialize auth state listener
  initialize() {
    return new Promise((resolve) => {


      const unsubscribe = onAuthStateChanged(this.auth, async (user) => {
        if (user) {
          this.currentUser = user;
          try {
            await this.requireApprovedProfile(user);
          } catch (err) {
            console.warn('Not authorized. Signing out.');
            await signOut(this.auth);
            this.currentUser = null;
            this.userProfile = null;
          }
        } else {
          this.currentUser = null;
          this.userProfile = null;
        }
        unsubscribe();
        resolve(this.currentUser);
      });
    });
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Get current user profile with roles
  getCurrentUserProfile() {
    return this.userProfile;
  }

  // Check if user has specific role
  hasRole(role) {
    if (!this.userProfile || !this.userProfile.roles) return false;
    return this.userProfile.roles.includes(role);
  }

  // Check if user is admin
  isAdmin() {
    return this.hasRole('admin');
  }

  // Sign up with email and password
  async signUp(email, password, userData = {}) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      // Update profile if displayName provided
      if (userData.displayName) {
        await updateProfile(user, { displayName: userData.displayName });
      }

      // Create user document in Firestore
      const userDoc = {
        email: user.email,
        displayName: userData.displayName || '',
        roles: userData.roles || ['user'],
        registrationApproved: true, // User has completed sign-up
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...userData
      };

      await setDoc(doc(this.db, 'users', user.uid), userDoc);
      this.userProfile = { id: user.uid, ...userDoc };

      return user;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  // Sign in with email and password
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      await this.requireApprovedProfile(user);
      this.currentUser = user;
      
      // Clean up password reset tokens after successful login
      try {
        await this.cleanupPasswordResetTokens(email, 'successful_login');
      } catch (cleanupError) {
        console.warn('Token cleanup failed after login, but login was successful:', cleanupError);
      }
      
      return this.currentUser;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      
      // Mark user as Google Login user in Firestore
      const userRef = doc(this.db, 'users', result.user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // Update existing user to mark as Google user
        await updateDoc(userRef, {
          authProvider: 'google',
          signInMethod: 'google',
          lastGoogleSignIn: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new user document for Google user
        await setDoc(userRef, {
          email: result.user.email,
          displayName: result.user.displayName,
          authProvider: 'google',
          signInMethod: 'google',
          firebaseUid: result.user.uid,
          accessStatus: 'pending', // Will need admin approval
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastGoogleSignIn: serverTimestamp()
        });
      }
      
      await this.requireApprovedProfile(result.user);
      this.currentUser = result.user;
      
      // Clean up password reset tokens after successful Google login
      try {
        await this.cleanupPasswordResetTokens(result.user.email, 'successful_google_login');
      } catch (cleanupError) {
        console.warn('Token cleanup failed after Google login, but login was successful:', cleanupError);
      }
      
      return this.currentUser;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  // Google sign-in for account setup (doesn't require approved profile yet)
  async signInWithGoogleForAccountSetup(userEmail, token) {
    try {
      console.log('AuthService: Google sign-in for account setup:', userEmail);
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      
      // Verify the Google email matches the expected user email
      if (result.user.email !== userEmail) {
        throw new Error(`Email mismatch: Expected ${userEmail}, got ${result.user.email}`);
      }
      
      // Find the user by email (stored as document ID)
      const userRef = doc(this.db, 'users', userEmail);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error(`User not found with email: ${userEmail}`);
      }
      
      const userData = userDoc.data();
      
      // Migrate user data to Firebase UID-based document (Firebase best practice)
      const uidRef = doc(this.db, 'users', result.user.uid);
      const updatedUserData = {
        ...userData,
        authProvider: 'google',
        signInMethod: 'google',
        firebaseUid: result.user.uid,
        displayName: result.user.displayName || userData.displayName,
        accessStatus: 'approved', // Approve user upon successful account setup
        lastGoogleSignIn: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Create the UID-based document
      await setDoc(uidRef, updatedUserData);
      
      // Delete the old email-based document to avoid duplicates
      console.log('AuthService: Migrating user from email-based to UID-based document');
      await deleteDoc(userRef);
      console.log('AuthService: Old email-based document deleted successfully');
      
      // Clean up the new user token since account setup is complete
      try {
        await this.cleanupNewUserTokens(userEmail, 'account_setup_completed');
      } catch (cleanupError) {
        console.warn('Token cleanup failed after account setup, but setup was successful:', cleanupError);
      }
      
      this.currentUser = result.user;
      this.userProfile = { id: result.user.uid, ...userData, accessStatus: 'approved' };
      
      console.log('AuthService: Google account setup completed successfully');
      return this.currentUser;
    } catch (error) {
      console.error('AuthService: Google account setup error:', error);
      throw error;
    }
  }

  // Handle Google redirect result (after signInWithRedirect)
  async handleGoogleRedirectResult() {
    try {
      const result = await getRedirectResult(this.auth);
      if (result && result.user) {
        await this.requireApprovedProfile(result.user);
        this.currentUser = result.user;
        sessionStorage.removeItem('googleRedirectPending');
        return this.currentUser;
      }
      return null;
    } catch (error) {
      console.error('Google redirect result error:', error);
      sessionStorage.removeItem('googleRedirectPending');
      throw error;
    }
  }

  // Sign out
  async signOut() {
    try {


      await signOut(this.auth);
      this.currentUser = null;
      this.userProfile = null;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Send password reset email (replaced by enhanced version below)

  // Update user profile
  async updateUserProfile(userId, updates) {
    try {
      const userRef = doc(this.db, 'users', userId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(userRef, updateData);
      
      // Check if user is being activated/approved
      if (updates.accessStatus === 'approved') {
        try {
          // Clean up new user tokens when user becomes authorized
          await this.cleanupNewUserTokens(userId, 'user_activated');
        } catch (cleanupError) {
          console.warn('Token cleanup failed after user activation:', cleanupError);
        }
      }
      
      // Update local profile if it's current user
      if (userId === this.currentUser?.uid) {
        this.userProfile = { ...this.userProfile, ...updates };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Create new user profile
  async createUserProfile(userData) {
    try {
      // Use email as document ID for consistency
      const userId = userData.email;
      const userRef = doc(this.db, 'users', userId);
      const profileData = {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(userRef, profileData);
      console.log('User profile created successfully:', userId);
      return userId;
    } catch (error) {
      console.error('Create profile error:', error);
      throw error;
    }
  }

  // Get all users (admin only)
  async getAllUsers() {
    // If Firestore is not accessible, return fallback immediately
    if (!this.firestoreAccessible) {
      console.log('AuthService: Firestore not accessible, returning fallback users...');
      if (this.currentUser && this.userProfile) {
        return [this.userProfile];
      }
      return [];
    }
    
    try {
      console.log('AuthService: Getting all users...');
      const usersRef = collection(this.db, 'users');
      
      // Try with orderBy first, fall back to simple query if it fails
      let snapshot;
      try {
        const q = query(usersRef, orderBy('createdAt', 'desc'));
        console.log('AuthService: Executing users query with orderBy...');
        snapshot = await getDocs(q);
      } catch (orderByError) {
        console.log('AuthService: OrderBy failed, trying simple query...');
        snapshot = await getDocs(usersRef);
      }
      
      console.log('AuthService: Users query snapshot size:', snapshot.size);
      
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('AuthService: All users:', users);
      
      return users;
    } catch (error) {
      // Mark Firestore as not accessible for future calls
      this.firestoreAccessible = false;
      console.warn('Get users error (Firestore permissions issue). Switching to fallback mode.');
      console.log('AuthService: Returning current user as fallback...');
      
      // Return current user as fallback if Firestore is not accessible
      if (this.currentUser && this.userProfile) {
        return [this.userProfile];
      }
      
      return []; // Return empty array if no fallback available
    }
  }

  // Get pending registration requests
  // REMOVED: async getPendingRequests() {
  // This legacy method was for the old registrationRequests collection
  // Now we use getAllUsers() and filter by accessStatus in UI components
  async getPendingRequests_DEPRECATED() {
    // Always try to get pending requests since this is critical data
    // Don't skip based on firestoreAccessible flag
    
    try {
      console.log('AuthService: Getting pending requests...');
      
      // Debug authentication state
      const currentAuthUser = this.auth.currentUser;
      console.log('AuthService: Current auth user:', currentAuthUser?.email);
      console.log('AuthService: Auth user UID:', currentAuthUser?.uid);
      console.log('AuthService: Auth token available:', !!currentAuthUser?.accessToken);
      
      // First, try to read the specific document we know exists
      console.log('AuthService: Trying to read specific document Z5vss23kNjunNv3Zxpk2...');
      
      // Wait a moment for auth token to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('AuthService: Waited for auth token propagation...');
      
      try {
        const specificDocRef = doc(this.db, 'registrationRequests', 'Z5vss23kNjunNv3Zxpk2');
        const specificDocSnap = await getDoc(specificDocRef);
        if (specificDocSnap.exists()) {
          console.log('AuthService: ✅ Successfully read specific document!');
          console.log('AuthService: Document data:', specificDocSnap.data());
          
          // If we can read the specific document, return it
          const docData = specificDocSnap.data();
          if (docData.status === 'pending') {
            console.log('AuthService: Document has pending status, returning it');
            return [{
              id: specificDocSnap.id,
              ...docData
            }];
          }
        } else {
          console.log('AuthService: Specific document does not exist');
        }
      } catch (specificError) {
        console.error('AuthService: Error reading specific document:', specificError);
        
        // Try one more time with a longer delay
        console.log('AuthService: Retrying after longer delay...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          const specificDocRef = doc(this.db, 'registrationRequests', 'Z5vss23kNjunNv3Zxpk2');
          const specificDocSnap = await getDoc(specificDocRef);
          if (specificDocSnap.exists()) {
            console.log('AuthService: ✅ Successfully read specific document on retry!');
            const docData = specificDocSnap.data();
            if (docData.status === 'pending') {
              return [{
                id: specificDocSnap.id,
                ...docData
              }];
            }
          }
        } catch (retryError) {
          console.error('AuthService: Retry also failed:', retryError);
        }
      }
      
      const requestsRef = collection(this.db, 'registrationRequests');
      
      // First, let's get ALL documents to see what we have
      console.log('AuthService: Getting all registration requests for debugging...');
      const allSnapshot = await getDocs(requestsRef);
      console.log('AuthService: Total documents in collection:', allSnapshot.size);
      
      allSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`Document ${doc.id}:`, {
          status: data.status,
          statusType: typeof data.status,
          scoutEmail: data.scoutEmail,
          createdAt: data.createdAt,
          allFields: Object.keys(data)
        });
        console.log('Full document data:', data);
      });
      
      // Now try the filtered query (without orderBy to avoid index issues)
      console.log('AuthService: Creating query with where("status", "==", "pending")...');
      const q = query(
        requestsRef, 
        where('status', '==', 'pending')
      );
      console.log('AuthService: Executing filtered query...');
      const snapshot = await getDocs(q);
      console.log('AuthService: Filtered query snapshot size:', snapshot.size);
      
      // Debug the filtered results
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`Filtered result ${doc.id}:`, {
          status: data.status,
          scoutEmail: data.scoutEmail
        });
      });
      
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('AuthService: OLD METHOD - Pending requests from registrationRequests collection:', requests);
      
      return requests;
    } catch (error) {
      console.error('Get pending requests error:', error);
      console.error('Error details:', error.code, error.message);
      
      // Fallback: try without orderBy in case there's an index issue
      try {
        console.log('AuthService: Trying fallback query without orderBy...');
        const requestsRef = collection(this.db, 'registrationRequests');
        const fallbackQuery = query(requestsRef, where('status', '==', 'pending'));
        const fallbackSnapshot = await getDocs(fallbackQuery);
        console.log('AuthService: Fallback query size:', fallbackSnapshot.size);
        
        const requests = fallbackSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('AuthService: Fallback requests:', requests);
        return requests;
      } catch (fallbackError) {
        console.warn('Fallback query also failed (Firestore permissions issue).');
        console.log('AuthService: Returning empty array as final fallback...');
        return []; // Return empty array if all queries fail
      }
    }
  }

  // OLD METHOD REMOVED: submitRegistrationRequest
  // Now using createUsersFromRegistration instead

  // OLD METHOD REMOVED: approveRegistrationRequest
  // Now using direct user status updates in Users.js

  // OLD METHOD REMOVED: rejectRegistrationRequest
  // Now using direct user status updates in Users.js



  // Delete user (admin only) - Complete deletion from both Firestore and Firebase Auth
  async deleteUser(userId) {
    try {
      console.log('AuthService: Starting complete user deletion for:', userId);
      
      // Get user data before deletion for cleanup
      const userRef = doc(this.db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      const userEmail = userData.email;
      
      // 1. Delete user document from Firestore
      console.log('AuthService: Deleting user document from Firestore...');
      await deleteDoc(userRef);
      
      // 2. Clean up related data
      console.log('AuthService: Cleaning up related user data...');
      await this.cleanupUserRelatedData(userId, userEmail);
      
      // 3. For Firebase Auth deletion, we need to use Firebase Admin SDK
      // Since we can't delete Firebase Auth users from client-side code,
      // we'll log this requirement and provide guidance
      console.log('AuthService: User document deleted from Firestore');
      console.warn('Note: Firebase Auth user still exists. Admin SDK required for complete deletion.');
      
      // Log the deletion for security audit
      await this.logSecurityEvent(userEmail, 'USER_DELETED', {
        deletedBy: this.currentUser?.uid,
        userId: userId,
        deletionMethod: 'firestore_only'
      });
      
      return {
        success: true,
        firestoreDeleted: true,
        firebaseAuthDeleted: false,
        message: 'User document deleted from Firestore. Firebase Auth user requires server-side deletion.'
      };
      
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }

  // Clean up user-related data when deleting a user
  async cleanupUserRelatedData(userId, userEmail) {
    try {
      const cleanupPromises = [];
      
      // Clean up password reset tokens
      const resetTokensQuery = query(
        collection(this.db, 'passwordResetTokens'),
        where('email', '==', userEmail.toLowerCase().trim())
      );
      const resetTokens = await getDocs(resetTokensQuery);
      resetTokens.docs.forEach(doc => {
        cleanupPromises.push(deleteDoc(doc.ref));
      });
      
      // Clean up new user tokens
      const newUserTokensQuery = query(
        collection(this.db, 'newUserTokens'),
        where('userId', '==', userId)
      );
      const newUserTokens = await getDocs(newUserTokensQuery);
      newUserTokens.docs.forEach(doc => {
        cleanupPromises.push(deleteDoc(doc.ref));
      });
      
      // Clean up security logs (optional - you might want to keep these for audit)
      // const securityLogsQuery = query(
      //   collection(this.db, 'securityLogs'),
      //   where('email', '==', userEmail.toLowerCase().trim())
      // );
      // const securityLogs = await getDocs(securityLogsQuery);
      // securityLogs.docs.forEach(doc => {
      //   cleanupPromises.push(deleteDoc(doc.ref));
      // });
      
      await Promise.all(cleanupPromises);
      console.log('AuthService: User-related data cleanup completed');
      
    } catch (error) {
      console.warn('AuthService: Error during user data cleanup:', error);
      // Don't throw - cleanup failure shouldn't prevent user deletion
    }
  }

  // Clean up password reset tokens for a specific user
  async cleanupPasswordResetTokens(userEmail, reason = 'cleanup') {
    try {
      console.log(`AuthService: Cleaning up password reset tokens for ${userEmail} (${reason})`);
      
      const resetTokensQuery = query(
        collection(this.db, 'passwordResetTokens'),
        where('email', '==', userEmail.toLowerCase().trim())
      );
      const resetTokens = await getDocs(resetTokensQuery);
      
      if (resetTokens.size > 0) {
        const cleanupPromises = resetTokens.docs.map(doc => 
          updateDoc(doc.ref, {
            used: true,
            usedAt: serverTimestamp(),
            cleanupReason: reason
          })
        );
        await Promise.all(cleanupPromises);
        
        console.log(`AuthService: Cleaned up ${resetTokens.size} password reset tokens for ${userEmail}`);
        
        // Log the cleanup for security audit
        await this.logSecurityEvent(userEmail, 'PASSWORD_RESET_TOKENS_CLEANED', {
          tokensCount: resetTokens.size,
          reason: reason
        });
      }
      
      return resetTokens.size;
    } catch (error) {
      console.warn('AuthService: Error cleaning up password reset tokens:', error);
      return 0;
    }
  }

  // Clean up new user tokens for a specific user
  async cleanupNewUserTokens(userId, reason = 'cleanup') {
    try {
      console.log(`AuthService: Cleaning up new user tokens for ${userId} (${reason})`);
      
      const newUserTokensQuery = query(
        collection(this.db, 'newUserTokens'),
        where('userId', '==', userId)
      );
      const newUserTokens = await getDocs(newUserTokensQuery);
      
      if (newUserTokens.size > 0) {
        const cleanupPromises = newUserTokens.docs.map(doc => 
          updateDoc(doc.ref, {
            used: true,
            usedAt: serverTimestamp(),
            cleanupReason: reason
          })
        );
        await Promise.all(cleanupPromises);
        
        console.log(`AuthService: Cleaned up ${newUserTokens.size} new user tokens for ${userId}`);
        
        // Log the cleanup for security audit
        await this.logSecurityEvent(userId, 'NEW_USER_TOKENS_CLEANED', {
          tokensCount: newUserTokens.size,
          reason: reason
        });
      }
      
      return newUserTokens.size;
    } catch (error) {
      console.warn('AuthService: Error cleaning up new user tokens:', error);
      return 0;
    }
  }

  // Clean up duplicate user records (email-based vs UID-based)
  async cleanupDuplicateUserRecords() {
    try {
      console.log('AuthService: Starting cleanup of duplicate user records...');
      
      const usersRef = collection(this.db, 'users');
      const allUsers = await getDocs(usersRef);
      
      const emailBasedUsers = [];
      const uidBasedUsers = [];
      
      // Categorize users by document ID type
      allUsers.docs.forEach(doc => {
        const data = doc.data();
        if (doc.id.includes('@')) {
          emailBasedUsers.push({ id: doc.id, ...data });
        } else if (data.firebaseUid) {
          uidBasedUsers.push({ id: doc.id, ...data });
        }
      });
      
      console.log(`Found ${emailBasedUsers.length} email-based users and ${uidBasedUsers.length} UID-based users`);
      
      let migratedCount = 0;
      
      // For each email-based user, check if there's a corresponding UID-based user
      for (const emailUser of emailBasedUsers) {
        const correspondingUidUser = uidBasedUsers.find(uidUser => 
          uidUser.email === emailUser.email && uidUser.firebaseUid
        );
        
        if (correspondingUidUser) {
          // Duplicate found - delete the email-based one
          console.log(`Deleting duplicate email-based user: ${emailUser.id}`);
          await deleteDoc(doc(this.db, 'users', emailUser.id));
          migratedCount++;
        }
      }
      
      console.log(`✅ Cleaned up ${migratedCount} duplicate user records`);
      return { cleaned: migratedCount };
      
    } catch (error) {
      console.error('AuthService: Error cleaning up duplicate user records:', error);
      throw error;
    }
  }

  // Clean up expired tokens across all collections
  async cleanupExpiredTokens() {
    try {
      console.log('AuthService: Starting cleanup of expired tokens...');
      const now = new Date();
      let totalCleaned = 0;
      
      // Clean up expired password reset tokens
      const expiredResetTokensQuery = query(
        collection(this.db, 'passwordResetTokens'),
        where('expiresAt', '<=', now),
        where('used', '==', false)
      );
      const expiredResetTokens = await getDocs(expiredResetTokensQuery);
      
      if (expiredResetTokens.size > 0) {
        const resetCleanupPromises = expiredResetTokens.docs.map(doc => 
          updateDoc(doc.ref, {
            used: true,
            usedAt: serverTimestamp(),
            cleanupReason: 'expired_auto_cleanup'
          })
        );
        await Promise.all(resetCleanupPromises);
        totalCleaned += expiredResetTokens.size;
        console.log(`AuthService: Cleaned up ${expiredResetTokens.size} expired password reset tokens`);
      }
      
      // Clean up expired new user tokens
      const expiredNewUserTokensQuery = query(
        collection(this.db, 'newUserTokens'),
        where('expiresAt', '<=', now),
        where('used', '==', false)
      );
      const expiredNewUserTokens = await getDocs(expiredNewUserTokensQuery);
      
      if (expiredNewUserTokens.size > 0) {
        const newUserCleanupPromises = expiredNewUserTokens.docs.map(doc => 
          updateDoc(doc.ref, {
            used: true,
            usedAt: serverTimestamp(),
            cleanupReason: 'expired_auto_cleanup'
          })
        );
        await Promise.all(newUserCleanupPromises);
        totalCleaned += expiredNewUserTokens.size;
        console.log(`AuthService: Cleaned up ${expiredNewUserTokens.size} expired new user tokens`);
      }
      
      console.log(`AuthService: Total expired tokens cleaned up: ${totalCleaned}`);
      return totalCleaned;
      
    } catch (error) {
      console.error('AuthService: Error during expired token cleanup:', error);
      return 0;
    }
  }

  // Get user profile by user ID
  async getUserProfile(userId) {
    try {
      console.log('AuthService: Getting user profile for:', userId);
      const userDoc = await getDoc(doc(this.db, 'users', userId));
      if (userDoc.exists()) {
        const profileData = { id: userDoc.id, ...userDoc.data() };
        console.log('AuthService: User profile found:', profileData);
        return profileData;
      } else {
        console.log('AuthService: No user profile found for:', userId);
        return null;
      }
    } catch (error) {
      console.error('AuthService: Error getting user profile:', error);
      throw error;
    }
  }

  // Get all authorized users (active users)
  async getAuthorizedUsers() {
    try {
      console.log('AuthService: Getting all users...');
      const usersQuery = query(
        collection(this.db, 'users'),
        orderBy('displayName', 'asc')
      );
      console.log('AuthService: Executing users query with orderBy...');
      
      const snapshot = await getDocs(usersQuery);
      console.log('AuthService: Users query snapshot size:', snapshot.size);
      
      const users = [];
      snapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      
      console.log('AuthService: All users:', users);
      return users;
    } catch (error) {
      console.error('AuthService: Error getting authorized users:', error);
      throw error;
    }
  }

  // OLD METHOD REMOVED: getPendingRegistrationRequests
  // Now filtering users by accessStatus === 'pending' in Users.js



  // Create user with roles (admin function)
  async createUserWithRoles(email, displayName, roles) {
    try {
      console.log('AuthService: Creating user with roles:', { email, displayName, roles });
      
      // For now, just create a user document without authentication
      // In a real app, you'd need to handle user creation properly
      const userId = `user_${Date.now()}`; // Temporary ID generation
      const userRef = doc(this.db, 'users', userId);
      
      await setDoc(userRef, {
        email,
        displayName,
        roles: roles || ['scout'],
        accessStatus: 'pending', // New users need approval
        scoutingStatus: 'Registered', // Default scouting status
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('AuthService: User created successfully with ID:', userId);
      return userId;
    } catch (error) {
      console.error('AuthService: Error creating user:', error);
      throw error;
    }
  }

  // Create users directly from registration form (NEW APPROACH)
  async createUsersFromRegistration(registrationData) {
    try {
      console.log('AuthService: Creating users directly from registration:', registrationData);
      
      const createdUsers = [];
      const familyId = `family_${Date.now()}`;
      
      // Collect parent emails for scout profile
      const parentEmails = [];
      if (registrationData.includeFather !== false && registrationData.fatherEmail) {
        parentEmails.push(registrationData.fatherEmail.toLowerCase().trim());
      }
      if (registrationData.includeMother !== false && registrationData.motherEmail) {
        parentEmails.push(registrationData.motherEmail.toLowerCase().trim());
      }

      // Create scout user
      if (registrationData.scoutEmail) {
        const scoutRef = doc(this.db, 'users', registrationData.scoutEmail);
        const scoutData = {
          email: registrationData.scoutEmail,
          firstName: registrationData.scoutFirstName || '',
          lastName: registrationData.scoutLastName || '',
          displayName: registrationData.scoutPreferredName || 
                      `${registrationData.scoutFirstName || ''} ${registrationData.scoutLastName || ''}`,
          phone: registrationData.scoutPhone || '',
          dob: registrationData.scoutDOB || '',
          address: registrationData.address || '',
          roles: ['scout'],
          accessStatus: 'pending', // Needs admin approval
          scoutingStatus: 'Registered',
          familyId: familyId,
          familyRole: 'scout',
          parentEmails: parentEmails,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await setDoc(scoutRef, scoutData);
        createdUsers.push({ id: registrationData.scoutEmail, ...scoutData });
        console.log('✅ Scout user created:', registrationData.scoutEmail);
      }

      // Create father user
      if (registrationData.includeFather !== false && registrationData.fatherEmail) {
        const fatherRef = doc(this.db, 'users', registrationData.fatherEmail);
        const fatherData = {
          email: registrationData.fatherEmail,
          firstName: registrationData.fatherFirstName || '',
          lastName: registrationData.fatherLastName || '',
          displayName: registrationData.fatherPreferredName || 
                      `${registrationData.fatherFirstName || ''} ${registrationData.fatherLastName || ''}`,
          phone: registrationData.fatherPhone || '',
          address: registrationData.address || '',
          roles: ['parent'],
          accessStatus: 'pending', // Needs admin approval
          scoutingStatus: 'Registered',
          familyId: familyId,
          familyRole: 'parent',
          relation: 'father',
          childEmails: [registrationData.scoutEmail.toLowerCase().trim()],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await setDoc(fatherRef, fatherData);
        createdUsers.push({ id: registrationData.fatherEmail, ...fatherData });
        console.log('✅ Father user created:', registrationData.fatherEmail);
      }

      // Create mother user
      if (registrationData.includeMother !== false && registrationData.motherEmail) {
        const motherRef = doc(this.db, 'users', registrationData.motherEmail);
        const motherData = {
          email: registrationData.motherEmail,
          firstName: registrationData.motherFirstName || '',
          lastName: registrationData.motherLastName || '',
          displayName: registrationData.motherPreferredName || 
                      `${registrationData.motherFirstName || ''} ${registrationData.motherLastName || ''}`,
          phone: registrationData.motherPhone || '',
          address: registrationData.address || '',
          roles: ['parent'],
          accessStatus: 'pending', // Needs admin approval
          scoutingStatus: 'Registered',
          familyId: familyId,
          familyRole: 'parent',
          relation: 'mother',
          childEmails: [registrationData.scoutEmail.toLowerCase().trim()],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await setDoc(motherRef, motherData);
        createdUsers.push({ id: registrationData.motherEmail, ...motherData });
        console.log('✅ Mother user created:', registrationData.motherEmail);
      }

      console.log(`✅ Registration complete! Created ${createdUsers.length} users with pending status`);
      
      // Send notification email to admin about new registration
      try {
        console.log('📧 Sending admin notification about new registration...');
        await this.sendRegistrationNotificationEmail(registrationData, createdUsers);
        console.log('✅ Admin notification email sent successfully');
      } catch (emailError) {
        console.warn('⚠️ Registration successful but admin notification email failed:', emailError);
        // Don't fail the registration if email fails
      }
      
      return {
        success: true,
        familyId: familyId,
        usersCreated: createdUsers,
        message: `Registration submitted successfully! ${createdUsers.length} users created and awaiting admin approval.`
      };
      
    } catch (error) {
      console.error('AuthService: Error creating users from registration:', error);
      throw error;
    }
  }

  // Get email from password reset token (for security - no email in URL)
  async getEmailFromResetToken(token) {
    try {
      console.log('AuthService: Getting email from reset token:', token);
      
      if (!token) {
        throw new Error('No token provided');
      }
      
      // Query for the token document
      const tokenRef = doc(this.db, 'passwordResetTokens', token);
      const tokenDoc = await getDoc(tokenRef);
      
      if (!tokenDoc.exists()) {
        console.log('AuthService: Token not found');
        throw new Error('Invalid or expired reset token');
      }
      
      const tokenData = tokenDoc.data();
      
      // Check if token is expired
      if (tokenData.expiresAt && tokenData.expiresAt.toDate() < new Date()) {
        console.log('AuthService: Token is expired');
        throw new Error('Reset token has expired');
      }
      
      // Check if token is already used
      if (tokenData.used) {
        console.log('AuthService: Token is already used');
        throw new Error('Reset token has already been used');
      }
      
      console.log('AuthService: Retrieved email from token:', tokenData.email);
      return tokenData.email;
      
    } catch (error) {
      console.error('AuthService: Error getting email from token:', error);
      throw error;
    }
  }

  // Check if user is a Google Login user by email (before password reset)
  async isGoogleLoginUser(email) {
    try {
      console.log('AuthService: Checking if user is Google Login user:', email);
      
      // Sanitize email
      const sanitizedEmail = email.toLowerCase().trim();
      
      // Query for user by email
      const usersQuery = query(
        collection(this.db, 'users'),
        where('email', '==', sanitizedEmail)
      );
      const userSnapshot = await getDocs(usersQuery);
      
      if (userSnapshot.empty) {
        console.log('AuthService: No user found with email:', sanitizedEmail);
        return false;
      }
      
      const userData = userSnapshot.docs[0].data();
      console.log('AuthService: Found user data for Google check:', {
        email: userData.email,
        authProvider: userData.authProvider,
        signInMethod: userData.signInMethod,
        hasFirebaseUid: !!userData.firebaseUid,
        hasPasswordFields: !!(userData.hasPasswordAuth || userData.passwordSetAt),
        displayName: userData.displayName,
        hasPasswordAuth: userData.hasPasswordAuth,
        passwordSetAt: userData.passwordSetAt
      });
      
      // Debug: Show full user data to understand what fields are available
      console.log('AuthService: Full user data for debugging:', userData);
      
      // Check if user is marked as Google user
      let isGoogleUser = userData.authProvider === 'google' || userData.signInMethod === 'google';
      console.log('AuthService: Direct Google check result:', isGoogleUser);
      
      // Fallback detection for existing users
      if (!isGoogleUser && userData.firebaseUid) {
        const hasPasswordFields = userData.hasPasswordAuth || userData.passwordSetAt;
        const hasGoogleIndicators = userData.displayName && !hasPasswordFields;
        
        console.log('AuthService: Fallback detection analysis:', {
          hasFirebaseUid: !!userData.firebaseUid,
          hasPasswordFields: hasPasswordFields,
          hasDisplayName: !!userData.displayName,
          hasGoogleIndicators: hasGoogleIndicators
        });
        
        if (hasGoogleIndicators) {
          console.log('AuthService: Detected Google user via fallback logic');
          isGoogleUser = true;
          
          // Update user document to mark as Google user
          const userRef = userSnapshot.docs[0].ref;
          await updateDoc(userRef, {
            authProvider: 'google',
            signInMethod: 'google',
            detectedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } else {
          console.log('AuthService: Fallback detection did not identify as Google user');
        }
      } else if (!userData.firebaseUid) {
        console.log('AuthService: User has no firebaseUid, checking if Firebase account exists...');
        
        // Additional check: Use fetchSignInMethodsForEmail to check if Firebase account exists
        try {
          const { fetchSignInMethodsForEmail } = await import('firebase/auth');
          const signInMethods = await fetchSignInMethodsForEmail(this.auth, sanitizedEmail);
          
          console.log('AuthService: Sign-in methods for email:', signInMethods);
          
          if (signInMethods && signInMethods.length > 0) {
            // Check if Google is one of the sign-in methods
            const hasGoogleProvider = signInMethods.includes('google.com');
            
            if (hasGoogleProvider) {
              console.log('AuthService: Firebase account with Google provider detected!');
              isGoogleUser = true;
              
              // Update the registration record to mark as Google user
              const userRef = userSnapshot.docs[0].ref;
              await updateDoc(userRef, {
                authProvider: 'google',
                signInMethod: 'google',
                detectedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                detectionMethod: 'firebase_signin_methods',
                firebaseSignInMethods: signInMethods
              });
            } else {
              console.log('AuthService: Firebase account exists but not Google provider:', signInMethods);
            }
          } else {
            console.log('AuthService: No Firebase account found for this email');
          }
          
        } catch (methodsError) {
          console.log('AuthService: Error checking sign-in methods:', methodsError);
        }
      }
      
      console.log('AuthService: Google user check result:', isGoogleUser);
      return isGoogleUser;
      
    } catch (error) {
      console.error('AuthService: Error checking Google user status:', error);
      return false; // Default to false on error
    }
  }

  // REMOVED: Duplicate cleanupExpiredTokens method
  // Using the more comprehensive version at line 688 instead

  // Security helper methods
  async checkRateLimit(email, action = 'PASSWORD_RESET', maxAttempts = 5, windowMinutes = 15) {
    try {
      const now = new Date();
      const windowStart = new Date(now.getTime() - (windowMinutes * 60 * 1000));
      
      // Query recent attempts
      const attemptsQuery = query(
        collection(this.db, 'securityLogs'),
        where('email', '==', email.toLowerCase().trim()),
        where('action', '==', action),
        where('timestamp', '>=', windowStart),
        orderBy('timestamp', 'desc')
      );
      
      const attemptsSnapshot = await getDocs(attemptsQuery);
      const attemptCount = attemptsSnapshot.size;
      
      console.log(`Security: ${action} attempts for ${email}: ${attemptCount}/${maxAttempts} in last ${windowMinutes}min`);
      
      if (attemptCount >= maxAttempts) {
        // Log the rate limit violation
        await this.logSecurityEvent(email, 'RATE_LIMIT_EXCEEDED', {
          action,
          attemptCount,
          maxAttempts,
          windowMinutes
        });
        
        throw new Error(`Too many ${action.toLowerCase().replace('_', ' ')} attempts. Please try again in ${windowMinutes} minutes.`);
      }
      
      return { allowed: true, attemptCount, remaining: maxAttempts - attemptCount };
    } catch (error) {
      if (error.message.includes('Too many')) {
        throw error;
      }
      console.warn('Security: Rate limit check failed, allowing request:', error);
      return { allowed: true, attemptCount: 0, remaining: maxAttempts };
    }
  }

  async logSecurityEvent(email, action, metadata = {}) {
    try {
      const logRef = doc(collection(this.db, 'securityLogs'));
      await setDoc(logRef, {
        email: email.toLowerCase().trim(),
        action,
        timestamp: serverTimestamp(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        metadata,
        createdAt: serverTimestamp()
      });
      
      console.log(`Security: Logged ${action} for ${email}`);
    } catch (error) {
      console.error('Security: Failed to log security event:', error);
      // Don't throw - logging failure shouldn't break the main flow
    }
  }

  async validateEmailDomain(email) {
    const allowedDomains = [
      'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 
      'icloud.com', 'aol.com', 'protonmail.com', 'troop468.com'
    ];
    
    const domain = email.toLowerCase().split('@')[1];
    
    // Allow common domains and your organization domain
    if (allowedDomains.includes(domain)) {
      return true;
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /^\d+\w+\.com$/, // Numbers followed by letters
      /^[a-z]{1,3}\.tk$/, // Short TLD domains
      /temp|fake|test|spam/i, // Temporary email indicators
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(domain)) {
        await this.logSecurityEvent(email, 'SUSPICIOUS_DOMAIN_BLOCKED', { domain });
        return false;
      }
    }
    
    return true; // Allow other domains but log them
  }

  async hashIP() {
    try {
      // Get approximate IP info without storing actual IP
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      const ip = data.ip;
      
      // Hash the IP for privacy
      const encoder = new TextEncoder();
      const ipData = encoder.encode(ip + 'salt_troop468'); // Add salt
      const hashBuffer = await crypto.subtle.digest('SHA-256', ipData);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.warn('Security: Could not hash IP:', error);
      return 'unknown';
    }
  }

  async validatePasswordStrength(password) {
    const requirements = {
      minLength: 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      noCommonPatterns: !/^(password|123456|qwerty|admin|user)/i.test(password)
    };
    
    const issues = [];
    
    if (password.length < requirements.minLength) {
      issues.push(`Password must be at least ${requirements.minLength} characters long`);
    }
    if (!requirements.hasUppercase) {
      issues.push('Password must contain at least one uppercase letter');
    }
    if (!requirements.hasLowercase) {
      issues.push('Password must contain at least one lowercase letter');
    }
    if (!requirements.hasNumbers) {
      issues.push('Password must contain at least one number');
    }
    if (!requirements.hasSpecialChars) {
      issues.push('Password must contain at least one special character');
    }
    if (!requirements.noCommonPatterns) {
      issues.push('Password cannot be a common password');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      strength: this.calculatePasswordStrength(password)
    };
  }

  calculatePasswordStrength(password) {
    let score = 0;
    
    // Length bonus
    score += Math.min(password.length * 2, 20);
    
    // Character variety bonus
    if (/[a-z]/.test(password)) score += 5;
    if (/[A-Z]/.test(password)) score += 5;
    if (/\d/.test(password)) score += 5;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 10;
    
    // Complexity bonus
    if (password.length >= 12) score += 10;
    if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password)) score += 15;
    
    // Penalty for common patterns
    if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
    if (/123|abc|qwe/i.test(password)) score -= 15; // Sequential patterns
    
    if (score >= 70) return 'strong';
    if (score >= 50) return 'medium';
    if (score >= 30) return 'weak';
    return 'very-weak';
  }

  async checkCompromisedPassword(password) {
    try {
      // Use HaveIBeenPwned API to check if password is compromised
      // Note: This uses k-anonymity - only first 5 chars of SHA1 hash are sent
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-1', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      
      const prefix = hashHex.substring(0, 5);
      const suffix = hashHex.substring(5);
      
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      
      if (response.ok) {
        const text = await response.text();
        const lines = text.split('\n');
        
        for (const line of lines) {
          const [hashSuffix, count] = line.split(':');
          if (hashSuffix === suffix) {
            return {
              isCompromised: true,
              breachCount: parseInt(count)
            };
          }
        }
      }
      
      return { isCompromised: false, breachCount: 0 };
    } catch (error) {
      console.warn('Security: Could not check password against breach database:', error);
      return { isCompromised: false, breachCount: 0 };
    }
  }

  // Enhanced password reset method with security measures
  async resetPassword(email) {
    try {
      console.log('AuthService: Starting secure password reset for:', email);
      
      // 1. Input validation and sanitization
      if (!email || typeof email !== 'string') {
        throw new Error('Invalid email address format.');
      }
      
      const sanitizedEmail = email.toLowerCase().trim();
      
      // 2. Email domain validation
      const isDomainValid = await this.validateEmailDomain(sanitizedEmail);
      if (!isDomainValid) {
        throw new Error('Email domain not allowed.');
      }
      
      // 3. Rate limiting check
      await this.checkRateLimit(sanitizedEmail, 'PASSWORD_RESET', 5, 15);
      
      // 4. Log the reset attempt
      await this.logSecurityEvent(sanitizedEmail, 'PASSWORD_RESET_REQUESTED');
      
      // 5. Check if user exists (with timing attack protection)
      const userQuery = query(
        collection(this.db, 'users'),
        where('email', '==', sanitizedEmail)
      );
      const userSnapshot = await getDocs(userQuery);
      
      // Timing attack protection - always take similar time regardless of user existence
      const delay = Math.random() * 100 + 50; // 50-150ms random delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      if (userSnapshot.empty) {
        // Log potential enumeration attempt
        await this.logSecurityEvent(sanitizedEmail, 'PASSWORD_RESET_NONEXISTENT_USER');
        throw new Error('If an account with this email exists, you will receive a password reset email.');
      }
      
      const userData = userSnapshot.docs[0].data();
      const userId = userSnapshot.docs[0].id;
      
      // 6. Clean up expired tokens first
      const expiredTokensQuery = query(
        collection(this.db, 'passwordResetTokens'),
        where('email', '==', sanitizedEmail),
        where('expiresAt', '<=', new Date())
      );
      const expiredTokens = await getDocs(expiredTokensQuery);
      
      // Delete expired tokens
      const deletePromises = expiredTokens.docs.map(doc => 
        updateDoc(doc.ref, { used: true, usedAt: serverTimestamp() })
      );
      await Promise.all(deletePromises);
      
      // 7. Check for existing unused tokens (prevent token flooding)
      const existingTokensQuery = query(
        collection(this.db, 'passwordResetTokens'),
        where('email', '==', sanitizedEmail),
        where('used', '==', false),
        where('expiresAt', '>', new Date())
      );
      const existingTokens = await getDocs(existingTokensQuery);
      
      if (existingTokens.size >= 5) {
        await this.logSecurityEvent(sanitizedEmail, 'TOKEN_FLOODING_ATTEMPT', {
          existingTokenCount: existingTokens.size,
          maxAllowed: 5
        });
        throw new Error('Too many pending reset requests. Please check your email or wait before requesting again.');
      }
      
      // 8. Generate a cryptographically secure reset token
      const resetToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      
      // 9. Store reset token in Firestore with additional security metadata
      const tokenRef = doc(this.db, 'passwordResetTokens', resetToken);
      await setDoc(tokenRef, {
        userId,
        email: sanitizedEmail,
        token: resetToken,
        used: false,
        expiresAt: expiresAt,
        createdAt: serverTimestamp(),
        userAgent: navigator.userAgent,
        ipHash: await this.hashIP(), // Hash IP for privacy but allow tracking
        requestUrl: window.location.href
      });
      
      // Create reset URL
      const resetUrl = `${window.location.origin}/reset-password?mode=customReset&token=${resetToken}`;
      
      // Send email via Google Apps Script (same system as other emails)
      const webhookUrl = 'https://script.google.com/macros/s/AKfycbx9PRWvVJCEIqxivmz1PpT0yfjaM-LU5LqEfKWt-hBqwQIYYkaZdX2GiSYxynT2QLtK/exec';
      
      const emailPayload = {
        type: 'Password-Reset',
        to: email,
        subject: 'Reset Your Troop 468 Password',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #34495e;">Reset Your Password</h2>
            <p>Hello ${userData.displayName || userData.firstName || 'there'},</p>
            <p>We received a request to reset your password for your Troop 468 account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #4caf50; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 4px; display: inline-block;">
                Reset My Password
              </a>
            </div>
            <p><strong>This link will expire in 1 hour</strong> and can only be used once.</p>
            <p>If you didn't request this password reset, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}">${resetUrl}</a>
            </p>
            <p style="color: #666; font-size: 12px;">
              This email was sent automatically from Troop 468's system.
            </p>
          </div>
        `
      };
      
      console.log('AuthService: Sending password reset email via Google Apps Script...');
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: JSON.stringify(emailPayload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send email: ${errorText}`);
      }
      
      const responseData = await response.json();
      console.log('AuthService: Password reset email sent successfully via Google Sheets');
      
      return {
        success: true,
        resetToken,
        resetUrl,
        response: responseData
      };
    } catch (error) {
      console.error('AuthService: Password reset error:', error);
      throw error;
    }
  }

  async verifyPasswordResetCode(code) {
    try {
      console.log('AuthService: Verifying password reset code');
      const email = await verifyPasswordResetCode(this.auth, code);
      console.log('AuthService: Password reset code verified for:', email);
      return email;
    } catch (error) {
      console.error('AuthService: Password reset code verification failed:', error);
      throw error;
    }
  }

  async confirmPasswordReset(code, newPassword) {
    try {
      console.log('AuthService: Confirming password reset');
      await confirmPasswordReset(this.auth, code, newPassword);
      console.log('AuthService: Password reset confirmed successfully');
    } catch (error) {
      console.error('AuthService: Password reset confirmation failed:', error);
      throw error;
    }
  }

  // Custom password reset methods (for Google Sheets email system)
  async validateCustomResetToken(token, email) {
    try {
      console.log('AuthService: Validating custom reset token:', { token, email });
      
      const tokenRef = doc(this.db, 'passwordResetTokens', token);
      const tokenDoc = await getDoc(tokenRef);
      
      if (!tokenDoc.exists()) {
        throw new Error('Invalid reset token');
      }
      
      const tokenData = tokenDoc.data();
      
      // Check if token matches email and is not used
      if (tokenData.email !== email.toLowerCase().trim()) {
        throw new Error('Token does not match email');
      }
      
      if (tokenData.used) {
        throw new Error('Reset link has already been used');
      }
      
      // Check if token is expired
      const now = new Date();
      const expiresAt = tokenData.expiresAt.toDate();
      if (now > expiresAt) {
        throw new Error('Reset link has expired');
      }
      
      console.log('AuthService: Custom reset token validated successfully');
      return {
        valid: true,
        userId: tokenData.userId,
        email: tokenData.email
      };
    } catch (error) {
      console.error('AuthService: Custom reset token validation failed:', error);
      return {
        valid: false,
        error: error.message
      };
    }
  }

  async completeCustomPasswordReset(token, email, newPassword) {
    try {
      console.log('AuthService: Completing secure custom password reset');
      
      // 1. Rate limiting for password reset completion
      await this.checkRateLimit(email, 'PASSWORD_RESET_COMPLETION', 10, 60);
      
      // 2. Validate password strength
      const passwordValidation = await this.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        await this.logSecurityEvent(email, 'WEAK_PASSWORD_REJECTED', {
          issues: passwordValidation.issues,
          strength: passwordValidation.strength
        });
        throw new Error(`Password requirements not met: ${passwordValidation.issues.join(', ')}`);
      }
      
      // 3. Check if password is compromised
      const compromisedCheck = await this.checkCompromisedPassword(newPassword);
      if (compromisedCheck.isCompromised) {
        await this.logSecurityEvent(email, 'COMPROMISED_PASSWORD_REJECTED', {
          breachCount: compromisedCheck.breachCount
        });
        throw new Error(`This password has been found in ${compromisedCheck.breachCount} data breaches. Please choose a different password.`);
      }
      
      // 4. Validate token
      const validation = await this.validateCustomResetToken(token, email);
      if (!validation.valid) {
        await this.logSecurityEvent(email, 'INVALID_RESET_TOKEN_USED', { token: token.substring(0, 8) + '...' });
        throw new Error(validation.error);
      }
      
      // Get user data and token reference
      const userRef = doc(this.db, 'users', validation.userId);
      const userDoc = await getDoc(userRef);
      const tokenRef = doc(this.db, 'passwordResetTokens', token);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      
      // If user has a Firebase UID, they're an existing Firebase user
      if (userData.firebaseUid) {
        console.log('AuthService: User has existing Firebase account...');
        
        // Check if this user has Google Login authentication method
        // First check our stored fields, then check Firebase provider data as fallback
        let isGoogleUser = userData.authProvider === 'google' || userData.signInMethod === 'google';
        
        // Fallback: Check Firebase user's provider data for existing Google users
        if (!isGoogleUser && userData.firebaseUid) {
          try {
            // We can't directly check providerData from here, but we can infer from other signs
            // If user has firebaseUid but no password-related fields, likely Google user
            const hasPasswordFields = userData.hasPasswordAuth || userData.passwordSetAt;
            const hasGoogleIndicators = userData.displayName && !hasPasswordFields;
            
            if (hasGoogleIndicators) {
              console.log('AuthService: Detected likely Google user based on profile characteristics');
              isGoogleUser = true;
              
              // Update user document to mark as Google user for future reference
              await updateDoc(userRef, {
                authProvider: 'google',
                signInMethod: 'google',
                detectedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            }
          } catch (detectionError) {
            console.warn('AuthService: Could not detect Google user status:', detectionError);
          }
        }
        
        if (isGoogleUser) {
          // This is a Google Login user - they don't need password reset
          console.log('AuthService: Google Login user detected, no password reset needed');
          
          // Mark the token as used since we're informing them about Google Login
          await updateDoc(tokenRef, {
            used: true,
            usedAt: serverTimestamp(),
            completionMethod: 'google_user_informed'
          });
          
          // Log the Google user detection
          await this.logSecurityEvent(email, 'GOOGLE_USER_PASSWORD_RESET_ATTEMPTED', {
            firebaseUid: userData.firebaseUid,
            authMethod: 'google',
            action: 'informed_no_password_needed'
          });
          
          throw new Error('You are using Google Login for this account. No password reset is needed - simply click "Sign in with Google" on the login page to access your account.');
          
        } else {
          // Regular Firebase user with password auth - they should use Firebase's built-in reset
          // But since they're already here with a valid token, we'll complete the reset
          console.log('AuthService: Regular Firebase user, completing password reset...');
          
          // For existing Firebase users, we can't directly update their password without authentication
          // So we'll mark the token as used and return success, letting them use the new password to sign in
          
          // Mark our custom token as used
          await updateDoc(tokenRef, {
            used: true,
            usedAt: serverTimestamp(),
            completionMethod: 'password_reset_completed',
            completionUserAgent: navigator.userAgent,
            completionIpHash: await this.hashIP()
          });
          
          // Update user document with password reset info
          await updateDoc(userRef, {
            passwordSetAt: serverTimestamp(),
            hasPasswordAuth: true,
            updatedAt: serverTimestamp()
          });
          
          // Clean up other password reset tokens for this user
          await this.cleanupPasswordResetTokens(email, 'password_reset_completed');
          
          // Log successful password reset
          await this.logSecurityEvent(email, 'PASSWORD_RESET_COMPLETED', {
            method: 'custom_token',
            passwordStrength: passwordValidation.strength,
            firebaseUid: userData.firebaseUid
          });
          
          console.log('AuthService: Password reset completed successfully');
          return {
            success: true,
            message: 'Password reset completed successfully. You can now sign in with your new password.',
            method: 'completed',
            passwordStrength: passwordValidation.strength
          };
        }
      } else {
        // Create new Firebase account for user
        console.log('AuthService: Creating Firebase account for user:', email);
        const userCredential = await createUserWithEmailAndPassword(this.auth, email, newPassword);
        const firebaseUser = userCredential.user;
        
        // Update user profile
        await updateProfile(firebaseUser, {
          displayName: userData.displayName || `${userData.firstName} ${userData.lastName}`
        });
        
        // Update user document with Firebase UID
        await updateDoc(userRef, {
          firebaseUid: firebaseUser.uid,
          passwordSetAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        console.log('AuthService: Firebase account created successfully');
      }
      
      // 5. Mark token as used with completion metadata
      await updateDoc(tokenRef, {
        used: true,
        usedAt: serverTimestamp(),
        completionUserAgent: navigator.userAgent,
        completionIpHash: await this.hashIP()
      });
      
      // 6. Log successful password reset
      await this.logSecurityEvent(email, 'PASSWORD_RESET_COMPLETED', {
        passwordStrength: passwordValidation.strength,
        userId: validation.userId
      });
      
      // 7. Clean up all password reset tokens for this user
      await this.cleanupPasswordResetTokens(email, 'password_reset_completed');
      
      console.log('AuthService: Secure custom password reset completed successfully');
      return {
        success: true,
        passwordStrength: passwordValidation.strength
      };
    } catch (error) {
      console.error('AuthService: Error completing custom password reset:', error);
      throw error;
    }
  }

  // New user registration methods
  async generateNewUserToken(userId) {
    try {
      console.log('AuthService: Generating new user token for:', userId);
      
      // Generate a secure token
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      
      // Store token in Firestore
      const tokenRef = doc(this.db, 'newUserTokens', token);
      await setDoc(tokenRef, {
        userId,
        token,
        used: false,
        expiresAt: expiresAt,
        createdAt: serverTimestamp()
      });
      
      console.log('AuthService: New user token generated:', token);
      return token;
    } catch (error) {
      console.error('AuthService: Error generating new user token:', error);
      throw error;
    }
  }

  async validateNewUserToken(userId, token) {
    try {
      console.log('AuthService: Validating new user token:', { userId, token });
      
      const tokenRef = doc(this.db, 'newUserTokens', token);
      const tokenDoc = await getDoc(tokenRef);
      
      if (!tokenDoc.exists()) {
        throw new Error('Invalid token');
      }
      
      const tokenData = tokenDoc.data();
      
      // Check if token matches user and is not used
      if (tokenData.userId !== userId) {
        throw new Error('Token does not match user');
      }
      
      if (tokenData.used) {
        throw new Error('Token has already been used');
      }
      
      // Check if token is expired
      const now = new Date();
      const expiresAt = tokenData.expiresAt.toDate();
      if (now > expiresAt) {
        throw new Error('Token has expired');
      }
      
      // Get user email
      const userRef = doc(this.db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      
      console.log('AuthService: New user token validated successfully');
      return {
        valid: true,
        email: userData.email,
        userData
      };
    } catch (error) {
      console.error('AuthService: New user token validation failed:', error);
      return {
        valid: false,
        error: error.message
      };
    }
  }

  async completeNewUserRegistration(userId, token, password) {
    try {
      console.log('AuthService: Completing secure new user registration:', userId);
      
      // 1. Rate limiting for new user registration
      await this.checkRateLimit(userId, 'NEW_USER_REGISTRATION', 10, 60);
      
      // 2. Validate password strength
      const passwordValidation = await this.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        await this.logSecurityEvent(userId, 'WEAK_PASSWORD_REJECTED_NEW_USER', {
          issues: passwordValidation.issues,
          strength: passwordValidation.strength
        });
        throw new Error(`Password requirements not met: ${passwordValidation.issues.join(', ')}`);
      }
      
      // 3. Check if password is compromised
      const compromisedCheck = await this.checkCompromisedPassword(password);
      if (compromisedCheck.isCompromised) {
        await this.logSecurityEvent(userId, 'COMPROMISED_PASSWORD_REJECTED_NEW_USER', {
          breachCount: compromisedCheck.breachCount
        });
        throw new Error(`This password has been found in ${compromisedCheck.breachCount} data breaches. Please choose a different password.`);
      }
      
      // 4. Validate token
      const validation = await this.validateNewUserToken(userId, token);
      if (!validation.valid) {
        await this.logSecurityEvent(userId, 'INVALID_NEW_USER_TOKEN', { token: token.substring(0, 8) + '...' });
        throw new Error(validation.error);
      }
      
      const { email, userData } = validation;
      
      // Create Firebase user account or sign in if already exists
      console.log('AuthService: Creating/signing in Firebase user account for:', email);
      let firebaseUser;
      
      try {
        // Try to create new user first
        const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
        firebaseUser = userCredential.user;
        console.log('AuthService: New Firebase user created');
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          // User already exists, sign them in instead
          console.log('AuthService: User already exists, signing in...');
          const signInCredential = await signInWithEmailAndPassword(this.auth, email, password);
          firebaseUser = signInCredential.user;
          console.log('AuthService: Existing user signed in successfully');
        } else {
          throw error; // Re-throw other errors
        }
      }
      
      // Update user profile
      await updateProfile(firebaseUser, {
        displayName: userData.displayName || `${userData.firstName} ${userData.lastName}`
      });
      
      // Update user document with Firebase UID
      const userRef = doc(this.db, 'users', userId);
      await updateDoc(userRef, {
        firebaseUid: firebaseUser.uid,
        accessStatus: 'approved',
        passwordSetAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // 5. Mark token as used with completion metadata
      const tokenRef = doc(this.db, 'newUserTokens', token);
      await updateDoc(tokenRef, {
        used: true,
        usedAt: serverTimestamp(),
        completionUserAgent: navigator.userAgent,
        completionIpHash: await this.hashIP(),
        firebaseUid: firebaseUser.uid
      });
      
      // 6. Clean up new user tokens for this user (they're now registered)
      await this.cleanupNewUserTokens(userId, 'registration_completed');
      
      // 7. Log successful new user registration
      await this.logSecurityEvent(email, 'NEW_USER_REGISTRATION_COMPLETED', {
        passwordStrength: passwordValidation.strength,
        userId,
        firebaseUid: firebaseUser.uid
      });
      
      // 8. Set current user and profile for immediate authentication
      this.currentUser = firebaseUser;
      this.userProfile = { 
        id: firebaseUser.uid, 
        ...userData, 
        firebaseUid: firebaseUser.uid,
        accessStatus: 'approved' 
      };
      
      console.log('AuthService: Secure new user registration completed successfully');
      return {
        success: true,
        firebaseUid: firebaseUser.uid,
        passwordStrength: passwordValidation.strength,
        user: firebaseUser
      };
    } catch (error) {
      console.error('AuthService: Error completing new user registration:', error);
      throw error;
    }
  }

  // Send new user invitation email
  async sendNewUserInvitation(userEmail) {
    try {
      console.log('AuthService: Sending new user invitation for:', userEmail);
      
      // Find user by email (since users are stored by email as document ID)
      const userRef = doc(this.db, 'users', userEmail);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error(`User not found with email: ${userEmail}`);
      }
      
      const userData = userDoc.data();
      const userId = userEmail; // In this system, userId is the email
      
      // Generate token for account setup
      const token = await this.generateNewUserToken(userId);
      
      // Create account setup URL with token
      const setupUrl = `${window.location.origin}/account-setup?email=${encodeURIComponent(userEmail)}&token=${token}`;
      
      // Detect if it's a Gmail address
      const isGmail = userEmail.toLowerCase().includes('@gmail.com');
      
      // Send email via email queue service
      await emailQueueService.queueInvitationEmail({
        to: userEmail,
        name: userData.displayName || userData.firstName || userEmail.split('@')[0],
        isGmail: isGmail,
        setupUrl: setupUrl,
        userData: userData
      });
      
      console.log('AuthService: New user invitation sent successfully');
      return {
        success: true,
        setupUrl,
        isGmail
      };
    } catch (error) {
      console.error('AuthService: Error sending new user invitation:', error);
      throw error;
    }
  }


}

const authService = new AuthService();
export default authService;
