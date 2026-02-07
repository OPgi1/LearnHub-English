import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';

@Injectable()
export class AudioProcessingService {
  private readonly logger = new Logger(AudioProcessingService.name);

  constructor(private configService: ConfigService) {}

  async processAudioFile(
    audioBuffer: Buffer,
    format: string = 'mp3',
    sampleRate: number = 16000,
    channels: number = 1,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const tempInputPath = this.getTempFilePath('input', 'wav');
      const tempOutputPath = this.getTempFilePath('output', format);

      // Write input buffer to temp file
      fs.writeFileSync(tempInputPath, audioBuffer);

      ffmpeg(tempInputPath)
        .audioCodec('libmp3lame')
        .audioBitrate('128k')
        .toFormat(format)
        .audioFrequency(sampleRate)
        .audioChannels(channels)
        .on('end', () => {
          try {
            const processedBuffer = fs.readFileSync(tempOutputPath);
            
            // Clean up temp files
            this.cleanupTempFiles([tempInputPath, tempOutputPath]);
            
            resolve(processedBuffer);
          } catch (error) {
            this.cleanupTempFiles([tempInputPath, tempOutputPath]);
            reject(error);
          }
        })
        .on('error', (error) => {
          this.cleanupTempFiles([tempInputPath, tempOutputPath]);
          reject(error);
        })
        .save(tempOutputPath);
    });
  }

  async extractAudioFeatures(audioBuffer: Buffer): Promise<any> {
    try {
      const tempFilePath = this.getTempFilePath('features', 'wav');
      fs.writeFileSync(tempFilePath, audioBuffer);

      // Use ffmpeg to extract audio features
      const features = await this.analyzeAudioFeatures(tempFilePath);
      
      // Clean up temp file
      this.cleanupTempFiles([tempFilePath]);

      return features;
    } catch (error) {
      this.logger.error(`Audio feature extraction error: ${error.message}`);
      throw new Error('Failed to extract audio features');
    }
  }

  async generateWaveformImage(audioBuffer: Buffer, width: number = 800, height: number = 200): Promise<Buffer> {
    try {
      const tempInputPath = this.getTempFilePath('waveform-input', 'wav');
      const tempOutputPath = this.getTempFilePath('waveform-output', 'png');

      fs.writeFileSync(tempInputPath, audioBuffer);

      return new Promise((resolve, reject) => {
        ffmpeg(tempInputPath)
          .complexFilter([
            {
              filter: 'aformat',
              options: 'channel_layouts=mono',
            },
            {
              filter: 'showwavespic',
              options: `w=${width}:h=${height}`,
            },
          ])
          .frames(1)
          .on('end', () => {
            try {
              const imageBuffer = fs.readFileSync(tempOutputPath);
              
              // Clean up temp files
              this.cleanupTempFiles([tempInputPath, tempOutputPath]);
              
              resolve(imageBuffer);
            } catch (error) {
              this.cleanupTempFiles([tempInputPath, tempOutputPath]);
              reject(error);
            }
          })
          .on('error', (error) => {
            this.cleanupTempFiles([tempInputPath, tempOutputPath]);
            reject(error);
          })
          .save(tempOutputPath);
      });
    } catch (error) {
      this.logger.error(`Waveform generation error: ${error.message}`);
      throw new Error('Failed to generate waveform image');
    }
  }

  async calculateAudioQuality(audioBuffer: Buffer): Promise<any> {
    try {
      const tempFilePath = this.getTempFilePath('quality', 'wav');
      fs.writeFileSync(tempFilePath, audioBuffer);

      const qualityMetrics = await this.analyzeAudioQuality(tempFilePath);
      
      // Clean up temp file
      this.cleanupTempFiles([tempFilePath]);

      return qualityMetrics;
    } catch (error) {
      this.logger.error(`Audio quality analysis error: ${error.message}`);
      throw new Error('Failed to analyze audio quality');
    }
  }

  async normalizeAudio(audioBuffer: Buffer, targetDb: number = -20): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const tempInputPath = this.getTempFilePath('normalize-input', 'wav');
      const tempOutputPath = this.getTempFilePath('normalize-output', 'wav');

      fs.writeFileSync(tempInputPath, audioBuffer);

      ffmpeg(tempInputPath)
        .audioFilters([
          `loudnorm=I=${targetDb}:TP=-1.5:LRA=11`,
        ])
        .on('end', () => {
          try {
            const normalizedBuffer = fs.readFileSync(tempOutputPath);
            
            // Clean up temp files
            this.cleanupTempFiles([tempInputPath, tempOutputPath]);
            
            resolve(normalizedBuffer);
          } catch (error) {
            this.cleanupTempFiles([tempInputPath, tempOutputPath]);
            reject(error);
          }
        })
        .on('error', (error) => {
          this.cleanupTempFiles([tempInputPath, tempOutputPath]);
          reject(error);
        })
        .save(tempOutputPath);
    });
  }

  private async analyzeAudioFeatures(filePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .ffprobe((err, metadata) => {
          if (err) {
            reject(err);
            return;
          }

          const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
          if (!audioStream) {
            reject(new Error('No audio stream found'));
            return;
          }

          resolve({
            duration: audioStream.duration,
            sampleRate: audioStream.sample_rate,
            channels: audioStream.channels,
            codec: audioStream.codec_name,
            bitrate: audioStream.bit_rate,
            size: audioStream.bit_rate ? Math.round((audioStream.bit_rate * audioStream.duration) / 8) : 0,
          });
        });
    });
  }

  private async analyzeAudioQuality(filePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .ffprobe((err, metadata) => {
          if (err) {
            reject(err);
            return;
          }

          const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
          if (!audioStream) {
            reject(new Error('No audio stream found'));
            return;
          }

          // Calculate quality metrics
          const qualityScore = this.calculateQualityScore(audioStream);
          
          resolve({
            qualityScore,
            sampleRate: audioStream.sample_rate,
            channels: audioStream.channels,
            bitrate: audioStream.bit_rate,
            isHighQuality: qualityScore >= 80,
            recommendations: this.getQualityRecommendations(qualityScore, audioStream),
          });
        });
    });
  }

  private calculateQualityScore(audioStream: any): number {
    let score = 100;

    // Sample rate scoring
    const sampleRate = parseInt(audioStream.sample_rate);
    if (sampleRate < 16000) score -= 30;
    else if (sampleRate < 22050) score -= 20;
    else if (sampleRate < 44100) score -= 10;

    // Channel scoring
    if (audioStream.channels === 1) score -= 5;
    else if (audioStream.channels > 2) score -= 10;

    // Bitrate scoring
    const bitrate = parseInt(audioStream.bit_rate);
    if (bitrate < 64000) score -= 40;
    else if (bitrate < 128000) score -= 20;
    else if (bitrate < 192000) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  private getQualityRecommendations(score: number, audioStream: any): string[] {
    const recommendations: string[] = [];

    if (score < 60) {
      recommendations.push('Low audio quality detected. Consider increasing sample rate and bitrate.');
    }

    if (parseInt(audioStream.sample_rate) < 16000) {
      recommendations.push('Increase sample rate to at least 16kHz for better quality.');
    }

    if (parseInt(audioStream.bit_rate) < 128000) {
      recommendations.push('Increase bitrate to at least 128kbps for better quality.');
    }

    if (audioStream.channels === 1) {
      recommendations.push('Consider using stereo audio for better quality (if applicable).');
    }

    return recommendations;
  }

  private getTempFilePath(prefix: string, extension: string): string {
    const tempDir = this.configService.get<string>('TEMP_DIR', './temp');
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    
    return path.join(tempDir, `${prefix}_${timestamp}_${random}.${extension}`);
  }

  private cleanupTempFiles(filePaths: string[]): void {
    filePaths.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        this.logger.warn(`Failed to cleanup temp file: ${filePath}`);
      }
    });
  }
}