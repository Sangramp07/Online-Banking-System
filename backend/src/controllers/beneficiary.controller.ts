import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { BeneficiaryService } from '../services/beneficiary.service.js';
import {
  createBeneficiarySchema,
  updateBeneficiarySchema,
} from '../validators/beneficiary.validator.js';

export class BeneficiaryController {
  static async getBeneficiaries(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const beneficiaries = await BeneficiaryService.getBeneficiaries(req.user!.customerId!);
      return res.status(200).json({ success: true, data: beneficiaries });
    } catch (error) {
      next(error);
    }
  }

  static async addBeneficiary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = createBeneficiarySchema.parse(req.body);
      const beneficiary = await BeneficiaryService.addBeneficiary(
        req.user!.customerId!,
        validatedData
      );

      return res.status(201).json({
        success: true,
        message: 'Beneficiary added successfully.',
        data: beneficiary,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateBeneficiary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validatedData = updateBeneficiarySchema.parse(req.body);
      const updated = await BeneficiaryService.updateBeneficiary(
        id,
        req.user!.customerId!,
        validatedData
      );

      return res.status(200).json({
        success: true,
        message: 'Beneficiary updated successfully.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteBeneficiary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await BeneficiaryService.deleteBeneficiary(id, req.user!.customerId!);

      return res.status(200).json({
        success: true,
        message: 'Beneficiary removed successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}
