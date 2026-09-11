const express = require('express');
const router = express.Router();

let notifications = [
  {
    id: 'n1',
    title: '👑 Daily Bonus Ready!',
    body: 'Claim your 250 free coins for today.',
    read: false,
    type: 'reward',
    createdAt: '2026-09-10T19:00:00Z',
  },
  {
    id: 'n2',
    title: '🎲 Turn Alert',
    body: 'Priya played a turn in Ludo match #402!',
    read: false,
    type: 'game',
    createdAt: '2026-09-10T18:30:00Z',
  },
  {
    id: 'n3',
    title: '👥 New Friend Request',
    body: 'Rahul Joshi sent you a friend request.',
    read: true,
    type: 'friend',
    createdAt: '2026-09-09T20:15:00Z',
  },
];

router.get('/', (req, res) => {
  return res.success(notifications, 'Notifications list');
});

router.post('/:id/read', (req, res) => {
  const { id } = req.params;
  notifications = notifications.map(n => (n.id === id ? { ...n, read: true } : n));
  return res.success({ markedRead: true, id }, 'Notification marked as read');
});

router.post('/read-all', (req, res) => {
  notifications = notifications.map(n => ({ ...n, read: true }));
  return res.success({ markedAllRead: true }, 'All notifications marked as read');
});

module.exports = router;
