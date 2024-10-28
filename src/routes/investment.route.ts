import express from 'express';
import authMiddleware from '../middlewares/auth.middleware';
import { InvestmentController } from '../controllers/invest.controller';
import { validateRequest } from '../middlewares/joi.middleware';
import { InvestmentSchema } from '../schema/investment.schema';

const router = express.Router();
let investmentController: InvestmentController;
router.use(authMiddleware);

investmentController = new InvestmentController();

router.post("/invest", validateRequest(InvestmentSchema.createInvestment), investmentController.createInvestment);

export default router;