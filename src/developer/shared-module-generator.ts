/**
 * Prophet Shared Module Generator
 * 共享模块生成器 - 根据通用需求生成可重用模块
 *
 * @module developer/shared-module-generator
 * @prophet-component code-generation
 */

import { SharedModule, ModuleFile } from '../types/orchestrator'

/**
 * 认证需求
 */
export interface AuthRequirements {
  affectedProjects: string[]
  features: string[]
  authType: 'jwt' | 'session' | 'oauth'
}

/**
 * 共享模块生成器
 */
export class SharedModuleGenerator {
  /**
   * 生成认证模块
   */
  async generateAuthModule(requirements: AuthRequirements): Promise<SharedModule> {
    return {
      name: '@prophet/auth-service',
      version: '1.0.0',
      description: 'Prophet shared authentication service',
      files: [
        {
          path: 'src/index.ts',
          content: this.generateAuthService(requirements),
          language: 'typescript',
        },
        {
          path: 'src/types.ts',
          content: this.generateAuthTypes(requirements),
          language: 'typescript',
        },
        {
          path: 'README.md',
          content: this.generateAuthDocs(requirements),
          language: 'markdown',
        },
        {
          path: 'package.json',
          content: this.generatePackageJson('@prophet/auth-service', {
            jsonwebtoken: '^9.0.0',
            bcrypt: '^5.1.0',
          }),
          language: 'json',
        },
      ],
      dependencies: {
        jsonwebtoken: '^9.0.0',
        bcrypt: '^5.1.0',
      },
      devDependencies: {
        '@types/jsonwebtoken': '^9.0.0',
        '@types/bcrypt': '^5.1.0',
        typescript: '^5.0.0',
      },
      targetProjects: requirements.affectedProjects,
      createdAt: new Date(),
    }
  }

  /**
   * 生成认证服务代码
   */
  private generateAuthService(requirements: AuthRequirements): string {
    const timestamp = new Date().toISOString()

    return `/**
 * Prophet Shared Authentication Service
 *
 * Auto-generated: ${timestamp}
 * Serving projects: ${requirements.affectedProjects.join(', ')}
 *
 * @module @prophet/auth-service
 */

import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { LoginCredentials, AuthResult, ValidationResult, AuthConfig } from './types'

/**
 * Authentication Service
 */
export class AuthService {
  private config: AuthConfig

  constructor(config: AuthConfig) {
    this.config = config
  }

  /**
   * Login with credentials
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Validate credentials
      const user = await this.validateCredentials(credentials)

      if (!user) {
        return {
          success: false,
          error: 'Invalid credentials',
        }
      }

      // Generate tokens
      const accessToken = this.generateAccessToken(user)
      const refreshToken = this.generateRefreshToken(user)

      return {
        success: true,
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Validate access token
   */
  async validateToken(token: string): Promise<ValidationResult> {
    try {
      const decoded = jwt.verify(token, this.config.accessTokenSecret)

      return {
        valid: true,
        payload: decoded,
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid token',
      }
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const decoded = jwt.verify(refreshToken, this.config.refreshTokenSecret)

      // Generate new access token
      const accessToken = this.generateAccessToken(decoded as any)

      return {
        success: true,
        accessToken,
        refreshToken, // Return same refresh token
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid refresh token',
      }
    }
  }

  /**
   * Hash password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
  }

  /**
   * Verify password
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  /**
   * Validate credentials (implement based on your data source)
   */
  private async validateCredentials(credentials: LoginCredentials): Promise<any> {
    // TODO: Implement based on your user data source
    // This is a placeholder
    throw new Error('Not implemented - override this method')
  }

  /**
   * Generate access token
   */
  private generateAccessToken(user: any): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      this.config.accessTokenSecret,
      {
        expiresIn: this.config.accessTokenExpiry || '15m',
      }
    )
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(user: any): string {
    return jwt.sign(
      {
        id: user.id,
      },
      this.config.refreshTokenSecret,
      {
        expiresIn: this.config.refreshTokenExpiry || '7d',
      }
    )
  }
}

export default AuthService
`
  }

  /**
   * 生成类型定义
   */
  private generateAuthTypes(requirements: AuthRequirements): string {
    return `/**
 * Authentication Types
 */

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResult {
  success: boolean
  accessToken?: string
  refreshToken?: string
  user?: {
    id: string
    email: string
  }
  error?: string
}

export interface ValidationResult {
  valid: boolean
  payload?: any
  error?: string
}

export interface AuthConfig {
  accessTokenSecret: string
  refreshTokenSecret: string
  accessTokenExpiry?: string
  refreshTokenExpiry?: string
}
`
  }

  /**
   * 生成文档
   */
  private generateAuthDocs(requirements: AuthRequirements): string {
    return `# @prophet/auth-service

Prophet shared authentication service.

**Auto-generated:** ${new Date().toISOString()}
**Serving projects:** ${requirements.affectedProjects.join(', ')}

## Features

- JWT-based authentication
- Secure password hashing (bcrypt)
- Token refresh mechanism
- Type-safe TypeScript API

## Installation

\`\`\`bash
npm install @prophet/auth-service
\`\`\`

## Usage

\`\`\`typescript
import { AuthService } from '@prophet/auth-service'

const authService = new AuthService({
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET!,
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET!,
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
})

// Login
const result = await authService.login({
  email: 'user@example.com',
  password: 'password123',
})

if (result.success) {
  console.log('Access token:', result.accessToken)
  console.log('Refresh token:', result.refreshToken)
}

// Validate token
const validation = await authService.validateToken(token)
if (validation.valid) {
  console.log('User:', validation.payload)
}
\`\`\`

## Customization

Override the \`validateCredentials\` method to integrate with your user data source:

\`\`\`typescript
class CustomAuthService extends AuthService {
  private async validateCredentials(credentials: LoginCredentials) {
    // Your custom user lookup logic
    const user = await db.users.findOne({ email: credentials.email })

    if (!user) return null

    const valid = await this.verifyPassword(credentials.password, user.passwordHash)
    return valid ? user : null
  }
}
\`\`\`

## License

MIT

---

Generated by Prophet - The Four-Dimensional Intelligence
`
  }

  /**
   * 生成 package.json
   */
  private generatePackageJson(
    name: string,
    dependencies: Record<string, string>
  ): string {
    return JSON.stringify(
      {
        name,
        version: '1.0.0',
        description: `Prophet shared module - ${name}`,
        main: 'dist/index.js',
        types: 'dist/index.d.ts',
        scripts: {
          build: 'tsc',
          test: 'jest',
          prepublish: 'npm run build',
        },
        dependencies,
        devDependencies: {
          '@types/node': '^20.0.0',
          typescript: '^5.0.0',
          jest: '^29.0.0',
        },
        keywords: ['prophet', 'shared', 'module'],
        author: 'Prophet',
        license: 'MIT',
      },
      null,
      2
    )
  }

  /**
   * 生成支付模块
   */
  async generatePaymentModule(affectedProjects: string[]): Promise<SharedModule> {
    return {
      name: '@prophet/payment-service',
      version: '1.0.0',
      description: 'Prophet shared payment service',
      files: [
        {
          path: 'src/index.ts',
          content: this.generatePaymentService(affectedProjects),
          language: 'typescript',
        },
        {
          path: 'README.md',
          content: this.generatePaymentDocs(affectedProjects),
          language: 'markdown',
        },
      ],
      dependencies: {
        stripe: '^13.0.0',
      },
      targetProjects: affectedProjects,
      createdAt: new Date(),
    }
  }

  /**
   * 生成支付服务代码
   */
  private generatePaymentService(affectedProjects: string[]): string {
    return `/**
 * Prophet Shared Payment Service
 *
 * Serving projects: ${affectedProjects.join(', ')}
 */

import Stripe from 'stripe'

export class PaymentService {
  private stripe: Stripe

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2023-10-16',
    })
  }

  async createPaymentIntent(amount: number, currency: string = 'usd') {
    return this.stripe.paymentIntents.create({
      amount,
      currency,
    })
  }

  async confirmPayment(paymentIntentId: string) {
    return this.stripe.paymentIntents.confirm(paymentIntentId)
  }
}

export default PaymentService
`
  }

  /**
   * 生成支付文档
   */
  private generatePaymentDocs(affectedProjects: string[]): string {
    return `# @prophet/payment-service

Prophet shared payment integration.

**Serving projects:** ${affectedProjects.join(', ')}

## Usage

\`\`\`typescript
import { PaymentService } from '@prophet/payment-service'

const payment = new PaymentService(process.env.STRIPE_API_KEY!)

const intent = await payment.createPaymentIntent(1000, 'usd')
\`\`\`
`
  }

  /**
   * 生成监控模块
   */
  async generateMonitoringModule(affectedProjects: string[]): Promise<SharedModule> {
    return {
      name: '@prophet/monitoring',
      version: '1.0.0',
      description: 'Prophet shared monitoring utilities',
      files: [
        {
          path: 'src/index.ts',
          content: this.generateMonitoringService(affectedProjects),
          language: 'typescript',
        },
      ],
      dependencies: {},
      targetProjects: affectedProjects,
      createdAt: new Date(),
    }
  }

  /**
   * 生成监控服务代码
   */
  private generateMonitoringService(affectedProjects: string[]): string {
    return `/**
 * Prophet Shared Monitoring
 *
 * Serving projects: ${affectedProjects.join(', ')}
 */

export class MonitoringService {
  log(level: string, message: string, meta?: any) {
    console.log(\`[\${level}] \${message}\`, meta)
  }

  error(message: string, error: Error) {
    console.error(message, error)
  }

  metric(name: string, value: number) {
    // Send metric to monitoring system
  }
}

export default MonitoringService
`
  }
}
