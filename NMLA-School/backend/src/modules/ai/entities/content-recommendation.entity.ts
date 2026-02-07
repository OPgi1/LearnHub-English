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

@Entity('content_recommendations')
export class ContentRecommendation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  @Column()
  recommendationType: string;

  @Column({ type: 'jsonb' })
  content: any;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ default: 0 })
  confidenceScore: number;

  @Column({ default: false })
  isConsumed: boolean;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.contentRecommendations)
  @JoinColumn({ name: 'user_id' })
  user: User;
}