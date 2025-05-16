# PM2 Setup for Development

This project is configured to run both frontend and backend services using PM2 for easier development.

## Prerequisites

Install PM2 globally if you haven't already:
```bash
npm install -g pm2
```

## Commands

Start both frontend and backend:
```bash
npm run dev:all
```

Stop all services:
```bash
npm run dev:stop
```

Restart all services:
```bash
npm run dev:restart
```

View logs for all services:
```bash
npm run dev:logs
```

Delete all PM2 processes:
```bash
npm run dev:delete
```

## Configuration

The PM2 configuration is in `ecosystem.config.js` and includes:
- **Frontend**: Runs on port 4000 with Next.js turbopack
- **Backend**: Runs with the existing `npm run dev` command

Both services use their built-in file watching, so changes will auto-reload without PM2 intervention.

## View Individual Services

To view logs for a specific service:
```bash
pm2 logs frontend
pm2 logs backend
```

To view the status of all services:
```bash
pm2 list
```