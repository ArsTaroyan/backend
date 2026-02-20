import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, Index } from 'typeorm';
import { Conversation } from './conversation.entity';
import { User } from 'src/auth/user.entity';

@Entity('message')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  conversation: Conversation;

  @Column()
  conversationId: number;

  @ManyToOne(() => User, { eager: true })
  sender: User;

  @Column()
  senderId: number;

  @Column('text')
  text: string;

  @CreateDateColumn()
  createdAt: Date;
}