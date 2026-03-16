// PM2配置 - Prophet守护所有项目
module.exports = {
  apps: [
    // 1. Prophet Central - 核心守护服务
    {
      name: 'prophet-central',
      script: 'npm',
      args: 'run dev',
      cwd: '/Users/zhangjingwei/Desktop/New CC/prophet-central',

      // 运行配置
      instances: 1,
      exec_mode: 'fork',

      // 自动重启策略
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',

      // 环境变量
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        PROPHET_MODE: 'eternal'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
        PROPHET_MODE: 'eternal'
      },

      // 日志
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,

      // 重启策略
      restart_delay: 2000,  // 崩溃后2秒重启
      max_restarts: 50,     // 最大重启次数
      min_uptime: '10s',    // 最小运行时间

      // 进程管理
      kill_timeout: 5000,
      listen_timeout: 3000,

      // 时间配置
      time: true
    },

    // 2. VideoPlay Web - 前端应用
    {
      name: 'videoplay-web',
      script: 'npm',
      args: 'run dev',
      cwd: '/Users/zhangjingwei/Desktop/videoplay/apps/web',

      // 运行配置
      instances: 1,
      exec_mode: 'fork',

      // 自动重启策略
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',  // Next.js需要更多内存

      // 环境变量
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000
      },

      // 日志
      error_file: '/Users/zhangjingwei/Desktop/videoplay/logs/web-error.log',
      out_file: '/Users/zhangjingwei/Desktop/videoplay/logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,

      // 重启策略
      restart_delay: 2000,
      max_restarts: 50,
      min_uptime: '10s',

      // 进程管理
      kill_timeout: 5000,
      listen_timeout: 3000,

      // 时间配置
      time: true
    },

    // 3. VideoPlay API - 后端服务
    {
      name: 'videoplay-api',
      script: 'npm',
      args: 'run dev',
      cwd: '/Users/zhangjingwei/Desktop/videoplay/apps/api',

      // 运行配置
      instances: 1,
      exec_mode: 'fork',

      // 自动重启策略
      autorestart: true,
      watch: false,
      max_memory_restart: '1.5G',  // API with workers

      // 环境变量
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 4000
      },

      // 日志
      error_file: '/Users/zhangjingwei/Desktop/videoplay/logs/api-error.log',
      out_file: '/Users/zhangjingwei/Desktop/videoplay/logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,

      // 重启策略
      restart_delay: 2000,
      max_restarts: 50,
      min_uptime: '10s',

      // 进程管理
      kill_timeout: 5000,
      listen_timeout: 3000,

      // 时间配置
      time: true
    }
  ]
}
