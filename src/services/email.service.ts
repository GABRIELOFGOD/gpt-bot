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
  
}
