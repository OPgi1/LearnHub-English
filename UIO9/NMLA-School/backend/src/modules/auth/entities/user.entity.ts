import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from '../enums/user-role.enum';
import { UserProfile } from './user-profile.entity';
import { UserProgress } from '../../progress/entities/user-progress.entity';
import { AiInteraction } from '../../ai/entities/ai-interaction.entity';
import { UserAchievement } from '../../gamification/entities/user-achievement.entity';
import { PronunciationAttempt } from '../../voice/entities/pronunciation-attempt.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ default: UserRole.STUDENT })
  role: UserRole;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  @Exclude()
  emailVerificationToken: string;

  @Column({ nullable: true })
  @Exclude()
  passwordResetToken: string;

  @Column({ nullable: true })
  @Exclude()
  passwordResetExpires: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 'en' })
  preferredLanguage: string;

  @Column({ default: 'ar' })
  nativeLanguage: string;

  @Column({ default: false })
  isEnglishImmersion: boolean;

  @Column({ default: 0 })
  totalXp: number;

  @Column({ default: 1 })
  level: number;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @Column({ default: 0 })
  loginStreak: number;

  @Column({ nullable: true })
  placementTestCompletedAt: Date;

  @Column({ default: 'A1' })
  currentLevel: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => UserProfile, { eager: true, cascade: true })
  @JoinColumn()
  profile: UserProfile;

  @OneToMany(() => UserProgress, (progress) => progress.user)
  progress: UserProgress[];

  @OneToMany(() => AiInteraction, (interaction) => interaction.user)
  aiInteractions: AiInteraction[];

  @OneToMany(() => UserAchievement, (achievement) => achievement.user)
  achievements: UserAchievement[];

  @OneToMany(() => PronunciationAttempt, (attempt) => attempt.user)
  pronunciationAttempts: PronunciationAttempt[];
}