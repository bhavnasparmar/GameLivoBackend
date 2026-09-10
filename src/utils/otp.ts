import { cache } from '../config/redis.js';
import { config } from '../config/env.js';
import { logger } from './logger.js';

export function generateOTP(length = 6): string {
  if (config.otp.devMock) {
    return '123456';
  }
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

export async function saveOTP(phone: string, otp: string): Promise<void> {
  const key = `otp:${phone}`;
  await cache.set(key, otp, config.otp.expirySeconds);
  logger.info(`[OTP] Generated OTP for ${phone}: ${otp} (expires in ${config.otp.expirySeconds}s)`);
}

export async function verifyOTP(phone: string, otp: string): Promise<boolean> {
  const key = `otp:${phone}`;
  const storedOtp = await cache.get(key);

  if (!storedOtp) {
    return false;
  }

  const isValid = storedOtp === otp;
  if (isValid) {
    await cache.del(key);
  }
  return isValid;
}
