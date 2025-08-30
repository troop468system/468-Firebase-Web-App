# Setup Firebase Authentication Admin User

Since we've removed the mock admin system, you need to create a real Firebase Authentication user for `admin@troop468.com`.

## Step 1: Enable Firebase Authentication

1. Go to: https://console.firebase.google.com/project/troop468-manage/overview
2. Sign in with: `troop468.system@gmail.com`
3. Navigate to: "Authentication" in the left sidebar
4. Click: "Get started"
5. Go to "Sign-in method" tab
6. Click "Email/Password"
7. Enable "Email/Password" (first toggle)
8. Click "Save"

## Step 2: Create Admin User

1. Go to "Authentication" → "Users" tab
2. Click "Add user"
3. Enter:
   - **Email**: `admin@troop468.com`
   - **Password**: `TroopAdmin2024!` (or your preferred secure password)
4. Click "Add user"

## Step 3: Test Login

1. Visit: https://troop468-manage.web.app/login
2. Enter:
   - **Email**: `admin@troop468.com`
   - **Password**: `TroopAdmin2024!` (or the password you set)
3. Click "Sign In"

## Step 4: Verify Admin Access

After login, you should see:
- ✅ Both "Pending Requests" and "Authorized Users" tabs in the Users page
- ✅ Full admin privileges throughout the application

## Important Notes

- The Firestore document for `admin@troop468.com` already exists with admin roles
- Firebase Auth will automatically link to this Firestore document via the user's UID
- No more mock accounts - everything is now real Firebase Authentication

## Troubleshooting

If login doesn't work:
1. Check that Firebase Authentication is enabled
2. Verify the user was created in Firebase Auth Users tab
3. Check browser console for error messages
