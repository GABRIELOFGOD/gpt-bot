import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity";

@Entity("investments")
export class Investment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  amount!: number;

  @Column({ default: false })
  expired!: boolean;

  @Column()
  transactionHash!: string;

  @Column({ type: "decimal", precision: 10, scale: 4, default: "0.00" })
  amountReturned!: number;

  @ManyToOne( () => User, (user) => user.investments)
  investor!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
