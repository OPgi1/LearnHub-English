import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OpenAIService } from './openai.service';
import { Vocabulary } from '../../vocabulary/entities/vocabulary.entity';
import { Sentence } from '../../vocabulary/entities/sentence.entity';
import { GrammarRule } from '../../grammar/entities/grammar-rule.entity';

@Injectable()
export class ContentGenerationService {
  private readonly logger = new Logger(ContentGenerationService.name);

  constructor(
    private openaiService: OpenAIService,
    @InjectRepository(Vocabulary)
    private vocabularyRepository: Repository<Vocabulary>,
    @InjectRepository(Sentence)
    private sentenceRepository: Repository<Sentence>,
    @InjectRepository(GrammarRule)
    private grammarRuleRepository: Repository<GrammarRule>,
  ) {}

  async generateVocabularyContent(
    word: string,
    level: string,
    context: string = '',
  ): Promise<any> {
    try {
      const examples = await this.openaiService.generateVocabularyExample(word, level, context);
      
      // Parse the JSON response
      const parsedExamples = JSON.parse(examples);
      
      // Save to database
      const vocabulary = this.vocabularyRepository.create({
        word: word.toLowerCase(),
        partOfSpeech: this.detectPartOfSpeech(word),
        arabicMeaning: parsedExamples.arabicTranslation || '',
        definitionArabic: parsedExamples.explanation || '',
        difficultyLevel: this.getDifficultyLevel(level),
        cefrLevel: level,
        isActive: true,
      });

      await this.vocabularyRepository.save(vocabulary);

      // Save example sentences
      if (parsedExamples.sentences) {
        for (const sentenceData of parsedExamples.sentences) {
          const sentence = this.sentenceRepository.create({
            englishText: sentenceData.sentence,
            arabicTranslation: sentenceData.arabicTranslation,
            vocabulary: vocabulary,
            difficultyLevel: this.getDifficultyLevel(level),
            cefrLevel: level,
            isActive: true,
          });
          await this.sentenceRepository.save(sentence);
        }
      }

      return {
        vocabulary,
        examples: parsedExamples,
      };
    } catch (error) {
      this.logger.error(`Content generation error: ${error.message}`);
      throw new Error('Failed to generate vocabulary content');
    }
  }

  async generateGrammarContent(
    rule: string,
    level: string,
    context: string = '',
  ): Promise<any> {
    try {
      const explanation = await this.openaiService.generateGrammarExplanation(rule, level, context);
      
      // Parse the JSON response
      const parsedExplanation = JSON.parse(explanation);
      
      // Save to database
      const grammarRule = this.grammarRuleRepository.create({
        slug: this.generateSlug(rule),
        title: rule,
        description: parsedExplanation.ruleExplanation || '',
        category: this.detectGrammarCategory(rule),
        level: level,
        rule: rule,
        examples: parsedExplanation.examples || [],
        exceptions: parsedExplanation.exceptions || [],
        difficulty: this.getDifficultyLevel(level),
        isActive: true,
      });

      await this.grammarRuleRepository.save(grammarRule);

      return {
        grammarRule,
        explanation: parsedExplanation,
      };
    } catch (error) {
      this.logger.error(`Grammar content generation error: ${error.message}`);
      throw new Error('Failed to generate grammar content');
    }
  }

  async generatePracticeExercise(
    type: string,
    level: string,
    topic: string,
    count: number = 5,
  ): Promise<any[]> {
    try {
      const prompt = `
Generate ${count} practice exercises for ${type} at ${level} level.
Topic: ${topic}

Requirements:
- Each exercise should be appropriate for Arabic speakers learning English
- Include clear instructions in Arabic
- Provide answer key
- Format as JSON array with the following structure:

[
  {
    "question": "The question text",
    "options": ["option 1", "option 2", "option 3", "option 4"],
    "correctAnswer": "correct option",
    "explanation": "Explanation in Arabic"
  }
]

Return only the JSON array, no additional text.
      `;

      const response = await this.openaiService['openai'].chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert English language teacher creating practice exercises for Arabic speakers.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      return JSON.parse(response.choices[0]?.message?.content || '[]');
    } catch (error) {
      this.logger.error(`Exercise generation error: ${error.message}`);
      throw new Error('Failed to generate practice exercises');
    }
  }

  async generateReadingComprehension(
    level: string,
    topic: string,
    wordCount: number = 200,
  ): Promise<any> {
    try {
      const prompt = `
Generate a reading comprehension passage for ${level} level English learners.

Requirements:
- Topic: ${topic}
- Word count: approximately ${wordCount} words
- Suitable for Arabic speakers
- Include 3-5 comprehension questions
- Provide answer key with explanations in Arabic

Format as JSON:
{
  "passage": "The reading passage text",
  "questions": [
    {
      "question": "Question text",
      "options": ["option 1", "option 2", "option 3", "option 4"],
      "correctAnswer": "correct option",
      "explanation": "Explanation in Arabic"
    }
  ]
}
      `;

      const response = await this.openaiService['openai'].chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert English teacher creating reading comprehension materials.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      return JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch (error) {
      this.logger.error(`Reading comprehension generation error: ${error.message}`);
      throw new Error('Failed to generate reading comprehension');
    }
  }

  async generateWritingPrompt(
    level: string,
    topic: string,
    wordLimit: number = 150,
  ): Promise<any> {
    try {
      const prompt = `
Generate a writing prompt for ${level} level English learners.

Requirements:
- Topic: ${topic}
- Word limit: ${wordLimit} words
- Suitable for Arabic speakers
- Include clear instructions in Arabic
- Provide assessment criteria

Format as JSON:
{
  "prompt": "The writing prompt text",
  "instructions": "Instructions in Arabic",
  "wordLimit": ${wordLimit},
  "assessmentCriteria": [
    "Criterion 1",
    "Criterion 2",
    "Criterion 3"
  ]
}
      `;

      const response = await this.openaiService['openai'].chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert English teacher creating writing prompts.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      return JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch (error) {
      this.logger.error(`Writing prompt generation error: ${error.message}`);
      throw new Error('Failed to generate writing prompt');
    }
  }

  private detectPartOfSpeech(word: string): string {
    // Simple heuristic for part of speech detection
    const nouns = ['book', 'table', 'computer', 'school', 'teacher'];
    const verbs = ['run', 'eat', 'study', 'learn', 'speak'];
    const adjectives = ['good', 'bad', 'big', 'small', 'beautiful'];

    if (nouns.includes(word.toLowerCase())) return 'noun';
    if (verbs.includes(word.toLowerCase())) return 'verb';
    if (adjectives.includes(word.toLowerCase())) return 'adjective';
    
    return 'unknown';
  }

  private detectGrammarCategory(rule: string): string {
    const categories = {
      'tenses': ['present', 'past', 'future', 'perfect', 'continuous'],
      'articles': ['a', 'an', 'the'],
      'prepositions': ['in', 'on', 'at', 'with', 'by'],
      'conjunctions': ['and', 'but', 'or', 'because', 'although'],
      'pronouns': ['he', 'she', 'it', 'they', 'we'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => rule.toLowerCase().includes(keyword))) {
        return category;
      }
    }

    return 'general';
  }

  private getDifficultyLevel(level: string): number {
    const levelMap = {
      'A1': 1,
      'A2': 2,
      'B1': 3,
      'B2': 4,
      'C1': 5,
      'C2': 6,
    };

    return levelMap[level] || 1;
  }

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}