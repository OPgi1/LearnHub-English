import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Sentence } from './sentence.entity';
import { GrammarRule } from '../../grammar/entities/grammar-rule.entity';
import { UserProgress } from '../../progress/entities/user-progress.entity';

@Entity('vocabulary')
export class Vocabulary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  word: string;

  @Column()
  partOfSpeech: string;

  @Column()
  arabicMeaning: string;

  @Column({ nullable: true })
  englishMeaning: string;

  @Column({ nullable: true })
  pronunciationUs: string;

  @Column({ nullable: true })
  pronunciationUk: string;

  @Column({ nullable: true })
  audioUrlUs: string;

  @Column({ nullable: true })
  audioUrlUk: string;

  @Column({ type: 'text', nullable: true })
  definitionArabic: string;

  @Column({ type: 'text', nullable: true })
  definitionEnglish: string;

  @Column({ type: 'text', array: true, default: [] })
  synonyms: string[];

  @Column({ type: 'text', array: true, default: [] })
  antonyms: string[];

  @Column({ type: 'text', array: true, default: [] })
  relatedWords: string[];

  @Column({ default: 1 })
  difficultyLevel: number;

  @Column({ default: 'A1' })
  cefrLevel: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  usageCount: number;

  @Column({ type: 'text', array: true, default: [] })
  categories: string[];

  @Column({ type: 'text', array: true, default: [] })
  tags: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Sentence, (sentence) => sentence.vocabulary)
  sentences: Sentence[];

  @ManyToMany(() => GrammarRule, (grammar) => grammar.vocabulary)
  @JoinTable()
  grammarRules: GrammarRule[];

  @OneToMany(() => UserProgress, (progress) => progress.vocabulary)
  userProgress: UserProgress[];
}