const express = require('express');
const router = express.Router();

const globalLeaderboard = [
  { rank: 1, name: 'Siddharth R.', username: 'sidd_god', level: 45, score: 18450, winRate: 78, avatar: '👑' },
  { rank: 2, name: 'Kabir Mehta', username: 'kabir_grandmaster', level: 38, score: 15200, winRate: 72, avatar: '⚔️' },
  { rank: 3, name: 'Priya Sharma', username: 'priya_queen', level: 31, score: 12900, winRate: 69, avatar: '🏆' },
];

router.get('/global', (req, res) => {
  return res.success(globalLeaderboard, 'Global leaderboard');
});

router.get('/friends', (req, res) => {
  return res.success(globalLeaderboard.slice(1), 'Friends leaderboard');
});

router.get('/:gameId', (req, res) => {
  return res.success(globalLeaderboard, `${req.params.gameId} leaderboard`);
});

module.exports = router;
