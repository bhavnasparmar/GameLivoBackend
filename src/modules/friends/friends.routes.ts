import { Router } from 'express';
import { FriendsController } from './friends.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { sendFriendRequestSchema } from './friends.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', FriendsController.getFriends);
router.get('/requests', FriendsController.getRequests);
router.post('/request', validate({ body: sendFriendRequestSchema }), FriendsController.sendRequest);
router.post('/request/:requestId/accept', FriendsController.acceptRequest);
router.post('/request/:requestId/decline', FriendsController.declineRequest);
router.delete('/:friendId', FriendsController.removeFriend);
router.get('/search', FriendsController.search);

export default router;
