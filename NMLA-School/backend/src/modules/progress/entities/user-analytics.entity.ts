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

@Entity('user_analytics')
export class UserAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  @Column({ type: 'jsonb' })
  metrics: any;

  @Column({ type: 'jsonb', nullable: true })
  insights: any;

  @Column({ type: 'jsonb', nullable: true })
  recommendations: any;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.analytics)
  @JoinColumn({ name: 'user_id' })
  user: User;
}