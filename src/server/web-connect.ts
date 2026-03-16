/**
 * Web Connect - 一个链接对接
 * 访问URL即可连接项目
 */

import type { FastifyInstance } from 'fastify'
import { randomBytes } from 'crypto'

export function setupWebConnect(app: FastifyInstance, db: any) {
  // 生成连接链接
  app.get('/connect/generate', async (req: any, reply) => {
    const { projectPath, projectName } = req.query

    if (!projectPath) {
      return reply.code(400).send({ error: 'projectPath required' })
    }

    // 生成一次性token
    const token = randomBytes(32).toString('hex')

    // 存储token（5分钟有效）
    await db.connectToken.create({
      data: {
        token,
        projectPath,
        projectName: projectName || 'Unnamed Project',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    })

    const connectUrl = `http://localhost:3001/connect/${token}`

    return {
      token,
      url: connectUrl,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(connectUrl)}`,
      expiresIn: '5分钟',
    }
  })

  // 访问链接即连接
  app.get('/connect/:token', async (req: any, reply) => {
    const { token } = req.params

    // 验证token
    const tokenData = await db.connectToken.findUnique({
      where: { token },
    })

    if (!tokenData || tokenData.expiresAt < new Date()) {
      return reply.type('text/html').send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>连接失败</title>
          <meta charset="utf-8">
          <style>
            body { font-family: sans-serif; text-align: center; padding: 50px; }
            .error { color: #e74c3c; font-size: 24px; }
          </style>
        </head>
        <body>
          <h1 class="error">❌ 连接链接已过期</h1>
          <p>请重新生成连接链接</p>
        </body>
        </html>
      `)
    }

    // 注册项目
    const apiKey = `pk_${randomBytes(32).toString('hex')}`

    const project = await db.project.create({
      data: {
        name: tokenData.projectName,
        type: 'web-app',
        path: tokenData.projectPath,
        apiKey,
        createdAt: new Date(),
      },
    })

    // 删除token
    await db.connectToken.delete({ where: { token } })

    // 返回成功页面
    return reply.type('text/html').send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>连接成功</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 50px;
          }
          .container {
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: 40px;
            max-width: 600px;
            margin: 0 auto;
            backdrop-filter: blur(10px);
          }
          .success { font-size: 64px; margin-bottom: 20px; }
          h1 { margin: 0 0 10px 0; }
          .info {
            background: rgba(0,0,0,0.2);
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
          }
          .info div {
            margin: 10px 0;
            font-family: monospace;
          }
          .label { opacity: 0.8; font-size: 14px; }
          button {
            background: white;
            color: #667eea;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            margin: 10px;
          }
          button:hover { transform: scale(1.05); }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success">🔮✨</div>
          <h1>连接成功！</h1>
          <p>项目已连接到Prophet中枢</p>

          <div class="info">
            <div>
              <div class="label">项目名称</div>
              <div>${tokenData.projectName}</div>
            </div>
            <div>
              <div class="label">Project ID</div>
              <div>${project.id}</div>
            </div>
            <div>
              <div class="label">API Key</div>
              <div>${apiKey}</div>
            </div>
          </div>

          <button onclick="copyConfig()">复制配置</button>
          <button onclick="window.close()">关闭</button>

          <script>
            const config = {
              serverUrl: 'http://localhost:3001',
              projectId: '${project.id}',
              apiKey: '${apiKey}',
              projectName: '${tokenData.projectName}'
            };

            function copyConfig() {
              const text = JSON.stringify(config, null, 2);
              navigator.clipboard.writeText(text);
              alert('配置已复制到剪贴板！');
            }

            // 自动复制
            setTimeout(() => {
              const data = JSON.stringify(config);
              console.log('Prophet配置:', config);
            }, 100);
          </script>
        </div>
      </body>
      </html>
    `)
  })

  // 一键连接当前目录
  app.get('/quick-connect', async (req: any, reply) => {
    return reply.type('text/html').send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Prophet Quick Connect</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 50px;
          }
          .container {
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            margin: 0 auto;
            backdrop-filter: blur(10px);
          }
          h1 { margin: 0 0 30px 0; }
          input {
            width: 100%;
            padding: 15px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            margin: 10px 0;
            box-sizing: border-box;
          }
          button {
            background: white;
            color: #667eea;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            width: 100%;
            margin-top: 20px;
          }
          button:hover { transform: scale(1.05); }
          .or { margin: 20px 0; opacity: 0.8; }
          .command {
            background: rgba(0,0,0,0.3);
            padding: 15px;
            border-radius: 10px;
            font-family: monospace;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔮 Prophet Quick Connect</h1>
          <p>快速连接项目到Prophet中枢</p>

          <input type="text" id="projectName" placeholder="项目名称" />
          <input type="text" id="projectPath" placeholder="项目路径 (例: /Users/me/project)" />

          <button onclick="connect()">🚀 立即连接</button>

          <div class="or">或者</div>

          <div class="command">
            <div>一行命令:</div>
            <div>prophet connect</div>
          </div>
        </div>

        <script>
          async function connect() {
            const name = document.getElementById('projectName').value;
            const path = document.getElementById('projectPath').value;

            if (!name || !path) {
              alert('请填写项目信息');
              return;
            }

            const response = await fetch('/api/projects/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, path, type: 'web-app' })
            });

            const data = await response.json();

            if (data.projectId) {
              alert('✅ 连接成功！\\n\\nProject ID: ' + data.projectId);

              // 显示配置
              const config = {
                serverUrl: 'http://localhost:3001',
                projectId: data.projectId,
                apiKey: data.apiKey,
                projectName: name
              };

              console.log('Prophet配置:', config);
              prompt('配置已生成，按Ctrl+C复制:', JSON.stringify(config, null, 2));
            }
          }
        </script>
      </body>
      </html>
    `)
  })
}
