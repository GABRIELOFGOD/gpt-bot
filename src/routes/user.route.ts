import express from 'express';
import { validateRequest } from '../middlewares/joi.middleware';
import { UserSchema } from '../schema/user.schema';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { dataSource } from '../config/dataSource';
import authMiddleware from '../middlewares/auth.middleware';
// import { MailerService } from '../services/email.service';

const router = express.Router();
let userController:UserController;
let userRepository: Repository<User> = dataSource.getRepository(User);
let userService = new UserService(userRepository);
// let mailService = new MailerService();
userController = new UserController(userService, userRepository);

router.post("/register", validateRequest(UserSchema.createUser), userController.userRegister);
router.post("/login", validateRequest(UserSchema.loginUser), userController.userLogin);
// router.get("/:id", userController.getSingleUser);

// =============== THIS ENDPOINTS WILL BE DISABLED FOR PRODUCTION =============== //
router.get("/", userController.getAllUsers);
router.delete("/:id", userController.deleteUser);

router.use(authMiddleware);
router.get("/profile", userController.getUserProfile);
router.get("/history", userController.earningHistory);

export default router;