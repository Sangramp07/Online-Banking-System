import { Router } from 'express';
import { AccountController } from '../controllers/account.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', AccountController.getAccounts);
router.get('/transactions/all', AccountController.getAllCustomerTransactions);
router.get('/:id', AccountController.getAccountById);
router.get('/:id/transactions', AccountController.getAccountTransactions);
router.get('/:id/statement', AccountController.downloadStatement);

export default router;
