import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity("withdrawal")
export class Withdrawal {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "decimal", precision: 10, scale: 4, default: "0.00" })
  amount!: number;

  @ManyToOne(() => User, (user) => user.claims, { nullable: true })
  user!: User;

  @Column({
    type: "enum",
    enum: ["processing", "failed", "completed"],
    default: "processing"
  })
  status!: "processing" | "failed" | "completed";

  @CreateDateColumn()
  createdAt!: Date;
}