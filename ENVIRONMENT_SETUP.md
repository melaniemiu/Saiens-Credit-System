# Environment Variables Setup Guide

This document explains how to properly configure environment variables for the Saiens Credit System.

## Production Environment Files

### Frontend Production Environment
**Path:** `/home/apps/saiensCreditSystem/shared/.env.production.frontend`

```env
NODE_ENV=production
NEXT_PUBLIC_LIFF_ID=your_production_liff_id
NEXT_PUBLIC_API_URL=https://ss-backend.unayung.cc/api
NEXT_PUBLIC_BACKEND_URL=https://ss-backend.unayung.cc
NEXT_PUBLIC_SOCKET_URL_FALLBACK=https://ss-backend.unayung.cc
```

### Backend Production Environment
**Path:** `/home/apps/saiensCreditSystem/shared/.env.production.backend`

```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://ss.unayung.cc

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=saiens_credit
DB_PASSWORD=32fabdd45cab!
DB_NAME=saiens_credit_production

# Authentication
JWT_SECRET=your_super_secure_production_jwt_secret
LIFF_CHANNEL_ID=your_liff_channel_id
LIFF_CHANNEL_SECRET=your_liff_channel_secret

# LINE API URLs (optional - uses defaults if not set)
LINE_VERIFY_TOKEN_URL=https://api.line.me/oauth2/v2.1/verify
LINE_USER_PROFILE_URL=https://api.line.me/v2/profile

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://ss.unayung.cc
```

## Development Environment Files

### Frontend Development
**Path:** `.env.local` (in project root)

```env
NEXT_PUBLIC_LIFF_ID=your_development_liff_id
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

### Backend Development
**Path:** `backend/.env`

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:4000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_dev_db_user
DB_PASSWORD=your_dev_db_password
DB_NAME=saiens_credit_dev

# Authentication
JWT_SECRET=development_jwt_secret_change_for_production
LIFF_CHANNEL_ID=your_liff_channel_id
LIFF_CHANNEL_SECRET=your_liff_channel_secret

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:4000,http://localhost:3000
```

## Critical Security Notes

1. **JWT_SECRET**: Must be different and secure in production
2. **LIFF_CHANNEL_SECRET**: Keep this secret and never commit to repository
3. **Database credentials**: Use strong passwords in production
4. **CORS origins**: Only include necessary domains

## LINE LIFF Configuration

Make sure your LINE LIFF app configuration matches your environment:

- **Development LIFF ID**: For localhost testing
- **Production LIFF ID**: For ss.unayung.cc domain
- **Endpoint URL**: Must match your domain (e.g., https://ss.unayung.cc)

## Deployment Process

1. Update environment files on server
2. Restart applications: `npm run prod:restart`
3. Verify environment variables are loaded correctly

## Troubleshooting

If you're getting CORS errors or API connection issues:
1. Check that environment variables are properly set
2. Verify CORS_ALLOWED_ORIGINS includes your frontend domain
3. Ensure API URLs point to correct backend
4. Check that LIFF_ID matches your LINE app configuration