import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/dashboard', AdminController.getDashboard);
router.get('/customers', AdminController.getCustomers);
router.patch('/customers/:id/status', AdminController.updateCustomerStatus);

router.get('/accounts', AdminController.getAccounts);
router.patch('/accounts/:id/status', AdminController.updateAccountStatus);

router.get('/transfers', AdminController.getTransfers);
router.get('/audit-logs', AdminController.getAuditLogs);
router.get('/reports', AdminController.exportReport);

router.get('/tickets', AdminController.getTickets);
router.patch('/tickets/:id/status', AdminController.updateTicketStatus);

export default router;
