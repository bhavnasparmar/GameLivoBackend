const express = require('express');
const router = express.Router();

let currentUserProfile = {
  id: 'user_1',
  name: 'Aarav Kapoor',
  username: 'aarav.kapoor',
  mobile: '+91 98765 43210',
  email: 'aarav@email.com',
  level: 14,
  xp: 3420,
  coins: 2480,
  rank: 128,
  totalGamesPlayed: 342,
  totalWins: 208,
  totalLosses: 134,
  winRate: 61,
  referralCode: 'AARAV14',
  isOnline: true,
  lastSeen: new Date().toISOString(),
  createdAt: '2025-03-01T00:00:00Z',
  bio: 'Board game enthusiast 🎲 Ludo King in the making!',
  achievements: [
    { id: 'a1', title: 'Ludo King', description: 'Win 50 Ludo games', icon: '👑', unlockedAt: '2026-08-01', rarity: 'epic' },
    { id: 'a2', title: 'Chess Prodigy', description: 'Reach Rank #50 in Chess', icon: '♞', unlockedAt: '2026-07-15', rarity: 'rare' },
    { id: 'a3', title: 'First Win', description: 'Win your first match', icon: '🏆', unlockedAt: '2025-03-05', rarity: 'common' },
    { id: 'a4', title: 'Coin Collector', description: 'Collect 10,000 coins', icon: '💰', unlockedAt: '2026-06-20', rarity: 'rare' },
  ],
  gameStats: [
    { gameId: 'ludo', gameName: 'Ludo', gamesPlayed: 180, wins: 112, losses: 68, winRate: 62, highScore: 4200, rank: 42 },
    { gameId: 'chess', gameName: 'Chess', gamesPlayed: 85, wins: 54, losses: 31, winRate: 63, highScore: 1850, rank: 88 },
    { gameId: 'uno', gameName: 'Uno', gamesPlayed: 55, wins: 30, losses: 25, winRate: 54, highScore: 890, rank: 210 },
    { gameId: 'snakeLadder', gameName: 'Snake & Ladder', gamesPlayed: 22, wins: 12, losses: 10, winRate: 54, highScore: 320, rank: 340 },
  ],
};

let userPreferences = {
  notifications: true,
  matchAlerts: true,
  friendActivity: true,
  marketingEmails: false,
  soundEffects: true,
  bgMusic: true,
  haptics: true,
  theme: 'dark',
  language: 'English (US)',
};

let privacySettings = {
  profileVisibility: 'public',
  showOnlineStatus: true,
  allowFriendRequests: true,
  allowGameInvites: true,
  twoFactorEnabled: false,
};

let blockedUsers = [
  {
    id: 'block_1',
    name: 'Rohan Verma',
    username: 'rohan_rage_quit',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
    blockedAt: '2026-08-14T10:30:00Z',
    reason: 'Toxic chat behavior',
  },
  {
    id: 'block_2',
    name: 'Vikram Singh',
    username: 'vikram99_pro',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120',
    blockedAt: '2026-07-28T18:45:00Z',
    reason: 'Spamming invites',
  },
];

// ─── GET & PUT /user/profile ─────────────────────────────────────────────────
router.get('/profile', (req, res) => {
  return res.success(currentUserProfile, 'Profile loaded');
});

router.put('/profile', (req, res) => {
  currentUserProfile = { ...currentUserProfile, ...req.body };
  return res.success(currentUserProfile, 'Profile updated successfully');
});

// ─── GET /user/stats ──────────────────────────────────────────────────────────
router.get('/stats', (req, res) => {
  return res.success(currentUserProfile.gameStats, 'Stats loaded');
});

// ─── GET /user/achievements ───────────────────────────────────────────────────
router.get('/achievements', (req, res) => {
  return res.success(currentUserProfile.achievements, 'Achievements loaded');
});

// ─── GET /user/match-history ──────────────────────────────────────────────────
router.get('/match-history', (req, res) => {
  const matches = [
    { id: 'm1', game: 'Ludo', outcome: 'win', coinsEarned: 200, date: '2026-09-09T18:30:00Z' },
    { id: 'm2', game: 'Chess', outcome: 'loss', coinsEarned: -50, date: '2026-09-09T15:10:00Z' },
    { id: 'm3', game: 'Uno', outcome: 'win', coinsEarned: 150, date: '2026-09-08T21:40:00Z' },
  ];
  return res.success(matches, 'Match history loaded');
});

// ─── GET & PUT /user/preferences ──────────────────────────────────────────────
router.get('/preferences', (req, res) => {
  return res.success(userPreferences, 'Preferences loaded');
});

router.put('/preferences', (req, res) => {
  userPreferences = { ...userPreferences, ...req.body };
  return res.success(userPreferences, 'Preferences updated successfully');
});

// ─── GET & PUT /user/privacy ──────────────────────────────────────────────────
router.get('/privacy', (req, res) => {
  return res.success(privacySettings, 'Privacy settings loaded');
});

router.put('/privacy', (req, res) => {
  privacySettings = { ...privacySettings, ...req.body };
  return res.success(privacySettings, 'Privacy settings updated successfully');
});

// ─── GET /user/blocked (List blocked users) ──────────────────────────────────
router.get('/blocked', (req, res) => {
  return res.success(blockedUsers, 'Blocked users list');
});

// ─── POST /user/block/:userId (Block a player) ────────────────────────────────
router.post('/block/:userId', (req, res) => {
  const { userId } = req.params;
  const { reason, name, username } = req.body;

  const newBlock = {
    id: userId,
    name: name || 'Player ' + userId,
    username: username || 'user_' + userId,
    blockedAt: new Date().toISOString(),
    reason: reason || 'Blocked by user',
  };

  blockedUsers = [newBlock, ...blockedUsers.filter(u => u.id !== userId)];
  return res.success(newBlock, 'User has been blocked successfully');
});

// ─── DELETE /user/block/:userId (Unblock a player) ────────────────────────────
router.delete('/block/:userId', (req, res) => {
  const { userId } = req.params;
  blockedUsers = blockedUsers.filter(u => u.id !== userId);
  return res.success({ unblockedId: userId }, 'User has been unblocked successfully');
});

// ─── POST /user/data/download ─────────────────────────────────────────────────
router.post('/data/download', (req, res) => {
  return res.success(
    {
      downloadUrl: 'https://api.gamelivo.com/data/export_archive_user_1.zip',
      estimatedSize: '4.2 MB',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    'Data export archive generated'
  );
});

// ─── DELETE /user/account ─────────────────────────────────────────────────────
router.delete('/account', (req, res) => {
  return res.success({}, 'Account has been scheduled for permanent deletion');
});

module.exports = router;
