# Deployment Guide

## PM2 Deployment to Linode Server (ss.unayung.cc)

This project is configured for automated deployment using PM2 deploy to your Linode server.

### Prerequisites

1. **SSH Access**: Ensure you have SSH access to `ss.unayung.cc` as root user
2. **Git Repository**: Update the repository URL in `ecosystem.config.js` line 31
3. **Server Setup**: Ensure Node.js, npm, and PM2 are installed on the server
4. **Database**: PostgreSQL should be set up and configured on the server

### Initial Server Setup

Before first deployment, ensure your server has:

```bash
# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 globally
npm install -g pm2

# Create deployment directory
mkdir -p /var/www/saiensCreditSystem
```

### Deployment Commands

#### First Time Setup
```bash
# Set up deployment structure on server
npm run deploy:setup
```

#### Deploy Updates
```bash
# Deploy latest changes from main branch
npm run deploy
```

#### Rollback
```bash
# Revert to previous deployment
npm run deploy:revert
```

### Production Management

#### Start/Stop Production Apps
```bash
# Start production apps
npm run prod:start

# Stop production apps
npm run prod:stop

# Restart production apps
npm run prod:restart

# View logs
npm run prod:logs

# Check status
npm run prod:status
```

### Server Configuration

The deployment is configured with:
- **Frontend**: Runs on port 3000 (Next.js production)
- **Backend**: Runs on port 5000 (Express.js API)
- **Deployment Path**: `/var/www/saiensCreditSystem`
- **Git Reference**: `origin/main`

### Environment Variables

Ensure these environment variables are set on your server:

#### Backend (.env in /var/www/saiensCreditSystem/backend/)
```env
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saiens_credit_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret
LIFF_CHANNEL_ID=your_liff_channel_id
LIFF_CHANNEL_SECRET=your_liff_channel_secret
```

### Deployment Process

When you run `npm run deploy`, PM2 will:

1. SSH to your server
2. Pull latest code from git repository
3. Install frontend dependencies
4. Build the Next.js application
5. Install backend dependencies
6. Reload PM2 processes with zero downtime

### Troubleshooting

#### Check deployment logs
```bash
# View PM2 logs on server
ssh root@ss.unayung.cc "pm2 logs"
```

#### Manual server commands
```bash
# SSH to server and check status
ssh root@ss.unayung.cc
cd /var/www/saiensCreditSystem
pm2 status
pm2 logs saiens-frontend-prod
pm2 logs saiens-backend-prod
```

#### Common Issues

1. **Repository Access**: Ensure your server has SSH access to your git repository
2. **Permissions**: Make sure `/var/www/saiensCreditSystem` has proper permissions
3. **Dependencies**: Check that all npm packages install correctly on the server
4. **Environment Variables**: Verify all required environment variables are set

### Nginx Configuration (Optional)

For production, you may want to set up Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name ss.unayung.cc;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Database Setup

#### First Time Database Setup

Before first deployment, set up the PostgreSQL database on the server:

```bash
ssh apps@ss.unayung.cc
cd /home/apps/saiensCreditSystem/current/backend

# Set up database (requires postgres superuser password)
npm run setup-db

# Run migrations (included in deployment)
npm run migrate

# Optional: seed with initial data
npm run seed
```

#### Environment Configuration

Make sure your production backend environment file (`/home/apps/saiensCreditSystem/shared/.env.production.backend`) contains:

```env
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=unayung
DB_PASSWORD=
DB_NAME=saiens_credit_production
JWT_SECRET=your_jwt_secret
LIFF_CHANNEL_ID=your_liff_channel_id
LIFF_CHANNEL_SECRET=your_liff_channel_secret
```

#### Database Setup Script

The `npm run setup-db` script will:
1. Create the database `saiens_credit_production` if it doesn't exist
2. Create the user `unayung` if it doesn't exist
3. Grant necessary privileges
4. Test the connection

**Note**: You'll need the PostgreSQL superuser password. Set it as `POSTGRES_PASSWORD` environment variable if different from default.