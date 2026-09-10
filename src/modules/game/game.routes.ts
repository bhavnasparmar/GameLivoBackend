import { Router } from 'express';
import { GameController } from './game.controller.js';

const router = Router();

router.get('/', GameController.getAllGames);
router.get('/:gameId', GameController.getGameById);

export default router;
