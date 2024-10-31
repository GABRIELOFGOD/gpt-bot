import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity("claim")
export class Claim {
  @PrimaryGeneratedColumn()
  id!: number;
  
  @Column({ type: "decimal", precision: 10, scale: 4, default: "0.00" })
  amount!: number;

  @ManyToOne(() => User, (user) => user.claims, { nullable: true })
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;
}