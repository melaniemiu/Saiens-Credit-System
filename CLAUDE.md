# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

山恩互動表彰系統 (Saiens Interactive Recognition System) is a comprehensive employee development and recognition platform with LINE login integration. It combines credit-based recognition with a sophisticated skills management and job progression system to foster career development.

## Architecture

- **Frontend**: Next.js application with Tailwind CSS and shadcn/ui components
- **Backend**: Express.js API server with PostgreSQL database using Sequelize ORM
- **Authentication**: LINE Login with LIFF SDK, JWT for backend auth
- **Real-time Communication**: Socket.IO for instant notifications
- **Caching**: In-memory caching system with TTL and smart invalidation
- **Theme Support**: Next.js theme provider for dark/light mode

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

### Skills Management System (Core Feature)
1. **Interactive Skill Tree**
   - Game-style skill progression visualization with interactive nodes
   - Job-based skill organization (新手村 → 助理工程師 → 正式工程師 → 資深工程師)
   - Required vs optional skill categorization (必修/選修)
   - Modal skill detail views with learning and assessment information

2. **Skill Categories & Learning Methods**
   - **Categories**: 山恩DNA, 產品知識, 工具使用, 安裝知識, 安全操作, etc.
   - **Learning Methods**: 實體 (Physical), 線上 (Online)
   - **Assessment Methods**: 考卷考核 (Exam), 實作考核 (Practical)

3. **Progress Tracking & Assessment**
   - **Status Tracking**: not_started → in_progress → completed → certified
   - **Score Management**: 0-100 point assessment scores
   - **Attempt Tracking**: Number of assessment attempts per skill
   - **Timeline Management**: Start, completion, and certification dates
   - **Progress Statistics**: Skill completion rates and analytics

4. **Job Progression System**
   - **Job Hierarchy**: Structured career progression levels
   - **Job-Skill Mapping**: Each job position has specific required and optional skills
   - **User Job Assignment**: Users are assigned to specific job positions
   - **Skill Recommendations**: Suggested skills for next job level progression

### Credits System (Recognition Features)
1. **Credit Balance Management**
   - Credit giving and receiving tracking
   - Daily credit limit (configurable) with `dailyCreditsLimit` field
   - Daily credit reset mechanism
   - Remaining daily credits display with `remainingDailyCredits` tracking
   - Advanced daily statistics (today, yesterday, day-before)

2. **Credit Statistics & Visualization**
   - Total credits received tracking (`creditsReceived`)
   - Total credits sent tracking (`creditsSent`)
   - Visual progress indicator for daily credit usage
   - Daily credit usage cards with progress bars
   - Credit completion statistics and analytics

3. **Credit Transaction**
   - Give credit to individual employees
   - Bulk credit giving to multiple users simultaneously
   - Add reason/justification for credit giving
   - Transaction history recording with detailed metadata

4. **History & Records**
   - View received credits with timestamps and pagination
   - View sent credits (renamed from "given") with timestamps and pagination
   - Advanced filtering by date range, department, and search terms
   - CSV export functionality for credit data

5. **Real-time Notifications**
   - Instant Socket.IO notifications when receiving credits
   - Room-based notification architecture for user-specific updates
   - LIFF environment optimized socket connections
   - Connection status tracking with reconnection logic

### Administrative Features
1. **Credit Activity Monitoring**
   - View all credit transactions across the organization
   - Filter credits by department, date range, and search terms
   - Advanced pagination with sortField and sortOrder parameters
   - CSV export functionality for credit transaction data
   - Real-time credit activity updates

2. **User Management System**
   - Complete CRUD operations for user accounts
   - Advanced search and filtering (by name, email, employee ID)
   - Filter users by department and role
   - View user profile pictures in admin interface
   - Bulk user operations and management
   - User daily statistics and credit analytics

3. **Skills Administration**
   - Monitor skill progression across the organization
   - View skill completion statistics
   - Manage skill categories and requirements
   - Track learning and assessment progress

4. **System Administration**
   - Department management with hierarchical structure
   - Job position management and skill mapping
   - Sidebar navigation for admin sections
   - Role-based access control for admin features

### UI/UX Features
1. **Responsive Design**
   - Mobile-friendly interface optimized for LINE LIFF browser
   - Touch-friendly skill tree interface
   - Mobile navigation menu with smooth transitions

2. **Dashboard**
   - Personal user information card with profile picture display
   - Credit statistics visualization (creditsReceived, creditsSent)
   - Daily credit usage cards with progress visualization
   - Skills progress cards showing completion status
   - Suggested skills recommendations
   - Recent credit activity summary with real-time updates
   - Large, prominent "給予 Credit" action button
   - URL parameter handling for LIFF authentication flow

3. **Interactive Components**
   - Game-style interactive skill tree with node progression
   - User selection with advanced search capability
   - Form validation with comprehensive error handling
   - Real-time toast notifications for credits and achievements
   - Modal skill detail views with rich information

4. **Enhanced User Experience**
   - Profile pictures displayed throughout the interface
   - Automatic profile picture synchronization with LINE on login
   - Responsive avatar components with fallback icons
   - Hover effects and smooth transitions
   - Card hover animations with gradient effects
   - Confetti animations for credit giving/receiving
   - Offline credit detection with delayed celebrations
   - Theme support for personalized experience

5. **Performance & Caching**
   - In-memory API response caching with TTL
   - Smart cache invalidation for real-time data
   - Optimized mobile performance for LIFF environment
   - Connection status indicators and error handling

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
- `User`: Employee records with department and job association
  - `creditsSent` (renamed from `creditsGiven`)
  - `creditsReceived`
  - `remainingDailyCredits`
  - `dailyCreditsLimit`
  - `profilePicture`
  - `jobId` (foreign key to Job model)
- `Credit`: Records of credits given between users
- `Department`: Company departments with hierarchical structure
- `Job`: Job positions with skill requirements
  - Job hierarchy: 新手村 → 助理工程師 → 正式工程師 → 資深工程師
- `Skill`: Skills with categories, learning methods, and assessment methods
  - Categories: 山恩DNA, 產品知識, 工具使用, 安裝知識, 安全操作
  - Learning methods: 實體 (Physical), 線上 (Online)
  - Assessment methods: 考卷考核 (Exam), 實作考核 (Practical)
- `UserSkill`: User skill progress tracking
  - Status: not_started, in_progress, completed, certified
  - Score tracking (0-100), attempt counts, dates
- `JobSkill`: Job-skill relationship mapping
  - Required vs optional skills (必修/選修)

Database migrations:
- `rename-credits-given-to-sent.js`: Renamed `creditsGiven` to `creditsSent` for clarity
- `rename-department-id-column.js`: Standardized column naming from `DepartmentId` to `departmentId`
- `update-profile-pictures.js`: Added profile picture support
- `add-daily-credit-limit.js`: Added daily credit limit tracking
- `add-job-model-and-relation.js`: Added job model and user-job relationships
- `assign-jobs-to-existing-users.js`: Assigned job positions to existing users

Data seeding:
- Skills data imported from CSV file: `工程團隊 技能樹 - 工作表1.csv`
- Production database setup utilities for deployment

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

#### Authentication Routes
- `/api/auth/line`: LINE Login authentication (updates profile picture on login)
- `/api/auth/bind-employee`: Bind employee ID to LINE account (with profile picture)
- `/api/auth/logout`: Logout endpoint

#### Credit Management Routes
- GET `/api/credits/received`: Get received credits with pagination
- GET `/api/credits/sent`: Get sent credits with pagination (renamed from "given")
- GET `/api/credits/all`: Admin-only endpoint for all credits with filtering
- POST `/api/credits`: Give credit to a user
- POST `/api/credits/bulk`: Give credit to multiple users simultaneously

#### Skills Management Routes
- GET `/api/skills/user`: Get user's skill progress and completion status
- GET `/api/skills/job`: Get skills required for user's current job position
- GET `/api/skills/suggested`: Get suggested skills for next job level progression
- GET `/api/skills/stats`: Get skill completion statistics and analytics
- PUT `/api/skills/:skillId/progress`: Update skill learning progress and scores

#### User Management Routes
- GET `/api/users/me`: Get current user with credit and skill statistics
- GET `/api/users/daily-stats`: Get detailed daily credit statistics
- GET `/api/users/all`: Admin endpoint for user listing with advanced filtering

#### Admin Routes
- GET `/api/admin/users`: Admin user management with CRUD operations
- GET `/api/admin/credits/export`: CSV export for credit transaction data
- Various admin endpoints for user, department, and system management

#### Department & Job Routes
- `/api/departments`: Department management routes
- `/api/jobs`: Job position management and skill mapping routes

### Frontend API Routes
- `/api/auth/login`: LINE Login handler that talks to backend
- `/api/auth/bind-employee`: Employee ID binding handler with profile picture
- `/api/auth/logout`: Logout handler that clears cookies and storage
- `/api/auth/liff-redirect`: LIFF browser authentication redirect handler

## Key Files

### Frontend Files

#### Core Context & Libraries
- `context/auth-context.tsx`: Central authentication state management
- `context/socket-context.tsx`: Real-time Socket.IO communication management
- `lib/auth.ts`: Authentication utilities and token storage
- `lib/api.ts`: API client for backend communication
- `lib/cache.ts`: In-memory caching system with TTL and smart invalidation
- `lib/confetti.ts`: Multiple confetti animation systems
- `lib/token-utils.ts`: JWT token validation and management utilities
- `middleware.ts`: Route protection and auth verification

#### Authentication Components
- `components/liff-init.tsx`: LIFF SDK initialization with error handling
- `components/line-login-button.tsx`: Regular browser login button
- `components/line-auto-redirect.tsx`: Auto-login for LINE LIFF browser

#### Credit System Components
- `components/give-credit-button.tsx`: Primary action button component
- `components/give-credit-form.tsx`: Credit giving form with user selection
- `components/credit-stats.tsx`: Credit statistics visualization component
- `components/credit-history.tsx`: Credit transaction history component
- `components/daily-credits-card.tsx`: Daily credit usage visualization
- `components/recent-credits.tsx`: Recent credit activity display

#### Skills System Components
- `components/skill-progress-card.tsx`: Individual skill progress tracking
- `components/skill-roadmap.tsx`: Interactive game-style skill tree visualization
- `components/suggested-skills-card.tsx`: Recommended skills for progression

#### Admin Components
- `components/admin-credit-list.tsx`: Admin credit listing with advanced filtering
- `components/admin-navbar.tsx`: Admin navigation sidebar

#### UI Components
- `components/profile-soft-card.tsx`: Enhanced profile card with soft design
- `components/theme-provider.tsx`: Theme support for dark/light mode
- Various UI components in `components/ui/`

#### Pages & Routes
- `app/page.tsx`: Conditional rendering based on browser environment
- `app/dashboard/page.tsx`: Main dashboard with skills and credits
- `app/dashboard/skills/page.tsx`: Complete skills management interface
- `app/dashboard/give-credit/page.tsx`: Credit giving interface
- `app/dashboard/history/page.tsx`: Credit history with advanced filtering
- `app/admin/page.tsx`: Admin interface with sidebar navigation
- `app/admin/layout.tsx`: Admin layout with role-based access control
- `app/bind/page.tsx`: Employee binding page with profile picture support

#### API Routes
- `app/api/auth/login/route.ts`: LINE authentication handler
- `app/api/auth/bind-employee/route.ts`: Employee binding API route
- `app/api/auth/logout/route.ts`: Logout handler that clears tokens
- `app/api/auth/liff-redirect/route.ts`: LIFF browser authentication redirect

#### Hooks
- `hooks/use-user.ts`: User data management hook
- `hooks/use-offline-confetti.ts`: Offline credit detection and confetti management
- `hooks/use-toast.ts`: Toast notification management
- `hooks/use-media-query.ts`: Responsive design utilities

### Backend Files

#### Core Backend
- `backend/src/index.js`: Main backend entry point with Socket.IO integration

#### Controllers
- `backend/src/controllers/auth.controller.js`: Authentication logic with profile updates
- `backend/src/controllers/user.controller.js`: User data management and daily statistics
- `backend/src/controllers/admin.controller.js`: Admin functionality with CSV export
- `backend/src/controllers/credit.controller.js`: Credit transaction management with bulk operations
- `backend/src/controllers/skill.controller.js`: Skills management and progress tracking
- `backend/src/controllers/department.controller.js`: Department management

#### Models
- `backend/src/models/user.model.js`: User model with job association and daily limits
- `backend/src/models/credit.model.js`: Credit transaction model
- `backend/src/models/skill.model.js`: Skills with categories and assessment methods
- `backend/src/models/job.model.js`: Job positions and hierarchy
- `backend/src/models/user-skill.model.js`: User skill progress tracking
- `backend/src/models/job-skill.model.js`: Job-skill relationship mapping
- `backend/src/models/department.model.js`: Department structure

#### Routes
- `backend/src/routes/auth.routes.js`: Authentication endpoints
- `backend/src/routes/user.routes.js`: User management routes
- `backend/src/routes/admin.routes.js`: Admin management routes
- `backend/src/routes/credit.routes.js`: Credit transaction routes
- `backend/src/routes/skill.routes.js`: Skills management routes
- `backend/src/routes/department.routes.js`: Department routes

#### Utilities & Configuration
- `backend/src/config/db.config.js`: Database configuration
- `backend/src/utils/seed.js`: Database seeding utilities
- `backend/src/utils/setup-production-db.js`: Production database setup
- `backend/src/utils/run-migrations.js`: Migration execution utilities
- `backend/src/middlewares/auth.middleware.js`: JWT authentication middleware
- `backend/src/migrations/*`: Database migrations for schema evolution

### Configuration Files
- `components/navbar.tsx`: Main navigation including logout button
- `ecosystem.config.js`: PM2 configuration for concurrent development

## Recent Updates

### Skills Management System (Major Feature Addition)
- Complete skills management system with interactive skill tree
- Job progression hierarchy with skill requirements
- User skill progress tracking with scores and certifications
- Game-style skill visualization with node-based progression
- CSV-based skills data import and management

### Real-time Communication Integration
- Socket.IO integration for instant credit notifications
- Room-based notification architecture for user-specific updates
- LIFF environment optimized socket connections
- Connection status tracking with automatic reconnection

### Enhanced Credit System
- Daily credit limits with advanced statistics tracking
- Bulk credit giving functionality for multiple recipients
- CSV export capabilities for admin credit data
- Renamed "creditsGiven" to "creditsSent" for clarity
- Advanced filtering and pagination for credit history

### Performance & User Experience
- In-memory caching system with TTL and smart invalidation
- Multiple confetti animation systems for credit celebrations
- Offline credit detection with delayed notifications
- Theme support for personalized user experience
- Enhanced mobile optimization for LINE LIFF browser

### Database Architecture Evolution
- Added Job, Skill, UserSkill, and JobSkill models
- Comprehensive migration system for schema updates
- Production database setup utilities
- Skills data seeding from CSV files
- Standardized column naming conventions

### Administrative Enhancements
- Advanced user management with comprehensive filtering
- Skills administration and progress monitoring
- CSV export functionality for data analysis
- Enhanced sidebar navigation for admin sections
- Role-based access control improvements

### UI/UX Improvements
- Enhanced card hover animations with gradient effects
- Interactive skill tree with touch-friendly interface
- Daily credit usage visualization cards
- Suggested skills recommendations
- Profile picture integration throughout the interface
- URL parameter handling for smooth LIFF authentication flow