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
import { EarningsHistory } from '../entities/earningHistory.entity';
import { Claim } from '../entities/claim.entity';

const router = express.Router();
let userRepository: Repository<User> = dataSource.getRepository(User);

let investmentRepository: Repository<Investment> = dataSource.getRepository(Investment);

let investmentController: InvestmentController;

let earningHistoryRepository: Repository<EarningsHistory> = dataSource.getRepository(EarningsHistory);

let claimRepository: Repository<Claim> = dataSource.getRepository(Claim);

let investmentService = new InvestmentService(userRepository, earningHistoryRepository, investmentRepository);
investmentController = new InvestmentController(investmentService, userRepository, investmentRepository, earningHistoryRepository, claimRepository);


// ========== PROTECTED INVESTMENT ROUTES ========== //
router.use(authMiddleware);

router.post("/invest", validateRequest(InvestmentSchema.createInvestment), investmentController.createInvestment);
router.post("/claim", investmentController.claimRefEarnings);

export default router;