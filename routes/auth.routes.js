const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'gamelivo_super_secret_jwt_key_2026';
const STATIC_OTP = '111111'; // Always true with 111111 as requested

const generateTokens = (user) => {
  const accessToken = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: '7d',
  });
  const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });
  return { accessToken, refreshToken, expiresIn: 604800 };
};

// ─── POST /auth/login ─────────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { identifier, password, mobile, email } = req.body;
  const userIdentifier = identifier || email || mobile || 'player_one';

  const user = {
    id: 'user_1',
    name: 'Aarav Kapoor',
    username: userIdentifier.includes('@') ? userIdentifier.split('@')[0] : 'aarav.kapoor',
    mobile: mobile || '+91 98765 43210',
    email: email || 'aarav@email.com',
    level: 14,
    coins: 2480,
    rank: 128,
  };

  const tokens = generateTokens(user);
  return res.success({ tokens, user }, 'Logged in successfully');
});

// ─── POST /auth/register ──────────────────────────────────────────────────────
router.post('/register', (req, res) => {
  const { name, username, mobile, email, password } = req.body;

  const user = {
    id: `user_${Date.now()}`,
    name: name || 'New Player',
    username: username || 'player_' + Math.floor(1000 + Math.random() * 9000),
    mobile: mobile || '+91 98765 00000',
    email: email || 'newplayer@gamelivo.com',
    level: 1,
    coins: 1000,
    rank: 999,
  };

  const tokens = generateTokens(user);
  return res.success({ tokens, user, message: 'Account registered successfully' }, 'Registration successful');
});

// ─── POST /auth/otp/send ──────────────────────────────────────────────────────
router.post('/otp/send', (req, res) => {
  const { mobile, email, type } = req.body;
  return res.success(
    { otpSent: true, target: mobile || email, staticOTP: STATIC_OTP },
    `OTP sent successfully. (Static code: ${STATIC_OTP})`
  );
});

// ─── POST /auth/otp/verify ────────────────────────────────────────────────────
router.post('/otp/verify', (req, res) => {
  const { otp, mobile, email } = req.body;

  // Static 111111 or any 6 digit test
  if (otp === STATIC_OTP || otp === '111111' || !otp) {
    const user = {
      id: 'user_1',
      name: 'Aarav Kapoor',
      username: 'aarav.kapoor',
      mobile: mobile || '+91 98765 43210',
      email: email || 'aarav@email.com',
      level: 14,
      coins: 2480,
      rank: 128,
    };
    const tokens = generateTokens(user);
    return res.success({ tokens, user }, 'OTP verified successfully');
  }

  return res.error('Invalid OTP. Please enter 111111', 400);
});

// ─── POST /auth/forgot-password ───────────────────────────────────────────────
router.post('/forgot-password', (req, res) => {
  const { identifier, mobile, email } = req.body;
  return res.success(
    { resetToken: 'RESET_TOKEN_' + Date.now(), staticOTP: STATIC_OTP },
    `Password reset instructions sent. Use OTP: ${STATIC_OTP}`
  );
});

// ─── POST /auth/reset-password ────────────────────────────────────────────────
router.post('/reset-password', (req, res) => {
  const { newPassword, otp } = req.body;
  return res.success({}, 'Password has been updated successfully');
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  return res.success({}, 'Logged out successfully');
});

// ─── POST /auth/refresh ───────────────────────────────────────────────────────
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  const user = { id: 'user_1', username: 'aarav.kapoor' };
  const tokens = generateTokens(user);
  return res.success({ tokens }, 'Token refreshed successfully');
});

module.exports = router;
