export interface UserRegisterDto {
  wallet: string;
  email: string;
  phone: string;
  password: string;
  name: string;
  referralCode?: string;
}