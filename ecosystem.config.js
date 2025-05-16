module.exports = {
  apps: [
    {
      name: 'frontend',
      script: 'node_modules/.bin/next',
      args: 'dev --turbopack -p 4000',
      cwd: './',
      watch: false,  // Let Next.js handle auto-reload
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'backend',
      script: 'npm',
      args: 'run dev',
      cwd: './backend',
      watch: false,  // npm run dev already watches files
      env: {
        NODE_ENV: 'development'
      }
    }
  ]
}