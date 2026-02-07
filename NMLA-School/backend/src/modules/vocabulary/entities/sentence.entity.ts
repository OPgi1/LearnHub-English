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
import { Vocabulary } from './vocabulary.entity';
import { UserProgress } from '../../progress/entities/user-progress.entity';

@Entity('sentences')
export class Sentence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  englishText: string;

  @Column()
  arabicTranslation: string;

  @Column({ nullable: true })
  audioUrl: string;

  @Column({ nullable: true })
  pronunciationHint: string;

  @Column({ default: 1 })
  difficultyLevel: number;

  @Column({ default: 'A1' })
  cefrLevel: string;

  @Column({ type: 'text', array: true, default: [] })
  keywords: string[];

  @Column({ type: 'text', array: true, default: [] })
  grammarPoints: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  usageCount: number;

  @Column({ type: 'text', array: true, default: [] })
  contexts: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Vocabulary, (vocabulary) => vocabulary.sentences)
  @JoinColumn({ name: 'vocabulary_id' })
  vocabulary: Vocabulary;

  @OneToMany(() => UserProgress, (progress) => progress.sentence)
  userProgress: UserProgress[];
}