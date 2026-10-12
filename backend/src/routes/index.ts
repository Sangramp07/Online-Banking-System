import { Router } from 'express';
import authRoutes from './auth.routes.js';
import customerRoutes from './customer.routes.js';
import accountRoutes from './account.routes.js';
import transferRoutes from './transfer.routes.js';
import beneficiaryRoutes from './beneficiary.routes.js';
import supportRoutes from './support.routes.js';
import adminRoutes from './admin.routes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/customers', customerRoutes);
apiRouter.use('/accounts', accountRoutes);
apiRouter.use('/transfers', transferRoutes);
apiRouter.use('/beneficiaries', beneficiaryRoutes);
apiRouter.use('/support', supportRoutes);
apiRouter.use('/admin', adminRoutes);

export default apiRouter;
