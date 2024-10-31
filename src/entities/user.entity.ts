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
import { Claim } from './claim.entity';

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  wallet!: string;

  // @Column({ unique: true })
  // email!: string;

  @Column({ nullable: true })
  referralCode!: string;

  @Column({ type: "decimal", precision: 10, scale: 4, default: "0.00" })
  balance!: number;

  @Column({ type: "decimal", precision: 10, scale: 4, default: "0.00" })
  claimable!: number;

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

  @Column({ default: false })
  hasActiveInvestment!: boolean;

  @OneToMany( () => EarningsHistory, (earningsHistory) => earningsHistory.user)
  earningsHistory!: EarningsHistory[];

  @OneToMany( () => Claim, (claim) => claim.user)
  claims!: Claim[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
