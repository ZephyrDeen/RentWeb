// PM2 配置文件 - 用于在 EC2 上管理 Node.js 进程

module.exports = {
  apps: [
    {
      name: 'rentweb',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: './',
      instances: 2, // 使用 2 个实例实现负载均衡
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      autorestart: true,
      max_memory_restart: '1G',
      watch: false,
    },
  ],
};
