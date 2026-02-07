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
import { Sentence } from '../../vocabulary/entities/sentence.entity';

@Entity('pronunciation_attempts')
export class PronunciationAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  @Column()
  attemptNumber: number;

  @Column()
  targetText: string;

  @Column()
  userTranscript: string;

  @Column({ type: 'jsonb', nullable: true })
  analysisResults: any;

  @Column({ default: 0 })
  overallScore: number;

  @Column({ type: 'jsonb', nullable: true })
  phonemeScores: any;

  @Column({ type: 'jsonb', nullable: true })
  wordScores: any;

  @Column({ type: 'jsonb', nullable: true })
  timingAnalysis: any;

  @Column({ type: 'jsonb', nullable: true })
  errorAnalysis: any;

  @Column({ nullable: true })
  audioFileUrl: string;

  @Column({ nullable: true })
  feedbackText: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.pronunciationAttempts)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Sentence, (sentence) => sentence.pronunciationAttempts)
  @JoinColumn({ name: 'sentence_id' })
  sentence: Sentence;
}