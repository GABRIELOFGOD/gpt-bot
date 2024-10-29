import express from 'express';
import authMiddleware from '../middlewares/auth.middleware';
import { InvestmentController } from '../controllers/invest.controller';
import { validateRequest } from '../middlewares/joi.middleware';
import { InvestmentSchema } from '../schema/investment.schema';
import { InvestmentService } from '../services/investment.service';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { UserController } from '../controllers/user.controller';
import { dataSource } from '../config/dataSource';
import { Investment } from '../entities/investment.entity';

const router = express.Router();
let userRepository: Repository<User> = dataSource.getRepository(User);

let investmentRepository: Repository<Investment> = dataSource.getRepository(Investment);

let investmentController: InvestmentController;

let investmentService = new InvestmentService();
investmentController = new InvestmentController(investmentService, userRepository, investmentRepository);


// ========== PROTECTED INVESTMENT ROUTES ========== //
router.use(authMiddleware);

router.post("/invest", validateRequest(InvestmentSchema.createInvestment), investmentController.createInvestment);

export default router;