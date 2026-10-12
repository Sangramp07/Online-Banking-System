import { Router } from 'express';
import { SupportController } from '../controllers/support.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Public contact enquiry endpoint
router.post('/contact-enquiry', SupportController.submitContactEnquiry);

// Authenticated ticket endpoints
router.use(authenticate);

router.post('/tickets', SupportController.createTicket);
router.get('/tickets', SupportController.getTickets);
router.get('/tickets/:id', SupportController.getTicketById);
router.post('/tickets/:id/messages', SupportController.addMessage);

export default router;
