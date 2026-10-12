import { Router } from 'express';
import { TransferController } from '../controllers/transfer.controller.js';
import { authenticate, requireCustomer, requireAdmin } from '../middleware/auth.middleware.js';
import { transferLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(authenticate);

router.post('/', requireCustomer, transferLimiter, TransferController.createTransfer);
router.get('/', requireCustomer, TransferController.getTransfers);
router.get('/:id', TransferController.getTransferById);
router.post('/:id/reverse', requireAdmin, TransferController.reverseTransfer);

export default router;
