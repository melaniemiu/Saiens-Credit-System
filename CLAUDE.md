# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Saiens Credit System is an employee recognition system with LINE login integration that allows employees to give credits to each other.

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

2. **System Administration**
   - User account management (CRUD operations)
   - Department management

### UI/UX Features
1. **Responsive Design**
   - Mobile-friendly interface
   - Mobile navigation menu

2. **Dashboard**
   - Personal user information card
   - Credit statistics visualization
   - Recent credit activity summary

3. **Form Components**
   - User selection with search capability
   - Form validation
   - Success/error notifications via toast messages

## Development Commands

### Frontend Commands

```bash
# Install dependencies
npm install

# Run development server
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

# Run development server with auto-reload
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
- `Credit`: Records of credits given between users
- `Department`: Company departments

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
- `/api/auth/line`: LINE Login authentication
- `/api/auth/logout`: Logout endpoint
- `/api/credits`: Credit management routes
- `/api/users`: User management routes

### Frontend API Routes
- `/api/auth/login`: LINE Login handler that talks to backend
- `/api/auth/logout`: Logout handler that clears cookies and storage

## Key Files

- `context/auth-context.tsx`: Central authentication state management
- `middleware.ts`: Route protection and auth verification
- `lib/auth.ts`: Authentication utilities and token storage
- `lib/api.ts`: API client for backend communication
- `components/liff-init.tsx`: LIFF SDK initialization with error handling
- `components/line-login-button.tsx`: Regular browser login button
- `components/line-auto-redirect.tsx`: Auto-login for LINE LIFF browser
- `lib/direct-liff.ts`: Simplified LIFF integration for mobile
- `app/page.tsx`: Conditional rendering based on browser environment
- `app/api/auth/login/route.ts`: LINE authentication handler
- `app/api/auth/logout/route.ts`: Logout handler that clears tokens
- `backend/src/index.js`: Main backend entry point
- `backend/src/controllers`: Business logic handlers
- `backend/src/controllers/auth.controller.js`: Authentication logic
- `components/navbar.tsx`: Main navigation including logout button