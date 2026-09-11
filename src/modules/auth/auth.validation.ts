import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().min(3).max(30),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  referralCode: z.string().optional(),
}).refine(data => data.phone || data.email, {
  message: 'Either phone or email must be provided',
});

export const loginPasswordSchema = z.object({
  identifier: z.string().min(3), // phone, email, or username
  password: z.string().min(6),
});

export const sendOtpSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
});

export const verifyOtpSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  username: z.string().min(3).max(30).optional(),
  referralCode: z.string().optional(),
});

// New: verify OTP after registration (phone or email)
export const verifyRegistrationOtpSchema = z.object({
  contact: z.string().min(3), // phone number or email
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
});

export const resetPasswordSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(6),
});
