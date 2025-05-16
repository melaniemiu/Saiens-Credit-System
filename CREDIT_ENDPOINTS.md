# Credit Statistics Endpoints

## User Statistics
- **GET /api/users/me** - Returns current user profile with credit statistics:
  - `creditsReceived`: Total credits received by the user
  - `creditsGiven`: Total credits given by the user
  - `remainingDailyCredits`: Credits remaining for today
  - `dailyCreditResetDate`: When daily credits will reset

## Credit History Endpoints
- **GET /api/credits/received** - Get paginated list of credits received by current user
  - Query params: `page`, `limit`
  - Returns: credit details with sender information

- **GET /api/credits/given** - Get paginated list of credits given by current user
  - Query params: `page`, `limit`
  - Returns: credit details with receiver information

## Admin Endpoints
- **GET /api/credits/all** - Admin-only endpoint to get all credits in the system
  - Query params:
    - `page`, `limit`: Pagination
    - `departmentId`: Filter by department
    - `startDate`, `endDate`: Date range filtering
    - `searchTerm`: Search in credit reasons
  - Returns: All credit transactions with sender and receiver details

## Credit Operations
- **POST /api/credits** - Give credit to another user
  - Body: `{ receiverId, reason }`
  - Returns: Created credit and remaining daily credits

- **POST /api/credits/bulk** - Give credit to multiple users (counts as 1 daily credit)
  - Body: `{ receiverIds, reason }`
  - Returns: Created credits and remaining daily credits

## Data Structure
Credit statistics are embedded in the user object:
- `creditsReceived`: Running total of all received credits
- `creditsGiven`: Running total of all given credits
- `remainingDailyCredits`: Daily limit counter (resets daily)
- `dailyCreditResetDate`: ISO date when daily credits reset