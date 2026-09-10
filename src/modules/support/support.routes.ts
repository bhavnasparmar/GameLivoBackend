import { Router } from 'express';
import { SupportController } from './support.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createTicketSchema, reportPlayerSchema } from './support.validation.js';

const router = Router();

router.use(authenticate);

router.post('/ticket', validate({ body: createTicketSchema }), SupportController.createTicket);
router.post('/report-player', validate({ body: reportPlayerSchema }), SupportController.reportPlayer);
router.get('/tickets', SupportController.getTickets);

export default router;
