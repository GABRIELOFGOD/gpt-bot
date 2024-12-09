import { User } from "../entities/user.entity";

export interface Downlines extends User {
  level: number;
}