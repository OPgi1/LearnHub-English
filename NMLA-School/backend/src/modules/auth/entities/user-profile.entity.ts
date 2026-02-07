import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  dateOfBirth: Date;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  learningGoal: string;

  @Column({ default: 'beginner' })
  englishLevel: string;

  @Column({ default: true })
  notificationsEnabled: boolean;

  @Column({ default: true })
  emailNotificationsEnabled: boolean;

  @Column({ default: true })
  pushNotificationsEnabled: boolean;

  @Column({ nullable: true })
  timezone: string;

  @Column({ default: false })
  darkModeEnabled: boolean;

  @Column({ default: 'ltr' })
  textDirection: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, { primary: true })
  @JoinColumn()
  user: User;
}