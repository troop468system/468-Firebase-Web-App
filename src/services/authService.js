import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
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
      await this.requireApprovedProfile(result.user);
      this.currentUser = result.user;
      return this.currentUser;
    } catch (error) {
      console.error('Google sign-in error:', error);
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

  // Send password reset email
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(userId, updates) {
    try {
      const userRef = doc(this.db, 'users', userId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(userRef, updateData);
      
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
  async getPendingRequests() {
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
      console.log('AuthService: Pending requests:', requests);
      
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

  // Submit registration request
  async submitRegistrationRequest(requestData) {
    try {
      console.log('AuthService: Starting registration submission');
      console.log('AuthService: Request data:', requestData);
      
      const requestRef = doc(collection(this.db, 'registrationRequests'));
      console.log('AuthService: Created document reference:', requestRef.id);
      
      const request = {
        ...requestData,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      console.log('AuthService: Final request object:', request);
      console.log('AuthService: Attempting to write to Firestore...');
      
      await setDoc(requestRef, request);
      
      console.log('AuthService: Successfully wrote to Firestore');
      return requestRef.id;
    } catch (error) {
      console.error('AuthService: Submit registration error:', error);
      console.error('AuthService: Error code:', error.code);
      console.error('AuthService: Error message:', error.message);
      throw error;
    }
  }

  // Approve registration request
  async approveRegistrationRequest(requestId) {
    try {
      const requestRef = doc(this.db, 'registrationRequests', requestId);
      await updateDoc(requestRef, {
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: this.currentUser?.uid,
        updatedAt: serverTimestamp()
      });

      // Get the request data to create invitation tokens and queue emails
      const requestDoc = await getDoc(requestRef);
      if (requestDoc.exists()) {
        const requestData = requestDoc.data();
        // Create/activate profiles for each participant by email (migrate to UID on first login)
        const upserts = [];
        const pushUpsert = (email, displayName, roles, extra = {}) => {
          if (!email) return;
          const profileRef = doc(this.db, 'users', email);
          const data = {
            email,
            displayName: (displayName || '').trim() || email.split('@')[0],
            roles: roles && roles.length ? roles : ['user'],
            accessStatus: 'approved', // Auto-approve from registration approval
            scoutingStatus: 'Registered', // Default scouting status
            familyId: requestId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            ...extra
          };
          upserts.push(setDoc(profileRef, data, { merge: true }));
        };

        // Collect all parent emails for scout profile
        const parentEmails = [];
        if (requestData.includeFather !== false && requestData.fatherEmail) {
          parentEmails.push(requestData.fatherEmail.toLowerCase().trim());
        }
        if (requestData.includeMother !== false && requestData.motherEmail) {
          parentEmails.push(requestData.motherEmail.toLowerCase().trim());
        }

        // Scout profile with parent links
        pushUpsert(
          requestData.scoutEmail,
          requestData.scoutPreferredName || `${requestData.scoutFirstName || ''} ${requestData.scoutLastName || ''}`,
          ['scout'],
          {
            familyRole: 'scout',
            parentEmails: parentEmails,
            firstName: requestData.scoutFirstName || '',
            lastName: requestData.scoutLastName || '',
            dob: requestData.scoutDOB || requestData.dob || '',
            phone: requestData.scoutPhone || requestData.mainPhone || '',
            patrol: requestData.scoutPatrol || null
          }
        );

        // Father profile with child links
        if (requestData.includeFather !== false && requestData.fatherEmail) {
          pushUpsert(
            requestData.fatherEmail,
            requestData.fatherPreferredName || `${requestData.fatherFirstName || ''} ${requestData.fatherLastName || ''}`,
            ['parent'],
            {
              familyRole: 'parent',
              relation: 'father',
              childEmails: [requestData.scoutEmail.toLowerCase().trim()],
              firstName: requestData.fatherFirstName || '',
              lastName: requestData.fatherLastName || '',
              phone: requestData.fatherPhone || ''
            }
          );
        }

        // Mother profile with child links
        if (requestData.includeMother !== false && requestData.motherEmail) {
          pushUpsert(
            requestData.motherEmail,
            requestData.motherPreferredName || `${requestData.motherFirstName || ''} ${requestData.motherLastName || ''}`,
            ['parent'],
            {
              familyRole: 'parent',
              relation: 'mother',
              childEmails: [requestData.scoutEmail.toLowerCase().trim()],
              firstName: requestData.motherFirstName || '',
              lastName: requestData.motherLastName || '',
              phone: requestData.motherPhone || ''
            }
          );
        }
        await Promise.all(upserts);
        
        // Try to queue approval emails, but don't fail the approval if email fails
        try {
          await emailQueueService.queueApprovalEmails(requestData);
          console.log('✅ Registration approved! Emails queued to Google Sheets for automatic sending.');
        } catch (emailError) {
          console.warn('⚠️ Registration approved but email queuing failed:', emailError);
          console.log('✅ Registration approved! (Email sending failed - please notify users manually)');
          // Don't throw the error - approval should succeed even if email fails
        }

        // Delete the registration request after successful approval
        try {
          await deleteDoc(requestRef);
          console.log('🗑️ Registration request deleted after successful approval');
        } catch (deleteError) {
          console.warn('⚠️ Failed to delete registration request after approval:', deleteError);
          // Don't throw the error - approval should succeed even if cleanup fails
        }
      }
    } catch (error) {
      console.error('Approve registration error:', error);
      throw error;
    }
  }

  // Reject registration request
  async rejectRegistrationRequest(requestId, reason = '') {
    try {
      const requestRef = doc(this.db, 'registrationRequests', requestId);
      await updateDoc(requestRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectedBy: this.currentUser?.uid,
        rejectionReason: reason,
        updatedAt: serverTimestamp()
      });
      
      // Get the request data and queue rejection emails
      const requestDoc = await getDoc(requestRef);
      if (requestDoc.exists()) {
        const requestData = requestDoc.data();
        
        // Queue rejection emails to Google Sheets for Apps Script processing
        await emailQueueService.queueRejectionEmails(requestData, reason);
        
        console.log('❌ Registration rejected. Emails queued to Google Sheets for automatic sending.');
      }
    } catch (error) {
      console.error('Reject registration error:', error);
      throw error;
    }
  }



  // Delete user (admin only)
  async deleteUser(userId) {
    try {
      await deleteDoc(doc(this.db, 'users', userId));
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
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

  // Get pending registration requests
  async getPendingRegistrationRequests() {
    try {
      console.log('AuthService: Getting pending registration requests...');
      const requestsQuery = query(
        collection(this.db, 'registrationRequests'),
        where('status', '==', 'pending')
      );
      
      const snapshot = await getDocs(requestsQuery);
      const requests = [];
      snapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort by createdAt in JavaScript instead of Firestore to avoid index requirement
      requests.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime; // Descending order (newest first)
      });
      
      console.log('AuthService: Pending requests:', requests);
      return requests;
    } catch (error) {
      console.error('AuthService: Error getting pending requests:', error);
      throw error;
    }
  }



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


}

const authService = new AuthService();
export default authService;
