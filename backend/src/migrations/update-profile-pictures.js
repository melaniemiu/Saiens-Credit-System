// Migration to update user profile pictures on login
// This is not a database schema migration, but a note about the functionality added

/*
Changes made to update profile pictures on every login:

1. Updated auth.controller.js - lineLogin function:
   - Now updates user.profilePicture with the latest LINE profile picture on every login
   - Previously only updated on first binding

2. Updated auth.controller.js - bindEmployeeId function:
   - Now accepts profilePicture parameter from frontend
   - Updates user profile picture when binding employee ID

3. Updated frontend bind pages and API routes:
   - /app/bind/page.tsx - sends profile picture in bind request
   - /app/bind-employee/page.tsx - sends profile picture in bind request
   - /app/api/auth/bind-employee/route.ts - forwards profile picture to backend
   - /lib/api.ts - updated bindEmployeeId to accept optional profile picture

This ensures user profile pictures are always up to date with their LINE profile.
*/

console.log('Profile picture update functionality has been implemented.');
console.log('Users\' profile pictures will now update on every login.');