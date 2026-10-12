import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller.js';
import { authenticate, requireCustomer } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/me', CustomerController.getMe);
router.patch('/me', CustomerController.updateMe);
router.get('/me/accounts', requireCustomer, CustomerController.getMyAccounts);
router.get('/me/notifications', CustomerController.getMyNotifications);
router.patch('/me/notifications/:id/read', CustomerController.markNotificationRead);
router.post('/me/notifications/read-all', CustomerController.markAllNotificationsRead);

export default router;
