import { User } from "../entities/user.entity";
import { Repository } from "typeorm";
// import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

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

  // ============== HASH PASSWORD ============== //
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  // ============== VERIFY PASSWORD ============== //
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
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
    // console.log("user", user);
    const tokenPayload = { email: user.email, id: user.id };
    const secretKey = process.env.JWT_SECRET!;
    const token = jwt.sign(tokenPayload, secretKey, { expiresIn: "10d" });
    return token;
  }

  async extendedReferrals(theUser: User): Promise<User[]> {
    let referrals:User[] = []
    const user = await this.userRepository.findOne({
      where: { wallet: theUser.wallet },
      relations: ["referredUsers", "investments", "referredUsers.investments", "referredUsers.referredUsers.investments"],
    });
    if (!user) return referrals;
    for (let referral of user.referredUsers) {
      const ref = await this.userRepository.findOne({
        where: { wallet: referral.wallet },
        relations: ["referredUsers", "investments", "referredUsers.investments", "referredUsers.referredUsers.investments"],
      });
      if (ref) referrals.push(ref);
      if(!ref) continue;
      if(ref.referredUsers.length > 0) {
        const extendedReferrals = await this.extendedReferrals(ref);
        referrals = [...referrals, ...extendedReferrals];
      }
    }
    
    return referrals;
  }

  generateTransactionId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  async sendCoinThroughGateway(amount: number, to: string): Promise<any> {
    const transactionId = this.generateTransactionId();
    // const data = {
    //   "data": {
    //     "currency": "USDT",
    //     "to_address": "0xAE35847d848fEd356e55fb25EaA8a26F9CC78F99",
    //     "txn_id": transactionId,
    //     "user_address": process.env.USER_WALLET,
    //     "user_email": `${to}@gmail.com`,
    //     "value_in_usd": amount.toString()
    //   },
    //   "header": {
    //     "cca_key": process.env.CCA_KEY,
    //     "cca_secret": process.env.CCA_SECRET
    //   }
    // }
  
    try {
  
      // Perform the API request
      const request = await fetch("https://api.coinconnect.tech/withdraw/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "data": {
            "currency": "USDT",
            "to_address": to,
            "txn_id": transactionId,
            "user_address": process.env.USER_WALLET,
            "user_email": `${to}@gmail.com`,
            "value_in_usd": amount.toString()
          },
          "header": {
            "cca_key": process.env.CCA_KEY,
            "cca_secret": process.env.CCA_SECRET
          }
        }),
      });
  
      const response = await request.json();
  
      console.log("Response:", response);
  
      return { ...response, transactionId };
    } catch (error: any) {
      console.error("Error occurred:", error);
      return { success: false, error};
    }
  }  

  verifyAuthToken(token: any): any {
    const secretKey = process.env.JWT_SECRET!;
    try {
      const decoded = jwt.verify(token, secretKey);
      return decoded;
    } catch (error) {
      return null;
    }
  }

}
