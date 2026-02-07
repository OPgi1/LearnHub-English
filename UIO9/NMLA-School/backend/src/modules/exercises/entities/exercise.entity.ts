import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Lesson } from '../../lessons/entities/lesson.entity';
import { UserProgress } from '../../progress/entities/user-progress.entity';

@Entity('exercises')
export class Exercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  type: string;

  @Column({ type: 'jsonb' })
  content: any;

  @Column({ type: 'jsonb', nullable: true })
  options: any;

  @Column({ type: 'jsonb', nullable: true })
  correctAnswers: any;

  @Column({ default: 0 })
  difficulty: number;

  @Column({ default: 0 })
  estimatedTime: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  order: number;

  @Column({ type: 'text', array: true, default: [] })
  tags: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Lesson, (lesson) => lesson.exercises)
  @JoinColumn({ name: 'lesson_id' })
  lesson: Lesson;

  @OneToMany(() => UserProgress, (progress) => progress.exercise)
  userProgress: UserProgress[];
}