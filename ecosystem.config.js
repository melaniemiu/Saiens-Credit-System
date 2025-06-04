module.exports = {
  apps: [
    {
      name: "frontend",
      script: "node_modules/.bin/next",
      args: "dev --turbopack -p 4000",
      cwd: "./",
      watch: false, // Let Next.js handle auto-reload
      env: {
        NODE_ENV: "development",
      },
    },
    {
      name: "backend",
      script: "npm",
      args: "run dev",
      cwd: "./backend",
      watch: false, // npm run dev already watches files
      env: {
        NODE_ENV: "development",
      },
    },
  ],

  // Production apps configuration
  deploy: {
    production: {
      user: "apps",
      host: "ss.unayung.cc",
      ref: "origin/main",
      repo: "git@github.com:Unayung/SaiensCreditSystem.git",
      path: "/home/apps/saiensCreditSystem",
      "pre-deploy-local": "",
      "post-deploy":
        "npm install --legacy-peer-deps && npm run build && cd backend && npm install && cd .. && /home/apps/.yarn/bin/pm2 reload ecosystem.config.js --env production",
      "pre-setup": "",
    },
  },

  // Production PM2 apps
  production: [
    {
      name: "saiens-frontend-prod",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      cwd: "./",
      instances: 1,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "saiens-backend-prod",
      script: "src/index.js",
      cwd: "./backend",
      instances: 1,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
    },
  ],
};
