# Profile Picture Update Implementation

## Overview
User profile pictures are now automatically updated from LINE every time a user logs in through any method (desktop or LIFF browser).

## Changes Made

### Backend Changes

1. **auth.controller.js - lineLogin function**
   - Added profile picture update for existing users on login
   - Line 107: `user.profilePicture = lineUserData.picture || user.profilePicture;`
   - Previously only updated lastLogin time

2. **auth.controller.js - bindEmployeeId function**
   - Now accepts `profilePicture` parameter in request body
   - Line 233: Added `profilePicture` to destructured parameters
   - Lines 267-269: Updates profile picture if provided

### Frontend Changes

1. **app/bind/page.tsx**
   - Line 160: Added `profilePicture: picture` to bind request

2. **app/bind-employee/page.tsx**
   - Line 134: Updated to pass `picture` parameter to bindEmployeeId function

3. **app/api/auth/bind-employee/route.ts**
   - Line 6: Added `profilePicture` to destructured request parameters
   - Line 24: Includes `profilePicture` in backend request

4. **lib/api.ts**
   - Line 150: Updated `bindEmployeeId` function signature to accept optional `profilePicture`
   - Line 154: Includes `profilePicture` in request body

## Benefits

1. **Always Current**: User profile pictures are automatically synced with their LINE profile
2. **Consistent Updates**: Works for all login methods - regular desktop login and LIFF browser
3. **No User Action Required**: Updates happen automatically during the login process

## Testing

To test this functionality:
1. Change your LINE profile picture
2. Log out and log back in to the system
3. Your profile picture should automatically update to the new one