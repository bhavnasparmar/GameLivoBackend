const express = require('express');
const router = express.Router();

const GAMES = [
  {
    id: 'ludo',
    name: 'Ludo Express',
    description: 'Classic 4-player board game with quick dice and exciting bonus turns.',
    icon: '⛃',
    gradient: ['#2668D9', '#123A80'],
    players: '2-4 Players',
    onlineCount: 1420,
    modes: ['Classic', 'Quick 5-Min', 'Master'],
  },
  {
    id: 'chess',
    name: 'Royal Chess',
    description: 'Strategic board combat with Elo ratings, puzzle challenges & tournaments.',
    icon: '♞',
    gradient: ['#4A4238', '#211C17'],
    players: '2 Players',
    onlineCount: 890,
    modes: ['Blitz 3m', 'Rapid 10m', 'Classic'],
  },
  {
    id: 'uno',
    name: 'Color Uno Card Rush',
    description: 'High stakes fast-paced action cards, wild card drops and deck challenges.',
    icon: '🂡',
    gradient: ['#E6483A', '#8F1D13'],
    players: '2-4 Players',
    onlineCount: 1105,
    modes: ['Standard', 'No-Bluffing', 'Team 2v2'],
  },
  {
    id: 'snakeLadder',
    name: 'Snake & Ladders 3D',
    description: 'Roll the dice and race to 100 while avoiding giant serpents.',
    icon: '🐍',
    gradient: ['#1F9D55', '#0D5230'],
    players: '2-4 Players',
    onlineCount: 650,
    modes: ['Classic 100', 'Power Ups'],
  },
];

router.get('/', (req, res) => {
  return res.success(GAMES, 'Games list retrieved');
});

router.get('/:id', (req, res) => {
  const game = GAMES.find(g => g.id === req.params.id) || GAMES[0];
  return res.success(game, 'Game details retrieved');
});

module.exports = router;
