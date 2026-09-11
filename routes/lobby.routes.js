const express = require('express');
const router = express.Router();

let lobbies = {};

// ─── POST /lobby/create ───────────────────────────────────────────────────────
router.post('/create', (req, res) => {
  const { gameId, entryFee, maxPlayers, isPrivate } = req.body;
  const lobbyCode = Math.floor(100000 + Math.random() * 900000).toString();
  const lobbyId = 'lobby_' + Date.now();

  const newLobby = {
    id: lobbyId,
    code: lobbyCode,
    gameId: gameId || 'ludo',
    entryFee: entryFee || 100,
    maxPlayers: maxPlayers || 4,
    currentPlayers: 1,
    isPrivate: !!isPrivate,
    hostId: 'user_1',
    players: [{ id: 'user_1', name: 'Aarav Kapoor', username: 'aarav.kapoor', isHost: true }],
    status: 'waiting',
  };

  lobbies[lobbyId] = newLobby;
  return res.success(newLobby, 'Lobby created successfully');
});

// ─── POST /lobby/join/:code ───────────────────────────────────────────────────
router.post('/join/:code', (req, res) => {
  const { code } = req.params;
  const lobby = Object.values(lobbies).find(l => l.code === code) || {
    id: 'lobby_demo',
    code,
    gameId: 'ludo',
    entryFee: 100,
    players: [{ id: 'user_1', name: 'Aarav Kapoor' }],
  };

  return res.success(lobby, 'Joined lobby successfully');
});

// ─── POST /lobby/:id/leave ────────────────────────────────────────────────────
router.post('/:id/leave', (req, res) => {
  return res.success({ left: true }, 'Left lobby');
});

// ─── GET /lobby/:id ───────────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const lobby = lobbies[req.params.id] || {
    id: req.params.id,
    gameId: 'ludo',
    players: [],
  };
  return res.success(lobby, 'Lobby details');
});

// ─── GET /lobby/public ────────────────────────────────────────────────────────
router.get('/public', (req, res) => {
  return res.success(Object.values(lobbies).filter(l => !l.isPrivate), 'Public lobbies');
});

module.exports = router;
