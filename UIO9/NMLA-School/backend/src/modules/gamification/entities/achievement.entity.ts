import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserAchievement } from './user-achievement.entity';

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  icon: string;

  @Column()
  category: string;

  @Column({ default: 0 })
  xpReward: number;

  @Column({ default: 0 })
  coinReward: number;

  @Column({ type: 'jsonb', nullable: true })
  requirements: any;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 1 })
  sortOrder: number;

  @Column({ type: 'text', array: true, default: [] })
  tags: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => UserAchievement, (userAchievement) => userAchievement.achievement)
  userAchievements: UserAchievement[];
}