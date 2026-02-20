import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, Unique, UpdateDateColumn, CreateDateColumn } from 'typeorm';
import { User } from 'src/auth/user.entity';

@Entity('conversation')
@Unique(['userAId', 'userBId'])
export class Conversation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userAId: number;

  @Column()
  userBId: number;

  @ManyToOne(() => User, { eager: true })
  userA: User;

  @ManyToOne(() => User, { eager: true })
  userB: User;

  @Column({ type: 'text', nullable: true })
  lastMessage: string | null;

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}