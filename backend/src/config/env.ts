import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  DATABASE_URL: process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/nexbank_db',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'nexbank_jwt_access_super_secret_key_2026_finance_secure',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'nexbank_jwt_refresh_super_secret_key_2026_finance_secure',
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'nexbank_secure_cookie_secret_salt_987654321',
};
