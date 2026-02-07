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
import { GrammarRule } from '../../grammar/entities/grammar-rule.entity';
import { Exercise } from '../../exercises/entities/exercise.entity';
import { UserProgress } from '../../progress/entities/user-progress.entity';

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  level: string;

  @Column()
  category: string;

  @Column({ type: 'text' })
  objectives: string;

  @Column({ type: 'jsonb', nullable: true })
  content: any;

  @Column({ type: 'jsonb', nullable: true })
  media: any;

  @Column({ default: 0 })
  estimatedTime: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  order: number;

  @Column({ type: 'text', array: true, default: [] })
  prerequisites: string[];

  @Column({ type: 'text', array: true, default: [] })
  tags: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToMany(() => Vocabulary, (vocabulary) => vocabulary.lessons)
  @JoinTable()
  vocabulary: Vocabulary[];

  @ManyToMany(() => GrammarRule, (grammar) => grammar.lessons)
  @JoinTable()
  grammarRules: GrammarRule[];

  @OneToMany(() => Exercise, (exercise) => exercise.lesson)
  exercises: Exercise[];

  @OneToMany(() => UserProgress, (progress) => progress.lesson)
  userProgress: UserProgress[];
}