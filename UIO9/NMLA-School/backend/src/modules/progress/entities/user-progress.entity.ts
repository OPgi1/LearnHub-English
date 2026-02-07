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
import { Vocabulary } from '../../vocabulary/entities/vocabulary.entity';
import { Sentence } from '../../vocabulary/entities/sentence.entity';

@Entity('user_progress')
export class UserProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  @Column()
  activityType: string;

  @Column({ type: 'jsonb', nullable: true })
  activityData: any;

  @Column({ default: 0 })
  score: number;

  @Column({ default: 0 })
  maxScore: number;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ default: 0 })
  timeSpent: number;

  @Column({ type: 'jsonb', nullable: true })
  performanceMetrics: any;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.progress)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Vocabulary, (vocabulary) => vocabulary.userProgress)
  @JoinColumn({ name: 'vocabulary_id' })
  vocabulary: Vocabulary;

  @ManyToOne(() => Sentence, (sentence) => sentence.userProgress)
  @JoinColumn({ name: 'sentence_id' })
  sentence: Sentence;
}