import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { UserRegisterDto } from "../dtos/userRegister.dto";
import { UserService } from "../services/user.service";
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { AppError } from "../services/error.service";
import { getClientIp } from "request-ip";
import { MailerService } from "../services/email.service";

export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userRepository: Repository<User>,
    private readonly mailService: MailerService
  ){}

  // ==================== USER REGISTER CONTROLLER ==================== //
  userRegister = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userRegisterDto: UserRegisterDto = req.body;
    const userIp = getClientIp(req);

    // ================ CHECK IF USER EXISTS ================ //
    const existingUser = await this.userRepository.findOne({
      where: { email: userRegisterDto.email },
    });
    if (existingUser) return next(new AppError("User already exists", 400));

    // ==================== CREATE NEW USER ==================== //
    const newUser = this.userRepository.create(userRegisterDto);
    newUser.referralCode = await this.userService.generateUniqueReferralCode();
    newUser.balance = 0;
    newUser.investment = 0;
    newUser.lastKnownIp = userIp || "";

    // ==================== REFERRAL CODE ==================== //
    if (userRegisterDto.referralCode) {
      const referredByUser = await this.userRepository.findOne({
        where: { referralCode: userRegisterDto.referralCode },
      });
      if (!referredByUser) return next(new AppError("Referral code is invalid", 400));
      newUser.referredBy = referredByUser;
    }

    // ================= SEND NEW IP NOTIFICATION ================= //
    await this.userRepository.save(newUser);

    // ================= GENERATE AUTH TOKEN ================= //
    const authToken = this.userService.generateAuthToken(newUser);
    res.status(201).json({ status: "User created successfully", token: authToken });
  });


  // ==================== USER LOGIN CONTROLLER ==================== //
  userLogin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { email, wallet } = req.body;
    const userIp = getClientIp(req) || req.ip || "";

    // ================= VERIFY USER CREDENTIALS ================= //
    const user = await this.userRepository.findOne({ where: { email, wallet } });
    if (!user) return next(new AppError("Invalid credentials", 401));

    // =================== SEND NEW IP NOTIFICATION =================== //
    if (user.lastKnownIp !== userIp) {
      await this.mailService.sendNewIpNotification(user.email, userIp);
      user.lastKnownIp = userIp;
      await this.userService.updateUser(user);
    }

    // ================= GENERATE AUTH TOKEN ================= //
    const authToken = this.userService.generateAuthToken(user);

    // ================= SEND RESPONSE ================= //
    res.status(200).json({
      message: "Login successful",
      token: authToken,
    });
  });


  // ==================== GET ALL USERS CONTROLLER =================
  getAllUsers = catchAsync(async (req: Request, res: Response) => {
    const users = await this.userRepository.find();
    res.status(200).json({ users });
  });

  getSingleUser = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = parseInt(id);
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["referredBy", "referredUsers"],
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ user });
  });

  // ==================== DELETE USER CONTROLLER ==================== //
  deleteUser = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.userRepository.delete(id);
    res.status(204).json({ status: "User deleted successfully" });
  });
  
}