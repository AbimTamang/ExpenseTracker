/**
 * PM2 production config
 *
 * Setup on VM:
 *   cd ~/ExpenseTracker
 *   git pull
 *   cd expense-tracker && npm run build
 *   cd .. && pm2 delete all
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 */
module.exports = {
  apps: [
    {
      name: "backend",
      cwd: "./backend",
      script: "server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "frontend",
      cwd: "./expense-tracker",
      script: "npm",
      args: "run preview",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
