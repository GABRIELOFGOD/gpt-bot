import { NextFunction, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { UserRegisterDto } from "../dtos/userRegister.dto";
import { UserService } from "../services/user.service";
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { AppError } from "../services/error.service";
import { getClientIp } from "request-ip";
import { Request } from "../@types/custome";

// import { MailerService } from "../services/email.service";

export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userRepository: Repository<User>,
    // private readonly mailService: MailerService
  ){}

  // ==================== USER REGISTER CONTROLLER ==================== //
  userRegisterOrLogin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userRegisterDto: UserRegisterDto = req.body;
    const userIp = getClientIp(req) || req.ip || "";

    // ================ CHECK IF USER EXISTS ================ //
    let user = await this.userRepository.findOne({
      where: { wallet: userRegisterDto.wallet },
    });

    if (user) {
      // ==================== LOGIN USER ==================== //
      // =================== SEND NEW IP NOTIFICATION =================== //
      if (user.lastKnownIp !== userIp) {
        // await this.mailService.sendNewIpNotification(user.wallet, userIp);
        user.lastKnownIp = userIp;
        await this.userService.updateUser(user);
      }

      // ================= GENERATE AUTH TOKEN ================= //
      const authToken = this.userService.generateAuthToken(user);

      // ================= SEND RESPONSE ================= //
      return res.status(200).json({
        message: "Login successful",
        token: authToken,
      });
    } else {
      // ==================== REGISTER NEW USER ==================== //
      const newUser = this.userRepository.create(userRegisterDto);
      newUser.referralCode = await this.userService.generateUniqueReferralCode();
      newUser.balance = 0;
      newUser.claimable = 0;
      newUser.lastKnownIp = userIp;

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
      return res.status(201).json({ status: "User created successfully", token: authToken });
    }
  });


  // ==================== USER LOGIN CONTROLLER ==================== //
  // userLogin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  //   const { wallet } = req.body;
  //   const userIp = getClientIp(req) || req.ip || "";

  //   // ================= VERIFY USER CREDENTIALS ================= //
  //   const user = await this.userRepository.findOne({ where: { wallet } });
  //   if (!user) return next(new AppError("Invalid credentials", 401));

  //   // =================== SEND NEW IP NOTIFICATION =================== //
  //   // if (user.lastKnownIp !== userIp) {
  //   //   // await this.mailService.sendNewIpNotification(user.wallet, userIp);
  //   //   user.lastKnownIp = userIp;
  //   //   await this.userService.updateUser(user);
  //   // }

  //   // ================= GENERATE AUTH TOKEN ================= //
  //   const authToken = this.userService.generateAuthToken(user);

  //   // ================= SEND RESPONSE ================= //
  //   res.status(200).json({
  //     message: "Login successful",
  //     token: authToken,
  //   });
  // });

  earningHistory = catchAsync(async (req: Request, res: Response) => {
    const theUser = req.user;
    const user = await this.userRepository.findOne({
      where: { wallet: theUser.wallet },
      relations: ["earningsHistory"],
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ history: user.earningsHistory });
  }
  );

  // ==================== GET ALL USERS CONTROLLER =================
  getAllUsers = catchAsync(async (req: Request, res: Response) => {
    const users = await this.userRepository.find();
    res.status(200).json({ users });
  });

  getUserProfile = catchAsync(async (req: Request, res: Response) => {
    const theUser = req.user;
    const user = await this.userRepository.findOne({
      where: { wallet: theUser.wallet },
      relations: ["referredBy", "referredUsers", "investments", "claims"],
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