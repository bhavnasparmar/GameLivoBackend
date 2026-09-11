const express = require('express');
const router = express.Router();

let friends = [
  {
    id: 'f1',
    name: 'Priya Sharma',
    username: 'priya_queen',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
    isOnline: true,
    level: 18,
    rank: 42,
    status: 'In Match: Ludo',
  },
  {
    id: 'f2',
    name: 'Kabir Mehta',
    username: 'kabir_grandmaster',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
    isOnline: true,
    level: 22,
    rank: 12,
    status: 'Online',
  },
  {
    id: 'f3',
    name: 'Ananya Roy',
    username: 'ananya_uno',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120',
    isOnline: false,
    level: 11,
    rank: 88,
    status: 'Last seen 2h ago',
  },
];

let friendRequests = [
  {
    id: 'req_1',
    requestId: 'req_1',
    name: 'Rahul Joshi',
    username: 'rahul_ludo_champ',
    sender: { id: 'u_101', name: 'Rahul Joshi', username: 'rahul_ludo_champ', level: 9 },
    level: 9,
    direction: 'incoming',
    createdAt: '2026-09-09T20:15:00Z',
  },
];

let suggestions = [
  { id: 'sug_1', name: 'Dev Patel', username: 'dev_gamer_x', level: 15, isFriend: false, hasPendingRequest: false },
  { id: 'sug_2', name: 'Neha Gupta', username: 'neha_chess', level: 19, isFriend: false, hasPendingRequest: false },
  { id: 'sug_3', name: 'Amit Verma', username: 'amit_king', level: 25, isFriend: false, hasPendingRequest: false },
];

// ─── GET /friends ─────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  return res.success(friends, 'Friends list loaded');
});

// ─── GET /friends/suggestions ─────────────────────────────────────────────────
router.get('/suggestions', (req, res) => {
  return res.success(suggestions, 'Friend suggestions loaded');
});

// ─── GET /friends/requests ────────────────────────────────────────────────────
router.get('/requests', (req, res) => {
  return res.success(friendRequests, 'Friend requests loaded');
});

// ─── POST /friends/request ────────────────────────────────────────────────────
router.post('/request', (req, res) => {
  const receiverId = req.body.receiverId || req.body.userId;
  if (!receiverId) {
    return res.error('Target user ID is required', 400);
  }

  // Update suggestions state
  suggestions = suggestions.map(s => s.id === receiverId ? { ...s, hasPendingRequest: true } : s);

  return res.success({ sent: true, receiverId }, 'Friend request sent');
});

// ─── POST /friends/request/:id/accept ─────────────────────────────────────────
router.post('/request/:id/accept', (req, res) => {
  const { id } = req.params;
  const targetReq = friendRequests.find(r => r.id === id || r.requestId === id);
  if (targetReq) {
    friends.push({
      id: targetReq.sender ? targetReq.sender.id : `f_${Date.now()}`,
      name: targetReq.name || (targetReq.sender ? targetReq.sender.name : 'Friend'),
      username: targetReq.username || (targetReq.sender ? targetReq.sender.username : 'friend'),
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
      isOnline: true,
      level: targetReq.level || (targetReq.sender ? targetReq.sender.level : 1),
      rank: 50,
      status: 'Online',
    });
  }
  friendRequests = friendRequests.filter(r => r.id !== id && r.requestId !== id);
  return res.success({ accepted: true, requestId: id }, 'Friend request accepted');
});

// ─── POST /friends/request/:id/decline ────────────────────────────────────────
router.post('/request/:id/decline', (req, res) => {
  const { id } = req.params;
  friendRequests = friendRequests.filter(r => r.id !== id && r.requestId !== id);
  return res.success({ declined: true, requestId: id }, 'Friend request declined');
});

// ─── DELETE /friends/:id ──────────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  friends = friends.filter(f => f.id !== id);
  return res.success({ removedId: id }, 'Friend removed successfully');
});

// ─── GET /friends/search ──────────────────────────────────────────────────────
router.get('/search', (req, res) => {
  const { q } = req.query;
  const query = (q || '').toLowerCase();
  const searchResults = suggestions.filter(s => 
    s.name.toLowerCase().includes(query) || s.username.toLowerCase().includes(query)
  );
  return res.success(searchResults, 'Search results');
});

module.exports = router;
