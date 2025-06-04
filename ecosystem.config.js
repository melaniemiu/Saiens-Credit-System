module.exports = {
  apps: [
    {
      name: "saiens-frontend-dev",
      script: "node_modules/.bin/next",
      args: "dev --turbopack -p 4000",
      cwd: "./",
      watch: false,
      env: {
        NODE_ENV: "development",
      },
    },
    {
      name: "saiens-backend-dev",
      script: "npm",
      args: "run dev",
      cwd: "./backend",
      watch: false,
      env: {
        NODE_ENV: "development",
      },
    },
    {
      name: "saiens-frontend-prod",
      script: "node_modules/.bin/next",
      args: "start -p 4000",
      cwd: "./",
      instances: 1,
      exec_mode: "cluster",
      env_file: ".env.production",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
    },
    {
      name: "saiens-backend-prod",
      script: "src/index.js",
      cwd: "./backend",
      instances: 1,
      exec_mode: "cluster",
      env_file: ".env",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
    },
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: "apps",
      host: "ss.unayung.cc",
      ref: "origin/main",
      repo: "git@github.com:Unayung/SaiensCreditSystem.git",
      path: "/home/apps/saiensCreditSystem",
      "pre-deploy-local": "",
      "post-deploy":
        "ln -sf /home/apps/saiensCreditSystem/shared/.env.production.frontend .env.production && npm install --legacy-peer-deps && npm run build && cd backend && ln -sf /home/apps/saiensCreditSystem/shared/.env.production.backend .env && npm install && npm run migrate && cd .. && /home/apps/.yarn/bin/pm2 delete all && /home/apps/.yarn/bin/pm2 start saiens-frontend-prod saiens-backend-prod",
      "pre-setup": "",
    },
  },
};
