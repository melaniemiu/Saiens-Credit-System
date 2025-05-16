# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

山恩互動表彰系統 (Saiens Interactive Recognition System) is an employee recognition system with LINE login integration that allows employees to give credits to each other.

## Architecture

- **Frontend**: Next.js application with Tailwind CSS and shadcn/ui components
- **Backend**: Express.js API server with PostgreSQL database using Sequelize ORM
- **Authentication**: LINE Login with LIFF SDK, JWT for backend auth

## Feature Snapshot

### Authentication Features
1. **LINE Login Integration**
   - LIFF (LINE Front-end Framework) integration
   - Secure token-based authentication
   - User profile retrieval from LINE
   - Auto-login for users in LINE LIFF browser
   - Hardcoded LIFF_ID for mobile reliability
   - Fallback mechanisms for initialization failures

2. **Session Management**
   - Cookie-based authentication sessions
   - JWT token storage in both localStorage and sessionStorage
   - Auto-redirection based on authentication state
   - Optimized mobile authentication flow
   - Browser detection for LINE LIFF environment
   - Secure logout process
   - Automatic profile picture updates on login

3. **Role-based Access Control**
   - User and Admin role separation
   - Protected routes based on authentication status
   - Admin-only access to admin dashboard

### Credits System (Core Features)
1. **Credit Balance Management**
   - Credit giving and receiving tracking
   - Daily credit limit (configurable)
   - Daily credit reset mechanism
   - Remaining daily credits display

2. **Credit Statistics**
   - Total credits received tracking
   - Total credits given tracking
   - Visual progress indicator for daily credit usage

3. **Credit Transaction**
   - Give credit to other employees
   - Add reason/justification for credit giving
   - Transaction history recording

4. **History & Records**
   - View received credits with timestamps
   - View given credits with timestamps
   - Pagination for credit history

### Administrative Features
1. **Credit Activity Monitoring**
   - View all credit transactions across the organization
   - Filter credits by department
   - Date range filtering
   - Search in credit reasons
   - Pagination support

2. **System Administration**
   - User account management (CRUD operations)
   - User search and filtering (by name, email, employee ID)
   - Filter users by department and role
   - View user profile pictures in admin interface
   - Create, edit, and delete users
   - Department management
   - Sidebar navigation for admin sections

### UI/UX Features
1. **Responsive Design**
   - Mobile-friendly interface
   - Mobile navigation menu

2. **Dashboard**
   - Personal user information card with profile picture display
   - Credit statistics visualization (creditsReceived, creditsSent)
   - Recent credit activity summary
   - Large, prominent "給予 Credit" action button
   - URL parameter handling for LIFF authentication flow

3. **Form Components**
   - User selection with search capability
   - Form validation
   - Success/error notifications via toast messages

4. **Enhanced User Experience**
   - Profile pictures displayed in personal information panel
   - Automatic profile picture synchronization with LINE on login
   - Responsive avatar components with fallback icons
   - Hover effects and smooth transitions
   - Card hover animations with gradient effects

## Development Commands

### PM2 Development (Run Both Frontend & Backend)

```bash
# Install PM2 globally (if not already installed)
npm install -g pm2

# Run both frontend and backend concurrently
npm run dev:all

# Stop all services
npm run dev:stop

# Restart all services
npm run dev:restart

# View logs
npm run dev:logs

# Delete all PM2 processes
npm run dev:delete
```

### Frontend Commands

```bash
# Install dependencies
npm install

# Run development server (standalone)
npm run dev

# Build for production
npm run build
npm start
```

### Backend Commands

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Run development server with auto-reload (standalone)
npm run dev

# Run production server
npm start

# Database seeding
npm run seed        # Seeds database without dropping tables
npm run seed:force  # Recreates and seeds database (drops all tables)
```

## Database Configuration

The backend uses PostgreSQL with Sequelize ORM. Database connection is configured in:
- `backend/src/config/db.config.js`
- Models are defined in `backend/src/models/`

Important models:
- `User`: Employee records with department association
  - `creditsSent` (renamed from `creditsGiven`)
  - `creditsReceived`
  - `remainingDailyCredits`
  - `profilePicture`
- `Credit`: Records of credits given between users
- `Department`: Company departments

Database migrations:
- `rename-credits-given-to-sent.js`: Renamed `creditsGiven` to `creditsSent` for clarity
- `rename-department-id-column.js`: Standardized column naming from `DepartmentId` to `departmentId`
- `update-profile-pictures.js`: Added profile picture support
- `add-daily-credit-limit.js`: Added daily credit limit tracking

## Authentication Flow

### Regular Browser Flow
1. User clicks the LINE Login button on the homepage
2. LIFF SDK initializes and opens LINE authentication
3. Frontend gets LINE ID token after successful authentication
4. Token is sent to backend via `/api/auth/login` NextJS route
5. Backend validates token with LINE API and creates/finds user
6. JWT token is returned and stored in cookies, localStorage, and sessionStorage
7. Middleware validates JWT token for protected routes

### LINE LIFF Browser Flow (Mobile)
1. System automatically detects LINE LIFF browser environment
2. LIFF SDK initializes with hardcoded LIFF_ID for reliability
3. Frontend retrieves LINE ID token without manual login step
4. Auto-login process sends token to backend
5. Upon successful authentication, user is automatically redirected to dashboard
6. Error handling and status messages guide user through the process

## API Routes

### Backend API Endpoints
- `/api/auth/line`: LINE Login authentication (updates profile picture on login)
- `/api/auth/bind-employee`: Bind employee ID to LINE account (with profile picture)
- `/api/auth/logout`: Logout endpoint
- `/api/credits`: Credit management routes
  - GET `/api/credits/received`: Get received credits with pagination
  - GET `/api/credits/given`: Get given credits with pagination  
  - GET `/api/credits/all`: Admin-only endpoint for all credits
  - POST `/api/credits`: Give credit to a user
  - POST `/api/credits/bulk`: Give credit to multiple users
- `/api/users`: User management routes
  - GET `/api/users/me`: Get current user with credit statistics
- `/api/admin/users`: Admin user management routes with CRUD operations
- `/api/departments`: Department management routes

### Frontend API Routes
- `/api/auth/login`: LINE Login handler that talks to backend
- `/api/auth/bind-employee`: Employee ID binding handler with profile picture
- `/api/auth/logout`: Logout handler that clears cookies and storage
- `/api/auth/liff-redirect`: LIFF browser authentication redirect handler

## Key Files

### Frontend Files
- `context/auth-context.tsx`: Central authentication state management
- `middleware.ts`: Route protection and auth verification
- `lib/auth.ts`: Authentication utilities and token storage
- `lib/api.ts`: API client for backend communication
- `components/liff-init.tsx`: LIFF SDK initialization with error handling
- `components/line-login-button.tsx`: Regular browser login button
- `components/line-auto-redirect.tsx`: Auto-login for LINE LIFF browser
- `components/give-credit-button.tsx`: Primary action button component
- `components/credit-stats.tsx`: Credit statistics visualization component
- `components/credit-history.tsx`: Credit transaction history component
- `components/admin-credit-list.tsx`: Admin credit listing component
- `app/page.tsx`: Conditional rendering based on browser environment
- `app/dashboard/page.tsx`: Main dashboard with profile picture display
- `app/admin/page.tsx`: Admin interface with sidebar navigation
- `app/admin/layout.tsx`: Admin layout with role-based access control
- `app/bind/page.tsx`: Employee binding page with profile picture support
- `app/bind-employee/page.tsx`: Alternative binding page
- `app/api/auth/login/route.ts`: LINE authentication handler
- `app/api/auth/bind-employee/route.ts`: Employee binding API route
- `app/api/auth/logout/route.ts`: Logout handler that clears tokens

### Backend Files
- `backend/src/index.js`: Main backend entry point
- `backend/src/controllers/auth.controller.js`: Authentication logic with profile updates
- `backend/src/controllers/user.controller.js`: User data management
- `backend/src/controllers/admin.controller.js`: Admin functionality
- `backend/src/controllers/credit.controller.js`: Credit transaction management
- `backend/src/models/user.model.js`: User model with creditsSent field
- `backend/src/models/credit.model.js`: Credit transaction model
- `backend/src/migrations/*`: Database migrations for schema changes

### Configuration Files
- `components/navbar.tsx`: Main navigation including logout button
- `ecosystem.config.js`: PM2 configuration for concurrent development

## Recent Updates

### Profile Picture Integration (Latest)
- Profile pictures now automatically sync from LINE on every login
- Pictures are displayed in dashboard personal information panel
- Admin interface shows user profile pictures
- Fallback avatars with user icon for missing pictures

### Database Schema Changes
- Renamed `creditsGiven` to `creditsSent` for clarity
- Standardized column naming (e.g., `DepartmentId` to `departmentId`)
- Added profile picture support to user model

### Admin Interface Enhancement
- New sidebar navigation for admin sections
- Improved user management with search and filtering
- Credit activity monitoring with advanced filters
- User CRUD operations with profile picture display

### UI/UX Improvements
- Enhanced card hover animations with gradient effects
- Improved dashboard layout with better visual hierarchy
- URL parameter handling for smooth LIFF authentication flow
- Better loading states and error handling