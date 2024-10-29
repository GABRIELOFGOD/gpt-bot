import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity("earnings_history")
export class EarningsHistory {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, user => user.earningsHistory)
    user!: User;

    @Column()
    amountEarned!: number;

    @Column({ nullable: true })
    generationLevel?: number;  // Nullable for direct investment earnings

    @CreateDateColumn()
    date!: Date;
}
