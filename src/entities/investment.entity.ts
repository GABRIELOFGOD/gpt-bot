import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity";

@Entity("investments")
export class Investment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  amount!: number;

  @ManyToOne( () => User, (user) => user.investments)
  investor!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
