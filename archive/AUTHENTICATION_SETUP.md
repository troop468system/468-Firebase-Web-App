# Troop 468 Manager - Authentication Setup

## 🔐 Authentication System Overview

The application now includes a comprehensive user management system with Firebase Authentication and custom registration workflow.

## 🏗️ System Architecture

### User Roles
- **Admin**: Full permissions, can manage users and approve registrations
- **Approver**: Can approve registrations (reserved for future use)
- **User**: Basic user permissions (reserved for future use)
- **Scout**: Scout member
- **Parent**: Parent/guardian

### Registration Workflow
1. **Registration Request**: Users fill out a form with scout, father, and mother information
2. **Admin Review**: Admins review and approve/reject requests in the Users page
3. **Invitation Emails**: Upon approval, separate invitation emails are sent to each family member
4. **Account Creation**: Each person clicks their invitation link to create their account
5. **Login**: Users can then log in normally

## 🚀 Setup Instructions

### 1. Firebase Configuration
Create a `.env` file in the root directory with your Firebase credentials:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 2. Firebase Setup
1. Enable Authentication in Firebase Console
2. Enable Email/Password sign-in method
3. Set up Firestore database with the following collections:
   - `users`: User profiles and roles
   - `registrationRequests`: Pending registration requests
   - `invitationTokens`: Invitation tokens for sign-up

### 3. Firestore Rules
Configure Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
        resource.data.roles != null && 
        'admin' in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles;
      allow write: if request.auth != null && 
        'admin' in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles;
    }
    
    // Only admins can manage registration requests
    match /registrationRequests/{requestId} {
      allow read, write: if request.auth != null && 
        'admin' in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles;
      allow create: if true; // Allow anonymous registration requests
    }
    
    // Invitation tokens are readable by anyone with the token
    match /invitationTokens/{tokenId} {
      allow read: if true;
      allow write: if request.auth != null && 
        'admin' in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles;
    }
  }
}
```

### 4. Create First Admin User
Since the system requires an admin to approve registrations, you'll need to create the first admin manually:

1. Sign up through the registration form
2. In Firebase Console, go to Firestore
3. Find the user document and add `"admin"` to their roles array

## 📱 Usage

### For New Users
1. Go to `/register` to fill out the registration form
2. Wait for admin approval
3. Check email for invitation link
4. Click invitation link and complete account setup
5. Sign in at `/login`

### For Admins
1. Go to `/users` to see pending registration requests
2. Review and approve/reject requests
3. Manage user roles in the authorized users tab

## 🔧 Key Components

### Authentication Service (`src/services/authService.js`)
- Handles all Firebase Auth operations
- Manages user profiles and roles
- Handles registration workflow

### User Management (`src/pages/Users.js`)
- Admin interface for managing users
- Pending requests and authorized users tabs
- Role management

### Registration Form (`src/components/RegistrationForm.js`)
- Multi-family member registration
- Validation and submission

### Custom Sign-up (`src/pages/SignUp.js`)
- Token-based invitation sign-up
- Pre-filled user information

## 🛡️ Security Features

- Role-based access control
- Protected routes requiring authentication
- Invitation-only registration system
- Firestore security rules
- Token-based invitations with expiration

## 📝 TODO for Production

1. Set up email service (Firebase Functions) for sending invitation emails
2. Configure proper Firestore security rules
3. Add email templates for invitations
4. Implement password reset functionality
5. Add user profile editing
6. Set up monitoring and logging
