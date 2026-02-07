import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async generateTutorResponse(
    userId: string,
    sessionId: string,
    conversationId: string,
    userMessage: string,
    context: any = {},
  ): Promise<string> {
    try {
      const prompt = this.buildTutorPrompt(userMessage, context);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(context.userLevel || 'A1'),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      const aiResponse = response.choices[0]?.message?.content || '';
      
      // Log interaction for analytics
      this.logger.log(`AI response generated for user ${userId}, session ${sessionId}`);

      return aiResponse;
    } catch (error) {
      this.logger.error(`OpenAI API error: ${error.message}`);
      throw new Error('Failed to generate AI response');
    }
  }

  async generateVocabularyExample(
    word: string,
    level: string,
    context: string = '',
  ): Promise<string> {
    try {
      const prompt = `
Generate a contextual example sentence for the word "${word}" at ${level} level.
The sentence should be:
- Natural and contextually appropriate
- At the appropriate difficulty level
- Include the word in its most common usage
- Be suitable for Arabic speakers learning English

Context: ${context}

Provide the response in the following format:
{
  "sentence": "The example sentence here",
  "arabicTranslation": "الترجمة العربية هنا",
  "explanation": "Explanation of the word usage in Arabic"
}
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert English language teacher for Arabic speakers.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      this.logger.error(`OpenAI vocabulary generation error: ${error.message}`);
      throw new Error('Failed to generate vocabulary example');
    }
  }

  async generateGrammarExplanation(
    grammarRule: string,
    level: string,
    context: string = '',
  ): Promise<string> {
    try {
      const prompt = `
Provide a comprehensive grammar explanation for: ${grammarRule}
Level: ${level}
Context: ${context}

The explanation should include:
1. Clear rule explanation in Arabic
2. English examples with Arabic translations
3. Common mistakes and how to avoid them
4. Practice exercises

Format the response as JSON with the following structure:
{
  "ruleExplanation": "شرح القاعدة بالعربية",
  "examples": [
    {
      "english": "English example",
      "arabic": "الترجمة العربية"
    }
  ],
  "commonMistakes": ["mistake 1", "mistake 2"],
  "exercises": ["exercise 1", "exercise 2"]
}
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert grammar teacher for Arabic speakers.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      this.logger.error(`OpenAI grammar explanation error: ${error.message}`);
      throw new Error('Failed to generate grammar explanation');
    }
  }

  async analyzeWriting(
    userText: string,
    level: string,
    taskType: string = 'general',
  ): Promise<any> {
    try {
      const prompt = `
Analyze the following English text written by an Arabic speaker:

"${userText}"

Level: ${level}
Task Type: ${taskType}

Please provide:
1. Grammar error analysis
2. Vocabulary usage assessment
3. Sentence structure evaluation
4. Overall coherence and cohesion
5. Specific improvement suggestions

Format as JSON:
{
  "grammarErrors": [
    {
      "error": "incorrect usage",
      "correction": "correct usage",
      "explanation": "explanation in Arabic"
    }
  ],
  "vocabularyScore": 0-10,
  "structureScore": 0-10,
  "coherenceScore": 0-10,
  "overallScore": 0-10,
  "improvementSuggestions": ["suggestion 1", "suggestion 2"]
}
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert writing evaluator for Arabic speakers learning English.',
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
      this.logger.error(`OpenAI writing analysis error: ${error.message}`);
      throw new Error('Failed to analyze writing');
    }
  }

  private buildTutorPrompt(userMessage: string, context: any): string {
    return `
User Message: "${userMessage}"

Context:
- User Level: ${context.userLevel || 'A1'}
- Learning Goals: ${context.learningGoals || 'General English'}
- Previous Topics: ${context.previousTopics || 'N/A'}
- Current Focus: ${context.currentFocus || 'N/A'}

Please provide a helpful, encouraging response that:
1. Answers the user's question clearly
2. Uses appropriate language for their level
3. Provides examples when helpful
4. Encourages continued learning
5. Suggests related practice activities when appropriate

Respond in a friendly, supportive tone suitable for language learning.
    `;
  }

  private getSystemPrompt(level: string): string {
    const levelPrompts = {
      'A1': 'You are teaching beginner English to Arabic speakers. Use simple language, provide Arabic explanations when needed, and be very encouraging.',
      'A2': 'You are teaching elementary English to Arabic speakers. Use clear explanations with some Arabic support, and provide practical examples.',
      'B1': 'You are teaching intermediate English to Arabic speakers. Use mostly English with some Arabic explanations for complex concepts.',
      'B2': 'You are teaching upper-intermediate English to Arabic speakers. Use English primarily with minimal Arabic support.',
      'C1': 'You are teaching advanced English to Arabic speakers. Use sophisticated English with minimal Arabic support.',
      'C2': 'You are teaching proficient English to Arabic speakers. Use advanced English with no Arabic support needed.',
    };

    return levelPrompts[level] || levelPrompts['A1'];
  }
}