import { NextFunction, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { UserRegisterDto } from "../dtos/userRegister.dto";
import { UserService } from "../services/user.service";
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { AppError } from "../services/error.service";
import { getClientIp } from "request-ip";
import { Request } from "../@types/custome";
import { Withdrawal } from "../entities/withrawal.entity";
import validator from "validator";

// import { MailerService } from "../services/email.service";

export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userRepository: Repository<User>,
    private readonly withdrawalRespository: Repository<Withdrawal>
    // private readonly mailService: MailerService
  ){}

  userRegister = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userRegisterDto: UserRegisterDto = req.body;
    const userIp = getClientIp(req) || req.ip || "";

    // ================ CHECK IF USER EXISTS ================ //
    let user = await this.userRepository.findOne({
      where: { email: userRegisterDto.email },
    });

    if (user) return next(new AppError("User already exists", 400));

    // =================== VALIDATING PASSWORD =========================== //
    if(!validator.isEmail(userRegisterDto.email)) return next(new AppError("Invalid email address", 400));
    
      // ==================== REGISTER NEW USER ==================== //
    const newUser = this.userRepository.create(userRegisterDto);
    newUser.referralCode = await this.userService.generateUniqueReferralCode();
    newUser.balance = 0;
    newUser.claimableROI = 0;
    newUser.claimableRef = 0;
    newUser.lastKnownIp = userIp;

    // ==================== REFERRAL CODE ==================== //
    if (userRegisterDto.referralCode) {
      const referredByUser = await this.userRepository.findOne({
        where: { referralCode: userRegisterDto.referralCode.toUpperCase() },
      });
      if (!referredByUser) return next(new AppError("Referral code is invalid", 400));
      newUser.referredBy = referredByUser;
    }

    // ==================== ISSTRONG PASSWORD ==================== //
    if(!validator.isStrongPassword(userRegisterDto.password)) return next(new AppError("Password must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number and 1 symbol", 400));
    
    // ==================== HASH PASSWORD ==================== //
    const hashedPassword = await this.userService.hashPassword(userRegisterDto.password);
    newUser.password = hashedPassword;
    
    // ================= SEND NEW IP NOTIFICATION ================= //
    await this.userRepository.save(newUser);

    // ================= GENERATE AUTH TOKEN ================= //
    const authToken = this.userService.generateAuthToken(newUser);
    return res.status(201).json({ status: "User created successfully", token: authToken });
  });


  // ==================== USER LOGIN CONTROLLER ==================== //
  userLogin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    const userIp = getClientIp(req) || req.ip || "";

    // ================= VERIFY USER CREDENTIALS ================= //
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) return next(new AppError("Invalid credentials", 401));

    // ================= VERIFY PASSWORD ================= //
    const isPasswordValid = await this.userService.verifyPassword(password, user.password);
    if (!isPasswordValid) return next(new AppError("Invalid credentials", 401));

    // =================== SEND NEW IP NOTIFICATION =================== //
    if (user.lastKnownIp !== userIp) {
      // await this.mailService.sendNewIpNotification(user.wallet, userIp);
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

  // ===================== EARNING HISTORY ======================== //
  earningHistory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const theUser = req.user;
    if(!theUser) return next(new AppError("Unauthorized request", 400));
    const user = await this.userRepository.findOne({
      where: { email: theUser.email },
      relations: ["earningsHistory"],
    });
    if (!user) return next(new AppError("User not found", 404));
    res.status(200).json({ history: user.earningsHistory.reverse() });
  });


  // =========================== WITHRAWAL ======================== //
  withdrawal = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const theUser = req.user;
    if(!theUser) return next(new AppError("Unauthorized request", 400));
    const user = await this.userRepository.findOne({
      where: { email: theUser.email },
      relations: ["earningsHistory", "investments"],
    });
    if (!user) return next(new AppError("User not found", 404));
    const { amount } = req.body;
    // console.log(user?.balance, "trying to withdraw ", amount)
    if(!amount || amount < 10) return next(new AppError("Minimum withrawal amount us $10, please enter a valid amount", 400));
    if(user.balance < 10 || amount > user.balance) return next(new AppError("Insufficient balance!", 400));
    // const disposable = user.balance - user.investments.reduce((acc, investment) => acc + investment.amount, 0);
    // if(disposable < amount) return next(new AppError("Insufficient balance!", 400));

    // ======================== CREATING WITHRAWAL ======================== //
    const newWithrawal = this.withdrawalRespository.create({amount, user});

    user.balance = user.balance - amount;
    // newWithrawal.transactionId = gatewayResponse.transactionId;
    await this.withdrawalRespository.save(newWithrawal);
    await this.userRepository.save(user);
    res.status(200).json({message: `Withdarawal of ${amount} is processing.`})

  });

  
  withdrawalHistory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const theUser = req.user;
    if(!theUser) return next(new AppError("Unauthorized request", 400));
    const user = await this.userRepository.findOne({
      where: { email: theUser.email },
      relations: ["withdrawalHistory"],
    });
    if (!user) return next(new AppError("Sorry! you are not allowed to perform this operation.", 404));
    res.status(200).json({ data: user.withdrawalHistory });
  });


  // ==================== GET ALL USERS CONTROLLER =================
  getAllUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const theUser = req.user;
    if(!theUser) return next(new AppError("Unauthorized request", 400));
    const user = await this.userRepository.findOne({
      where: { email: theUser.email }
    });
    if (!user || user.role !== "admin") return next(new AppError("Sorry! you are not allowed to perform this operation.", 404));
    const users = await this.userRepository.find();
    res.status(200).json({ users });
  });


  getAllWithdrawal = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const theUser = req.user;
    if(!theUser) return next(new AppError("Unauthorized request", 400));
    const user = await this.userRepository.findOne({
      where: { email: theUser.email },
    });
    if (!user || user.role !== "admin") return next(new AppError("Sorry! you are not allowed to perform this operation.", 404));
    const withdrawals = await this.withdrawalRespository.find({
      relations: ["user"],
    }).then(withdrawals => withdrawals.reverse());
    res.status(200).json({ withdrawals });
  });


  getUserProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const theUser = req.user;
    const user = await this.userRepository.findOne({
      where: { email: theUser.email },
      relations: ["referredBy", "referredUsers", "investments", "claims", "withdrawalHistory"],
    });
    if (!user) return next(new AppError("User not found", 404))
    const { role, password, ...userWithoutRole } = user;
    res.status(200).json({ user: userWithoutRole });
  });


  getAllDownlines = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const theUser = req.user;
    const user = await this.userRepository.findOne({
      where: { email: theUser.email },
      relations: ["referredUsers", "referredUsers.referredUsers", "referredUsers.referredUsers.referredUsers", "investments", "referredUsers.investments", "referredUsers.referredUsers.investments"],
    });
    if (!user) return next(new AppError("User not found", 404));
    const referralsExtended = await this.userService.extendedReferrals(user);
    res.status(200).json({ referrals: referralsExtended });
  });
  
  // ==================== DELETE USER CONTROLLER ==================== //
  deleteUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const theUser = req.user;
    const user = await this.userRepository.findOne({
      where: { email: theUser.email }
    });
    if (!user || user.role !== "admin") return next(new AppError("Sorry! you are not allowed to perform this operation.", 404 ))
    const { id } = req.params;
    await this.userRepository.delete(id);
    res.status(204).json({ status: "User deleted successfully" });
  });



  // =========================== WITHDRAWAL ============================== //
  approveWithdrawal = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { withdrawalId } = req.body;
    if (!withdrawalId) return next(new AppError("Withdrawal ID is required to perform this operation", 400));
    const theUser = req.user;
    const user = await this.userRepository.findOne({
      where: { email: theUser.email },
    });
    if (!user || user.role !== "admin") return next(new AppError("Sorry! you are not allowed to perform this operation.", 404));

    const theWithdrawal = await this.withdrawalRespository.findOne({
      where: { id: withdrawalId },
      relations: ['user']
    });

    if (!theWithdrawal) return next(new AppError("Invalid request, please reload and check withdrawal data again", 404));
    if (theWithdrawal.status === "completed" || theWithdrawal.status === "failed") return next(new AppError("This withdrawal is already completed, please try another", 400));

    // ======================== SIGN WITHDRAWAL AND SEND TO BLOCKCHAIN ================================ //
    const gatewayResponse = await this.userService.sendCoinThroughGateway(theWithdrawal.amount, theWithdrawal.user.wallet);
    console.log("Gate way response")
    if(gatewayResponse.status !== "OK") return next(new AppError("Payment failed", 400));
    // ======================== SIGN WITHDRAWAL AND SEND TO BLOCKCHAIN ================================ //

    theWithdrawal.status = "completed";
    await this.withdrawalRespository.save(theWithdrawal);

    res.status(200).json({ message: "Withdrawal approved successfully" });
  });
  
}