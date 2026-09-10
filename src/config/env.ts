import dotenv from 'dotenv';
import path from 'path';

// Load single .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export type Environment = 'development' | 'staging' | 'production' | 'test';

export interface EnvironmentPreset {
  apiUrl: string;
  socketUrl: string;
  clientUrl: string;
  corsOrigin: string;
  logLevel: string;
  otpDevMock: boolean;
}

// Environment-specific URLs & defaults configured on this single file
export const ENV_PRESETS: Record<Environment, EnvironmentPreset> = {
  development: {
    apiUrl: 'http://localhost:5000/api/v1',
    socketUrl: 'http://localhost:5000',
    clientUrl: 'http://localhost:3000',
    corsOrigin: '*',
    logLevel: 'debug',
    otpDevMock: true,
  },
  staging: {
    apiUrl: 'https://staging-api.gamelivo.com/api/v1',
    socketUrl: 'https://staging-api.gamelivo.com',
    clientUrl: 'https://staging.gamelivo.com',
    corsOrigin: 'https://staging.gamelivo.com',
    logLevel: 'info',
    otpDevMock: false,
  },
  production: {
    apiUrl: 'https://api.gamelivo.com/api/v1',
    socketUrl: 'https://api.gamelivo.com',
    clientUrl: 'https://gamelivo.com',
    corsOrigin: 'https://gamelivo.com',
    logLevel: 'info',
    otpDevMock: false,
  },
  test: {
    apiUrl: 'http://localhost:5001/api/v1',
    socketUrl: 'http://localhost:5001',
    clientUrl: 'http://localhost:3000',
    corsOrigin: '*',
    logLevel: 'error',
    otpDevMock: true,
  },
};

const rawEnv = (process.env.NODE_ENV || 'development').toLowerCase() as Environment;
const currentEnv: Environment = rawEnv in ENV_PRESETS ? rawEnv : 'development';
const preset = ENV_PRESETS[currentEnv];

export const config = {
  env: currentEnv,
  isDev: currentEnv === 'development',
  isStaging: currentEnv === 'staging',
  isProd: currentEnv === 'production',
  isTest: currentEnv === 'test',

  // Server & URLs (automatically resolved from environment preset or overridden by .env)
  port: parseInt(process.env.PORT || '5000', 10),
  host: process.env.HOST || '0.0.0.0',
  apiUrl: process.env.API_URL || preset.apiUrl,
  socketUrl: process.env.SOCKET_URL || preset.socketUrl,
  clientUrl: process.env.CLIENT_URL || preset.clientUrl,
  corsOrigin: process.env.CORS_ORIGIN || preset.corsOrigin,

  // Database (MySQL)
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || (currentEnv === 'test' ? 'gamelivo_test' : 'gamelivo'),
  },

  // Cache & In-Memory Store (Redis)
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  // JWT Secrets & Expiry
  jwt: {
    secret: process.env.JWT_SECRET || 'gamelivo_dev_secret_fallback',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'gamelivo_dev_refresh_fallback',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  // OTP Settings
  otp: {
    expirySeconds: parseInt(process.env.OTP_EXPIRY_SECONDS || '300', 10),
    devMock: process.env.OTP_DEV_MOCK !== undefined ? process.env.OTP_DEV_MOCK !== 'false' : preset.otpDevMock,
  },

  // File Uploads
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10),
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || preset.logLevel,
} as const;

export type Config = typeof config;

