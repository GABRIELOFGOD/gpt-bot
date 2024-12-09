import express from 'express';
import { CoinController } from '../controllers/Price.controller';
import { Price } from '../entities/coinPrice.entity';
import { dataSource } from '../config/dataSource';
import { User } from '../entities/user.entity';
import authMiddleware from '../middlewares/auth.middleware';

const router = express.Router();
const priceRepository = dataSource.getRepository(Price);
const userRepository = dataSource.getRepository(User);

const coinController = new CoinController(priceRepository, userRepository);

router.get("/get", coinController.getPrice);

router.use(authMiddleware);
router.patch("/update", coinController.updatePrice);

export default router;