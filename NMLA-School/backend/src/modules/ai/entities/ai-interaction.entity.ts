import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('ai_interactions')
export class AiInteraction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  @Column()
  conversationId: string;

  @Column({ type: 'text' })
  userMessage: string;

  @Column({ type: 'text' })
  aiResponse: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ default: 'chat' })
  interactionType: string;

  @Column({ default: 0 })
  tokensUsed: number;

  @Column({ default: 0 })
  responseTime: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.aiInteractions)
  @JoinColumn({ name: 'user_id' })
  user: User;
}