import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { User, UserSchema } from './entities/user.entity';
import { UserProfile, UserProfileSchema } from './entities/user-profile.entity';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserProfile.name, schema: UserProfileSchema },
    ]),
  ],
  providers: [
    AuthService,
    UserService,
    JwtStrategy,
    LocalStrategy,
  ],
  controllers: [AuthController],
  exports: [
    AuthService,
    UserService,
  ],
})
export class AuthModule {}