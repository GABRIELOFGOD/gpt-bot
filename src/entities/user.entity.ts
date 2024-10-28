import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @Column()
  investment!: number;

  @ManyToOne(() => User, (user) => user.referredUsers, { nullable: true })
  referredBy!: User;

  @OneToMany(() => User, (user) => user.referredBy, { nullable: true })
  referredUsers!: User[];

  @Column()
  lastKnownIp!: string;

  @Column({ default: "active" })
  status!: string;

  @Column({ default: true })
  earning!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
