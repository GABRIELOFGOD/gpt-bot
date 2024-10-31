import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity("earnings_history")
export class EarningsHistory {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, user => user.earningsHistory)
    user!: User;

    @Column({ type: "decimal", precision: 10, scale: 4, default: "0.00" })
    amountEarned!: number;

    @Column({ nullable: true })
    generationLevel?: number; 

    @CreateDateColumn()
    date!: Date;
}
