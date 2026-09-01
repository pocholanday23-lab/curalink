// PM2 process config for the Curalink app on a shared VPS.
// Usage (from the app directory):
//   pm2 start deploy/ecosystem.config.js
//   pm2 save && pm2 startup
module.exports = {
  apps: [
    {
      name: "curalink",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001",
      cwd: __dirname + "/..",
      instances: 1,
      autorestart: true,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: "3001",
      },
    },
  ],
};
