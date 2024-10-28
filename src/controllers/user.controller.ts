import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { UserRegisterDto } from "../dtos/userRegister.dto";
import { UserService } from "../services/user.service";
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";

export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userRepository: Repository<User>
  ){}

  userRegister = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userRegisterDto: UserRegisterDto = req.body;

  });
}