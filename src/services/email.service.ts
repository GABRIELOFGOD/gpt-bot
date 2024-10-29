import * as nodemailer from 'nodemailer';

export class MailerService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'aletechglobal@gmail.com',
        pass: process.env.GOOGLE_EMAIL_AUTH
      }
    });
  }

  async sendNewIpNotification(to: string, newIp: string) {
    const info = await this.transporter.sendMail({
      from: 'aletechglobal@gmail.com',
      to: to,
      subject: "New IP Address Login Notification",
      html: `
      <p>Dear ${to},</p>
      <p>A new login was detected from IP address: <strong>${newIp}</strong>. If this wasn't you, please secure your account immediately.</p>
      `,
    });

    console.log('Message sent: %s', info.messageId);
  }

  async sendTopUpNotification(to: string, userName: string) {
    const info = await this.transporter.sendMail({
      from: 'aletechglobal@gmail.com',
      to: to,
      subject: "Top-Up Required to Continue Earnings",
      html: `
      <p>Dear ${userName},</p>
      <p>Congratulations! You have reached 300% of your initial investment earnings.</p>
      <p>To continue earning, please top up your investment.</p>
      <p>Thank you for your continued trust in our platform.</p>
      <p>Best regards,<br> Your Investment Team</p>
      `,
    });

    console.log('Top-up notification sent: %s', info.messageId);
  }
}
