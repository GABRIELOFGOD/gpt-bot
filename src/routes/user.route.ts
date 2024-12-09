import express from 'express';
import { validateRequest } from '../middlewares/joi.middleware';
import { UserSchema } from '../schema/user.schema';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { dataSource } from '../config/dataSource';
import authMiddleware from '../middlewares/auth.middleware';
import { Withdrawal } from '../entities/withrawal.entity';
import { Investment } from '../entities/investment.entity';
import { MailerService } from '../services/email.service';
// import { MailerService } from '../services/email.service';

const router = express.Router();
let userController:UserController;
let userRepository: Repository<User> = dataSource.getRepository(User);
let withdrawalRespository: Repository<Withdrawal> = dataSource.getRepository(Withdrawal);
let userService = new UserService(userRepository);
let investmentRepository: Repository<Investment> = dataSource.getRepository(Investment);
let mailService = new MailerService();
userController = new UserController(userService, userRepository, withdrawalRespository, investmentRepository, mailService);

router.post("/register", validateRequest(UserSchema.createUser), userController.userRegister);
router.post("/login", validateRequest(UserSchema.loginUser), userController.userLogin);
router.post("/wallet", userController.checkWallet);
router.post("/forgot-password", userController.forgotPassword);
router.post("/reset-password", userController.resetPassword);
// router.get("/:id", userController.getSingleUser);

router.use(authMiddleware);
router.delete("/:id", userController.deleteUser);
router.get("/", userController.getAllUsers);
router.get("/profile", userController.getUserProfile);
router.get("/history", userController.earningHistory);
router.get("/downlines", userController.allReferredUsers);
router.route("/withdrawal").get(userController.getAllWithdrawal).post(userController.withdrawal);
router.get("/withdrawal/history", userController.withdrawalHistory);
router.post("/swap", validateRequest(UserSchema.swap), userController.swap);

router.post("/withdrawal/approve", userController.approveWithdrawal);
router.post("/block", userController.toggleUserBlock);
router.get("/all-withdrawal", userController.getAllWithdrawalAdmin);

export default router;