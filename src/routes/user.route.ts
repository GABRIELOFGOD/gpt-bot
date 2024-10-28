import express from 'express';
import { validateRequest } from '../middlewares/joi.middleware';
import { userRegisterSchema } from '../schema/user.schema';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { dataSource } from '../config/dataSource';

const router = express.Router();
let userController:UserController;
let userService = new UserService();
let userRepository: Repository<User> = dataSource.getRepository(User);
userController = new UserController(userService, userRepository);

router.post("/register", validateRequest(userRegisterSchema), userController.userRegister);

export default router;