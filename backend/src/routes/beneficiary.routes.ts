import { Router } from 'express';
import { BeneficiaryController } from '../controllers/beneficiary.controller.js';
import { authenticate, requireCustomer } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate, requireCustomer);

router.get('/', BeneficiaryController.getBeneficiaries);
router.post('/', BeneficiaryController.addBeneficiary);
router.patch('/:id', BeneficiaryController.updateBeneficiary);
router.delete('/:id', BeneficiaryController.deleteBeneficiary);

export default router;
