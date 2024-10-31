import { User } from "../entities/user.entity";
import { Repository } from "typeorm";
// import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

export class UserService {
  
  constructor(
    private userRepository: Repository<User>
  ) {}

  // ============== GENERATE UNIQUE REFERRAL CODE ============== //
  async generateUniqueReferralCode(): Promise<string> {
    let referralCode: string = "";
    let isUnique = false;

    while (!isUnique) {
      referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existingCode = await this.userRepository.findOne({
        where: { referralCode },
      });
      if (!existingCode) isUnique = true;
    }

    return referralCode;
  }

  // ===================== VERIFY USER CREDENTIALS ===================== //
  // async verifyUserCredentials(email: string, password: string): Promise<User | null> {
  //   const user = await this.userRepository.findOne({ where: { email } });
  //   if (!user) return null;
  //   return user;
  // }

  // ====================== SEND NEW IP NOTIFICATION ====================== //
  // async sendNewIpNotification(user: User, newIp: string): Promise<void> {
  //   const transporter = nodemailer.createTransport({
  //     service: "gmail",
  //     auth: {
  //       user: "youremail@gmail.com",
  //       pass: "yourpassword",
  //     },
  //   });

  //   const mailOptions = {
  //     from: "youremail@gmail.com",
  //     to: user.email,
  //     subject: "New IP Address Login Notification",
  //     html: `
  //     <p>Dear ${user.email},</p>
  //     <p>A new login was detected from IP address: <strong>${newIp}</strong>. If this wasn't you, please secure your account immediately.</p>
  //     `,
  //   };

  //   await transporter.sendMail(mailOptions);
  // }

  // ==================== UPDATE USER ==================== //
  async updateUser(user: User): Promise<User> {
    return await this.userRepository.save(user);
  }

  // ===================== GENERATE AUTH TOKEN ===================== //
  generateAuthToken(user: User): string {
    const tokenPayload = { id: user.id, wallet: user.wallet };
    const secretKey = process.env.JWT_SECRET!;
    const token = jwt.sign(tokenPayload, secretKey, { expiresIn: "10d" });
    return token;
  }
}
