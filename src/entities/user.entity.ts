import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Investment } from './investment.entity';
import { EarningsHistory } from './earningHistory.entity';

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  wallet!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  referralCode!: string;

  @Column()
  balance!: number;

  @OneToMany( () => Investment, (investment) => investment.investor, { nullable: true })
  investments!: Investment[];

  @ManyToOne(() => User, (user) => user.referredUsers, { nullable: true })
  referredBy!: User;

  @OneToMany(() => User, (user) => user.referredBy, { nullable: true })
  referredUsers!: User[];

  @Column()
  lastKnownIp!: string;

  @Column({ default: "active" })
  status!: string;

  @Column({ default: true })
  hasActiveInvestment!: boolean;

  @OneToMany( () => EarningsHistory, (earningsHistory) => earningsHistory.user)
  earningsHistory!: EarningsHistory[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
