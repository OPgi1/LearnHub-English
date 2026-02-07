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
import { Achievement } from './achievement.entity';

@Entity('user_achievements')
export class UserAchievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  @Column({ default: false })
  isUnlocked: boolean;

  @Column({ nullable: true })
  unlockedAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.achievements)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Achievement, (achievement) => achievement.userAchievements)
  @JoinColumn({ name: 'achievement_id' })
  achievement: Achievement;
}