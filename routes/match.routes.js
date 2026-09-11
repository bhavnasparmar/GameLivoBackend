const express = require('express');
const router = express.Router();

router.get('/:id', (req, res) => {
  return res.success(
    {
      matchId: req.params.id,
      gameId: 'ludo',
      status: 'in_progress',
      currentTurnPlayerId: 'user_1',
      turnTimeLimit: 15,
      boardState: {},
    },
    'Match detail'
  );
});

router.get('/history', (req, res) => {
  return res.success([], 'Match history');
});

module.exports = router;
