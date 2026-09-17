import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { User, IUserDocument } from '../user/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { generateOTP, saveOTP, verifyOTP } from '../../utils/otp.js';
import { cache } from '../../config/redis.js';

export class AuthService {
  private static generateReferralCode(): string {
    return 'GL' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  static async sendOtp(phone: string): Promise<{ message: string; devOtp?: string }> {
    const otp = generateOTP(6);
    await saveOTP(phone, otp);
    return {
      message: 'OTP sent successfully',
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    };
  }

  static async verifyOtpAndLogin(params: {
    phone: string;
    otp: string;
    username?: string;
    referralCode?: string;
  }): Promise<{ user: IUserDocument; accessToken: string; refreshToken: string; isNewUser: boolean }> {
    const isValid = await verifyOTP(params.phone, params.otp);
    if (!isValid) {
      throw ApiError.badRequest('Invalid or expired OTP');
    }

    let user = await User.findOne({ where: { phone: params.phone } });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const finalUsername = params.username || `player_${Math.floor(100000 + Math.random() * 900000)}`;

      // Check username collision
      const existingUserWithUsername = await User.findOne({ where: { username: finalUsername } });
      const uniqueUsername = existingUserWithUsername
        ? `${finalUsername}_${Math.floor(100 + Math.random() * 900)}`
        : finalUsername;

      user = await User.create({
        phone: params.phone,
        username: uniqueUsername,
        referralCode: this.generateReferralCode(),
        referredBy: params.referralCode,
        isVerified: true,
        coins: 1000 + (params.referralCode ? 250 : 0), // referral bonus
      });
    }

    const payload = {
      userId: user.id,
      phone: user.phone || undefined,
      email: user.email || undefined,
      username: user.username,
      role: user.role,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ userId: user.id });

    // Store refresh token in redis/cache with 7 days expiry
    await cache.set(`refresh:${user.id}`, refreshToken, 7 * 24 * 60 * 60);

    return { user, accessToken, refreshToken, isNewUser };
  }

  static async registerWithPassword(params: {
    username: string;
    phone?: string;
    email?: string;
    password?: string;
    referralCode?: string;
  }): Promise<{ user: IUserDocument; message: string; devOtp?: string; contact: string; contactType: 'phone' | 'email' }> {
    const query: any[] = [{ username: params.username }];
    if (params.phone) query.push({ phone: params.phone });
    if (params.email) query.push({ email: params.email });

    const existing = await User.findOne({ where: { [Op.or]: query } });
    if (existing) {
      if (existing.username === params.username) {
        throw ApiError.conflict('Username is already taken');
      }
      if (params.phone && existing.phone === params.phone) {
        throw ApiError.conflict('Phone number is already registered');
      }
      if (params.email && existing.email === params.email) {
        throw ApiError.conflict('Email is already registered');
      }
    }

    let passwordHash: string | undefined = undefined;
    if (params.password) {
      passwordHash = await bcrypt.hash(params.password, 10);
    }

    const user = await User.create({
      username: params.username,
      phone: params.phone,
      email: params.email,
      passwordHash,
      referralCode: this.generateReferralCode(),
      referredBy: params.referralCode,
      isVerified: false, // not verified yet
      coins: 1000 + (params.referralCode ? 250 : 0),
    });

    // Generate OTP and send to phone or email
    const otp = generateOTP(6);
    const contact = params.phone || params.email!;
    const contactType: 'phone' | 'email' = params.phone ? 'phone' : 'email';
    // Save OTP keyed by contact (phone or email)
    const otpKey = `otp:${contact}`;
    await cache.set(otpKey, otp, 300); // 5 min expiry

    return {
      user,
      message: params.phone
        ? 'OTP sent to your phone number. Please verify to complete registration.'
        : 'OTP sent to your email address. Please verify to complete registration.',
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
      contact,
      contactType,
    };
  }

  static async verifyRegistrationOtp(params: {
    contact: string; // phone or email
    otp: string;
  }): Promise<{ user: IUserDocument; accessToken: string; refreshToken: string }> {
    const otpKey = `otp:${params.contact}`;
    const storedOtp = await cache.get(otpKey);

    if (!storedOtp) {
      throw ApiError.badRequest('OTP has expired. Please register again.');
    }
    if (storedOtp !== params.otp) {
      throw ApiError.badRequest('Invalid OTP. Please enter the correct code.');
    }

    // OTP is correct — delete it
    await cache.del(otpKey);

    // Find the user by phone or email
    const isEmail = params.contact.includes('@');
    const user = await User.findOne({
      where: isEmail
        ? { email: params.contact }
        : { phone: params.contact },
    });

    if (!user) {
      throw ApiError.notFound('User not found. Please register again.');
    }

    // Mark as verified
    await user.update({ isVerified: true });

    const payload = {
      userId: user.id,
      phone: user.phone || undefined,
      email: user.email || undefined,
      username: user.username,
      role: user.role,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ userId: user.id });
    await cache.set(`refresh:${user.id}`, refreshToken, 7 * 24 * 60 * 60);

    return { user, accessToken, refreshToken };
  }

  static async loginWithPassword(
    identifier: string,
    password: string
  ): Promise<{
    user: IUserDocument;
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await User.findOne({
      where: {
        [Op.or]: [{ username: identifier }, { email: identifier }, { phone: identifier }],
      },
    });

    if (!user || !user.passwordHash) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    const payload = {
      userId: user.id,
      phone: user.phone || undefined,
      email: user.email || undefined,
      username: user.username,
      role: user.role,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ userId: user.id });

    await cache.set(`refresh:${user.id}`, refreshToken, 7 * 24 * 60 * 60);

    return { user, accessToken, refreshToken };
  }

  static async refreshToken(oldRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const { userId } = verifyRefreshToken(oldRefreshToken);

    const storedToken = await cache.get(`refresh:${userId}`);
    if (storedToken && storedToken !== oldRefreshToken) {
      throw ApiError.unauthorized('Invalid or rotated refresh token');
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    const payload = {
      userId: user.id,
      phone: user.phone || undefined,
      email: user.email || undefined,
      username: user.username,
      role: user.role,
    };

    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken({ userId: user.id });

    await cache.set(`refresh:${user.id}`, newRefreshToken, 7 * 24 * 60 * 60);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  static async logout(userId: string): Promise<void> {
    await cache.del(`refresh:${userId}`);
  }
}
