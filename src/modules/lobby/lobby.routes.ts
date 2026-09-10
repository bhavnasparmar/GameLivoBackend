import { Router } from 'express';
import { LobbyController } from './lobby.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createLobbySchema, joinLobbySchema } from './lobby.validation.js';

const router = Router();

router.use(authenticate);

router.post('/create', validate({ body: createLobbySchema }), LobbyController.create);
router.post('/join/:code', LobbyController.join);
router.post('/join', validate({ body: joinLobbySchema }), LobbyController.join);
router.post('/:lobbyId/leave', LobbyController.leave);
router.get('/public', LobbyController.getPublic);
router.get('/:lobbyId', LobbyController.getById);

export default router;
