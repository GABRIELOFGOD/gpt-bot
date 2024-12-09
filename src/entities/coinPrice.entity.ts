import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity";

@Entity("price")
export class Price {
  @PrimaryGeneratedColumn()
  id!: number;
  
  @Column({ type: "decimal", precision: 10, scale: 4, default: "0.00" })
  price!: number;

  @ManyToOne(() => User, (user) => user.claims, { nullable: true })
  updatedBy!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}