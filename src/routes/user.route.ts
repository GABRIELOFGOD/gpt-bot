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
// import { MailerService } from '../services/email.service';

const router = express.Router();
let userController:UserController;
let userRepository: Repository<User> = dataSource.getRepository(User);
let withdrawalRespository: Repository<Withdrawal> = dataSource.getRepository(Withdrawal);
let userService = new UserService(userRepository);
// let mailService = new MailerService();
userController = new UserController(userService, userRepository, withdrawalRespository);

router.post("/register", validateRequest(UserSchema.createUser), userController.userRegister);
router.post("/login", validateRequest(UserSchema.loginUser), userController.userLogin);
// router.get("/:id", userController.getSingleUser);

router.use(authMiddleware);
router.delete("/:id", userController.deleteUser);
router.get("/", userController.getAllUsers);
router.get("/profile", userController.getUserProfile);
router.get("/history", userController.earningHistory);
// router.get("/downlines", userController.getAllDownlines);
router.route("/withdrawal").get(userController.getAllWithdrawal).post(userController.withdrawal);
router.get("/withdrawal/history", userController.withdrawalHistory);
router.post("/withdrawal/approve", userController.approveWithdrawal);

export default router;