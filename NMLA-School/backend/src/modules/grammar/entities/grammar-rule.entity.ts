import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Vocabulary } from '../../vocabulary/entities/vocabulary.entity';
import { Lesson } from '../../lessons/entities/lesson.entity';
import { UserProgress } from '../../progress/entities/user-progress.entity';

@Entity('grammar_rules')
export class GrammarRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  category: string;

  @Column()
  level: string;

  @Column({ type: 'text' })
  rule: string;

  @Column({ type: 'text', array: true, default: [] })
  examples: string[];

  @Column({ type: 'text', array: true, default: [] })
  exceptions: string[];

  @Column({ type: 'jsonb', nullable: true })
  relatedRules: any;

  @Column({ default: 0 })
  difficulty: number;

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
  @ManyToMany(() => Vocabulary, (vocabulary) => vocabulary.grammarRules)
  @JoinTable()
  vocabulary: Vocabulary[];

  @ManyToMany(() => Lesson, (lesson) => lesson.grammarRules)
  @JoinTable()
  lessons: Lesson[];

  @OneToMany(() => UserProgress, (progress) => progress.grammarRule)
  userProgress: UserProgress[];
}