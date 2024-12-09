import { User } from "src/entities/user.entity";

export interface SwapDto {
  amount: number;
  user: User;
  to: "USDT" | "GPT";
}