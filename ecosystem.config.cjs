// PM2配置 - Prophet永恒运行
module.exports = {
  apps: [
    {
      // Prophet Central Server - 主服务
      name: 'prophet-central',
      script: 'npm',
      args: 'run dev',
      cwd: './',

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
      restart_delay: 1000,  // 崩溃后1秒重启
      max_restarts: 100,    // 允许无限重启
      min_uptime: '10s',    // 最小运行时间

      // 进程管理
      kill_timeout: 5000,
      listen_timeout: 3000,

      // 时间配置
      time: true
    }
  ]
}
