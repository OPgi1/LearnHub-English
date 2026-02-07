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

@Entity('voice_samples')
export class VoiceSample {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  @Column()
  sampleType: string;

  @Column()
  audioFileUrl: string;

  @Column({ nullable: true })
  transcription: string;

  @Column({ type: 'jsonb', nullable: true })
  audioFeatures: any;

  @Column({ type: 'jsonb', nullable: true })
  qualityMetrics: any;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.voiceSamples)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Sentence, (sentence) => sentence.voiceSamples)
  @JoinColumn({ name: 'sentence_id' })
  sentence: Sentence;
}