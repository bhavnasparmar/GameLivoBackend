const express = require('express');
const router = express.Router();

router.post('/ticket', (req, res) => {
  const { subject, message, category } = req.body;
  const ticketId = 'GL-TICKET-' + Math.floor(100000 + Math.random() * 900000);
  return res.success({ ticketId, subject, status: 'open' }, 'Support ticket submitted successfully');
});

router.post('/report-player', (req, res) => {
  const { targetUserId, reason, matchId } = req.body;
  const reportId = 'REP-' + Date.now();
  return res.success({ reportId, status: 'under_review' }, 'Player reported to moderation team');
});

module.exports = router;
