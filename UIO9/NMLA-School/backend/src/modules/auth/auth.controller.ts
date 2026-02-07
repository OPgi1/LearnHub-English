import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        level: user.level,
        totalXp: user.totalXp,
        isActive: user.isActive,
      },
      message: 'User registered successfully',
    };
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@CurrentUser() user: User) {
    const tokens = await this.authService.login(user);
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        level: user.level,
        totalXp: user.totalXp,
        loginStreak: user.loginStreak,
      },
      tokens,
      message: 'Login successful',
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() body: { refreshToken: string }) {
    const tokens = await this.authService.refreshTokens(body.refreshToken);
    
    return {
      success: true,
      tokens,
      message: 'Token refreshed successfully',
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@CurrentUser() user: User) {
    await this.authService.logout(user.id);
    
    return {
      success: true,
      message: 'Logout successful',
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: User) {
    const profile = await this.userService.getUserProfile(user.id);
    
    return {
      success: true,
      profile,
      message: 'Profile retrieved successfully',
    };
  }

  @Post('profile/update')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() body: {
      name?: string;
      email?: string;
      preferences?: any;
    },
  ) {
    const updatedUser = await this.userService.updateUserProfile(user.id, body);
    
    return {
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        level: updatedUser.level,
        totalXp: updatedUser.totalXp,
        preferences: updatedUser.preferences,
      },
      message: 'Profile updated successfully',
    };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @CurrentUser() user: User,
    @Body() body: {
      currentPassword: string;
      newPassword: string;
    },
  ) {
    await this.authService.changePassword(user.id, body.currentPassword, body.newPassword);
    
    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async forgotPassword(@Body() body: { email: string }) {
    await this.authService.forgotPassword(body.email);
    
    return {
      success: true,
      message: 'Password reset email sent successfully',
    };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(
    @Body() body: {
      token: string;
      newPassword: string;
    },
  ) {
    await this.authService.resetPassword(body.token, body.newPassword);
    
    return {
      success: true,
      message: 'Password reset successfully',
    };
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid verification token' })
  async verifyEmail(@Body() body: { token: string }) {
    await this.authService.verifyEmail(body.token);
    
    return {
      success: true,
      message: 'Email verified successfully',
    };
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend email verification' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  @ApiResponse({ status: 400, description: 'Email already verified' })
  async resendVerification(@Body() body: { email: string }) {
    await this.authService.resendVerificationEmail(body.email);
    
    return {
      success: true,
      message: 'Verification email sent successfully',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({ status: 200, description: 'User information retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@CurrentUser() user: User) {
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        level: user.level,
        totalXp: user.totalXp,
        loginStreak: user.loginStreak,
        isActive: user.isActive,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
      message: 'User information retrieved successfully',
    };
  }

  @Post('deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate user account' })
  @ApiResponse({ status: 200, description: 'Account deactivated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deactivateAccount(
    @CurrentUser() user: User,
    @Body() body: {
      reason?: string;
      password: string;
    },
  ) {
    await this.authService.deactivateAccount(user.id, body.password, body.reason);
    
    return {
      success: true,
      message: 'Account deactivated successfully',
    };
  }

  @Post('reactivate')
  @ApiOperation({ summary: 'Reactivate user account' })
  @ApiResponse({ status: 200, description: 'Account reactivated successfully' })
  @ApiResponse({ status: 400, description: 'Account not found or already active' })
  async reactivateAccount(@Body() body: { email: string; password: string }) {
    const user = await this.authService.reactivateAccount(body.email, body.password);
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        level: user.level,
        totalXp: user.totalXp,
      },
      message: 'Account reactivated successfully',
    };
  }

  @Get('check-email')
  @ApiOperation({ summary: 'Check if email exists' })
  @ApiResponse({ status: 200, description: 'Email check completed' })
  async checkEmail(@Body() body: { email: string }) {
    const exists = await this.authService.checkEmailExists(body.email);
    
    return {
      success: true,
      exists,
      message: 'Email check completed',
    };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'User statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserStats(@CurrentUser() user: User) {
    const stats = await this.authService.getUserStats(user.id);
    
    return {
      success: true,
      stats,
      message: 'User statistics retrieved successfully',
    };
  }

  @Post('update-preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updatePreferences(
    @CurrentUser() user: User,
    @Body() preferences: any,
  ) {
    const updatedUser = await this.authService.updateUserPreferences(user.id, preferences);
    
    return {
      success: true,
      user: {
        id: updatedUser.id,
        preferences: updatedUser.preferences,
      },
      message: 'Preferences updated successfully',
    };
  }

  @Get('check-username')
  @ApiOperation({ summary: 'Check if username is available' })
  @ApiResponse({ status: 200, description: 'Username check completed' })
  async checkUsername(@Body() body: { username: string }) {
    const available = await this.authService.checkUsernameAvailable(body.username);
    
    return {
      success: true,
      available,
      message: 'Username check completed',
    };
  }
}