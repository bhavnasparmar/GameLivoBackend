const express = require('express');
const router = express.Router();

const rewards = [
  { id: 'r1', title: 'Daily Login Bonus', coins: 100, claimed: false, expiresAt: '2026-09-11T00:00:00Z' },
  { id: 'r2', title: 'Win 3 Ludo Matches', coins: 300, claimed: true, expiresAt: '2026-09-11T00:00:00Z' },
  { id: 'r3', title: 'Friend Match Streak', coins: 500, claimed: false, expiresAt: '2026-09-12T00:00:00Z' },
];

router.get('/', (req, res) => {
  return res.success(rewards, 'Rewards list');
});

router.post('/:id/claim', (req, res) => {
  const { id } = req.params;
  return res.success({ rewardId: id, coinsAdded: 250, newBalance: 2730 }, 'Reward claimed successfully');
});

router.get('/referral', (req, res) => {
  return res.success({ referralCode: 'AARAV14', totalReferrals: 4, coinsEarned: 2000 }, 'Referral info');
});

router.get('/transactions', (req, res) => {
  const tx = [
    { id: 'tx1', type: 'reward', amount: +250, desc: 'Daily Bonus Claim', date: '2026-09-10T12:00:00Z' },
    { id: 'tx2', type: 'match_fee', amount: -100, desc: 'Ludo 4-Player Match Entry', date: '2026-09-10T14:30:00Z' },
  ];
  return res.success(tx, 'Transaction history');
});

module.exports = router;
