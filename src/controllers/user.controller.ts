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
import { Downlines } from "../dtos/downlines";
import { Investment } from "../entities/investment.entity";
import { MailerService } from "../services/email.service";

// import { MailerService } from "../services/email.service";

export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userRepository: Repository<User>,
    private readonly withdrawalRepository: Repository<Withdrawal>,
    private readonly investmentRepository: Repository<Investment>,
    private readonly mailService: MailerService
  ){}

  // const userRepository = Repository<User>;

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
    if(!validator.isStrongPassword(userRegisterDto.password)) return next(new AppError("Password must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number and 1 symbol", 400));
    
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
    
    // ==================== HASH PASSWORD ==================== //
    const hashedPassword = await this.userService.hashPassword(userRegisterDto.password);
    newUser.password = hashedPassword;
    
    await this.userRepository.save(newUser);

    // ==================== SEND WELCOME EMAIL ==================== //
    await this.mailService.welcomeEmail(newUser.email);

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
    const newWithrawal = this.withdrawalRepository.create({amount, user});

    user.balance = user.balance - amount;
    // newWithrawal.transactionId = gatewayResponse.transactionId;
    await this.withdrawalRepository.save(newWithrawal);
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
    const withdrawals = await this.withdrawalRepository.find({
      relations: ["user"],
    }).then(withdrawals => withdrawals.reverse());
    res.status(200).json({ withdrawals });
  });


  getUserProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const theUser = req.user;
    const user = await this.userRepository.findOne({
      where: { email: theUser.email },
      relations: ["referredBy", "referredUsers", "investments", "claims", "withdrawalHistory", "referredUsers.investments"],
    });
    if (!user) return next(new AppError("User not found", 404))
    const { password, ...userWithoutRole } = user;
    res.status(200).json({ user: userWithoutRole });
  });

  swap = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const theUser = req.user;

    // Fetch the user from the database
    const user = await this.userRepository.findOne({
      where: { email: theUser.email },
    });

    if (!user) return next(new AppError("User not found", 404));

    const { amount, to }: { amount: number; to: "USDT" | "GPT" } = req.body;

    // Validate inputs
    if (!amount || amount <= 0 || !to) {
      return next(new AppError("Invalid input data", 400));
    }

    // Conversion rates
    const USDT_TO_GPT_RATE = 0.004; // Example rate
    const GPT_TO_USDT_RATE = 1 / USDT_TO_GPT_RATE;

    // Check for sufficient balance and perform swap
    if (to === "USDT") {
      if (user.gptBalance < amount) {
        return next(new AppError("Insufficient GPT balance", 400));
      }
      const convertedAmount = amount * USDT_TO_GPT_RATE;
      // console.log("convertedAmount to USDT", convertedAmount);
      user.gptBalance = parseFloat((Number(user.gptBalance) - Number(amount)).toFixed(4));
      user.balance = parseFloat((Number(user.balance) + Number(convertedAmount)).toFixed(4));
      // user.balance += convertedAmount;
    } else if (to === "GPT") {
      if (user.balance < amount) {
        return next(new AppError("Insufficient USDT balance", 400));
      }
      const convertedAmount = amount * GPT_TO_USDT_RATE;
      // console.log("convertedAmount to GPT", convertedAmount);
      user.balance = parseFloat((Number(user.balance) - Number(amount)).toFixed(4));
      user.gptBalance = parseFloat((Number(user.gptBalance) + Number(convertedAmount)).toFixed(4));
    } else {
      return next(new AppError("Invalid target currency", 400));
    }

    // Save the updated user to the database
    await this.userRepository.save(user);

    // Respond with updated balances
    return res.status(200).json({
      status: "success",
      message: "Swap successful",
      data: {
        balance: user.balance,
        gptBalance: user.gptBalance,
      },
    });
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

  checkWallet = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { wallet } = req.body;
    if(!wallet) return next(new AppError("Wallet address is required", 400));
    const user = await this.userRepository.findOne({
      where: { wallet }
    });
    if(!user) return next(new AppError("Wallet address not found", 404));
    res.status(200).json({ user });
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

    const theWithdrawal = await this.withdrawalRepository.findOne({
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
    await this.withdrawalRepository.save(theWithdrawal);

    res.status(200).json({ message: "Withdrawal approved successfully" });
  });

  // =========================== ALL REFERERRED USERS ============================== //
  // allReferredUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  //   let allDownlines: Downlines[] = [];
  //   const theUser = req.user;

  //   // Fetch the user with their direct referrals
  //   const user = await this.userRepository.findOne({
  //       where: { email: theUser.email },
  //       relations: ["referredUsers"],
  //   });

  //   if (!user) return next(new AppError("User not found", 404));

  //   // Recursive function to get referrals up to the 20th generation
  //   const fetchReferrals = async (currentUser: User, level: number) => {
  //       if (level > 20 || !currentUser.referredUsers || currentUser.referredUsers.length === 0) return;

  //       for (const referral of currentUser.referredUsers) {
  //           // Fetch investments for the referral
  //           const investments = await this.investmentRepository.find({
  //               where: { investor: referral },
  //               relations: ["investor"],
  //           });
  //           const totalInvestment = investments.reduce((sum, inv) => sum + inv.amount, 0);

  //           // Add the referral to allDownlines
  //           allDownlines.push({
  //               name: referral.name,
  //               email: referral.email,
  //               phone: referral.phone || "N/A",
  //               address: referral.wallet || "N/A",
  //               level,
  //               investment: totalInvestment,
  //           });

  //           // Recursively fetch the next generation
  //           await fetchReferrals(referral, level + 1);
  //       }
  //   };

  //   // Start fetching from the current user
  //   await fetchReferrals(user, 1);

  //   res.status(200).json({ data: allDownlines });
  // });

  allReferredUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let allDownlines: Downlines[] = [];
    const theUser = req.user;

    // Fetch the user with their direct referrals
    const user = await this.userRepository.findOne({
        where: { email: theUser.email },
        relations: ["referredUsers", "referredUsers.investments"],
    });

    if (!user) return next(new AppError("User not found", 404));

    // Recursive function to fetch referrals up to the 20th generation
    const fetchReferrals = async (currentUser: User, level: number) => {
        if (level > 20 || !currentUser.referredUsers || currentUser.referredUsers.length === 0) return;

        for (const referral of currentUser.referredUsers) {
            // Fetch investments for the referral
            const investments = await this.investmentRepository.find({
                where: { investor: referral },
            });
            const totalInvestment = investments.reduce((sum, inv) => sum + inv.amount, 0);

            // Add the referral to allDownlines with its level
            allDownlines.push({
              ...referral, level
            });

            // Fetch the referral's own referrals recursively
            const referralDetails = await this.userRepository.findOne({
                where: { wallet: referral.wallet },
                relations: ["referredUsers", "referredUsers.investments"],
            });

            if (referralDetails) {
                await fetchReferrals(referralDetails, level + 1);
            }
        }
    };

    // Start fetching referrals from the top level
    await fetchReferrals(user, 1);

    res.status(200).json({ data: allDownlines });
  });

  toggleUserBlock = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.body;
    if (!userId) return next(new AppError("User ID is required to perform this operation", 400));
    const theUser = req.user;
    const user = await this.userRepository.findOne({
      where: { email: theUser.email },
    });
    if (!user || user.role !== "admin") return next(new AppError("Sorry! you are not allowed to perform this operation.", 404));

    const theUserToBlock = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!theUserToBlock) return next(new AppError("Invalid request, please reload and check user data again", 404));

    theUserToBlock.status == "active" ? theUserToBlock.status = "blocked" : theUserToBlock.status = "active";
    await this.userRepository.save(theUserToBlock);

    res.status(200).json({ message: "User status updated successfully" });
  });
  
  // ======================= GET ALL WITHDRAWAL ======================== //
  getAllWithdrawalAdmin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const theUser = req.user;
    if(!theUser) return next(new AppError("Unauthorized request", 400));
    const user = await this.userRepository.findOne({
      where: { email: theUser.email },
    });
    if (!user || user.role !== "admin") return next(new AppError("Sorry! you are not allowed to perform this operation.", 404));
    const withdrawals = await this.withdrawalRepository.find({
      relations: ["user"],
    }).then(withdrawals => withdrawals.reverse());
    res.status(200).json({ withdrawals });
  });


  // ==================== FORGOT PASSWORD ===================== //
  forgotPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    if(!email) return next(new AppError("Email address is required", 400));
    const existedUser = await this.userRepository.findOne({
      where: {email}
    });

    if(!existedUser) return next(new AppError("User not found", 404));

    const token = this.userService.generateAuthToken(existedUser);
    await this.mailService.sendPasswordResetEmail(existedUser.email, token);
    res.status(200).json({message: "Password reset link sent to your email"});
    
  });

  resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.query;
    const { password } = req.body;
    
    if(!token || !password) return next(new AppError("Invalid request", 400));
    const decoded = this.userService.verifyAuthToken(token);
    console.log("decoded", decoded);
    if(!decoded) return next(new AppError("Invalid token", 400));
    const user = await this.userRepository.findOne({
      where: { email: decoded.email }
    });
    if(!user) return next(new AppError("User not found", 404));
    const hashedPassword = await this.userService.hashPassword(password);
    user.password = hashedPassword;
    await this.userRepository.save(user);
    res.status(200).json({message: "Password reset successful"});
  });
  
}