import { Controller, Get, Put, Delete, UseGuards, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User } from '../auth/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('User Management')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile')
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

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const updatedUser = await this.userService.updateUserProfile(user.id, updateUserDto);
    
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

  @Get('progress')
  @ApiOperation({ summary: 'Get user progress' })
  @ApiResponse({ status: 200, description: 'Progress retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserProgress(@CurrentUser() user: User) {
    const progress = await this.userService.getUserProgress(user.id);
    
    return {
      success: true,
      progress,
      message: 'Progress retrieved successfully',
    };
  }

  @Get('achievements')
  @ApiOperation({ summary: 'Get user achievements' })
  @ApiResponse({ status: 200, description: 'Achievements retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserAchievements(@CurrentUser() user: User) {
    const achievements = await this.userService.getUserAchievements(user.id);
    
    return {
      success: true,
      achievements,
      message: 'Achievements retrieved successfully',
    };
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get user leaderboard position' })
  @ApiResponse({ status: 200, description: 'Leaderboard position retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserLeaderboardPosition(@CurrentUser() user: User) {
    const position = await this.userService.getUserLeaderboardPosition(user.id);
    
    return {
      success: true,
      position,
      message: 'Leaderboard position retrieved successfully',
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserStats(@CurrentUser() user: User) {
    const stats = await this.userService.getUserStats(user.id);
    
    return {
      success: true,
      stats,
      message: 'Statistics retrieved successfully',
    };
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get personalized recommendations' })
  @ApiResponse({ status: 200, description: 'Recommendations retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRecommendations(@CurrentUser() user: User) {
    const recommendations = await this.userService.getPersonalizedRecommendations(user.id);
    
    return {
      success: true,
      recommendations,
      message: 'Recommendations retrieved successfully',
    };
  }

  @Get('daily-goal')
  @ApiOperation({ summary: 'Get daily learning goal' })
  @ApiResponse({ status: 200, description: 'Daily goal retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDailyGoal(@CurrentUser() user: User) {
    const dailyGoal = await this.userService.getDailyLearningGoal(user.id);
    
    return {
      success: true,
      dailyGoal,
      message: 'Daily goal retrieved successfully',
    };
  }

  @Put('daily-goal')
  @ApiOperation({ summary: 'Update daily learning goal' })
  @ApiResponse({ status: 200, description: 'Daily goal updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateDailyGoal(
    @CurrentUser() user: User,
    @Body() body: {
      targetXp: number;
      targetTime: number;
      targetLessons: number;
    },
  ) {
    const updatedGoal = await this.userService.updateDailyLearningGoal(user.id, body);
    
    return {
      success: true,
      dailyGoal: updatedGoal,
      message: 'Daily goal updated successfully',
    };
  }

  @Get('streak')
  @ApiOperation({ summary: 'Get learning streak' })
  @ApiResponse({ status: 200, description: 'Streak retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLearningStreak(@CurrentUser() user: User) {
    const streak = await this.userService.getLearningStreak(user.id);
    
    return {
      success: true,
      streak,
      message: 'Learning streak retrieved successfully',
    };
  }

  @Get('badges')
  @ApiOperation({ summary: 'Get user badges' })
  @ApiResponse({ status: 200, description: 'Badges retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserBadges(@CurrentUser() user: User) {
    const badges = await this.userService.getUserBadges(user.id);
    
    return {
      success: true,
      badges,
      message: 'Badges retrieved successfully',
    };
  }

  @Get('friends')
  @ApiOperation({ summary: 'Get user friends' })
  @ApiResponse({ status: 200, description: 'Friends retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserFriends(@CurrentUser() user: User) {
    const friends = await this.userService.getUserFriends(user.id);
    
    return {
      success: true,
      friends,
      message: 'Friends retrieved successfully',
    };
  }

  @Post('friends/add')
  @ApiOperation({ summary: 'Add friend' })
  @ApiResponse({ status: 200, description: 'Friend request sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addFriend(
    @CurrentUser() user: User,
    @Body() body: {
      friendEmail: string;
    },
  ) {
    await this.userService.addFriend(user.id, body.friendEmail);
    
    return {
      success: true,
      message: 'Friend request sent successfully',
    };
  }

  @Post('friends/accept')
  @ApiOperation({ summary: 'Accept friend request' })
  @ApiResponse({ status: 200, description: 'Friend request accepted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async acceptFriendRequest(
    @CurrentUser() user: User,
    @Body() body: {
      requestId: string;
    },
  ) {
    await this.userService.acceptFriendRequest(user.id, body.requestId);
    
    return {
      success: true,
      message: 'Friend request accepted successfully',
    };
  }

  @Delete('friends/:friendId')
  @ApiOperation({ summary: 'Remove friend' })
  @ApiResponse({ status: 200, description: 'Friend removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeFriend(
    @CurrentUser() user: User,
    @Param('friendId') friendId: string,
  ) {
    await this.userService.removeFriend(user.id, friendId);
    
    return {
      success: true,
      message: 'Friend removed successfully',
    };
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getNotifications(
    @CurrentUser() user: User,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ) {
    const notifications = await this.userService.getUserNotifications(user.id, limit, offset);
    
    return {
      success: true,
      notifications,
      limit,
      offset,
      message: 'Notifications retrieved successfully',
    };
  }

  @Put('notifications/read/:notificationId')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markNotificationAsRead(
    @CurrentUser() user: User,
    @Param('notificationId') notificationId: string,
  ) {
    await this.userService.markNotificationAsRead(user.id, notificationId);
    
    return {
      success: true,
      message: 'Notification marked as read successfully',
    };
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get user settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserSettings(@CurrentUser() user: User) {
    const settings = await this.userService.getUserSettings(user.id);
    
    return {
      success: true,
      settings,
      message: 'Settings retrieved successfully',
    };
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update user settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateUserSettings(
    @CurrentUser() user: User,
    @Body() settings: any,
  ) {
    const updatedSettings = await this.userService.updateUserSettings(user.id, settings);
    
    return {
      success: true,
      settings: updatedSettings,
      message: 'Settings updated successfully',
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get learning history' })
  @ApiResponse({ status: 200, description: 'Learning history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getLearningHistory(
    @CurrentUser() user: User,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    const history = await this.userService.getLearningHistory(user.id, limit, offset);
    
    return {
      success: true,
      history,
      limit,
      offset,
      message: 'Learning history retrieved successfully',
    };
  }

  @Get('export')
  @ApiOperation({ summary: 'Export user data' })
  @ApiResponse({ status: 200, description: 'Data exported successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async exportUserData(@CurrentUser() user: User) {
    const exportData = await this.userService.exportUserData(user.id);
    
    return {
      success: true,
      exportData,
      message: 'Data exported successfully',
    };
  }

  @Delete('account')
  @ApiOperation({ summary: 'Delete user account' })
  @ApiResponse({ status: 200, description: 'Account deletion initiated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteAccount(
    @CurrentUser() user: User,
    @Body() body: {
      password: string;
      reason?: string;
    },
  ) {
    await this.userService.deleteAccount(user.id, body.password, body.reason);
    
    return {
      success: true,
      message: 'Account deletion initiated successfully',
    };
  }

  @Get('check-username')
  @Roles('admin')
  @ApiOperation({ summary: 'Check if username is available' })
  @ApiResponse({ status: 200, description: 'Username check completed' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async checkUsername(@Query('username') username: string) {
    const available = await this.userService.checkUsernameAvailable(username);
    
    return {
      success: true,
      available,
      message: 'Username check completed',
    };
  }

  @Get('check-email')
  @Roles('admin')
  @ApiOperation({ summary: 'Check if email is available' })
  @ApiResponse({ status: 200, description: 'Email check completed' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async checkEmail(@Query('email') email: string) {
    const available = await this.userService.checkEmailAvailable(email);
    
    return {
      success: true,
      available,
      message: 'Email check completed',
    };
  }

  @Get('search')
  @Roles('admin')
  @ApiOperation({ summary: 'Search users' })
  @ApiResponse({ status: 200, description: 'Users found successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiQuery({ name: 'query', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async searchUsers(
    @Query('query') query: string,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ) {
    const users = await this.userService.searchUsers(query, limit, offset);
    
    return {
      success: true,
      users,
      query,
      limit,
      offset,
      message: 'Users found successfully',
    };
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getUserById(@Param('id') userId: string) {
    const user = await this.userService.getUserById(userId);
    
    return {
      success: true,
      user,
      message: 'User retrieved successfully',
    };
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateUserById(
    @Param('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const updatedUser = await this.userService.updateUserById(userId, updateUserDto);
    
    return {
      success: true,
      user: updatedUser,
      message: 'User updated successfully',
    };
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteUserById(@Param('id') userId: string) {
    await this.userService.deleteUserById(userId);
    
    return {
      success: true,
      message: 'User deleted successfully',
    };
  }

  @Post(':id/activate')
  @Roles('admin')
  @ApiOperation({ summary: 'Activate user account' })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async activateUser(@Param('id') userId: string) {
    await this.userService.activateUser(userId);
    
    return {
      success: true,
      message: 'User activated successfully',
    };
  }

  @Post(':id/deactivate')
  @Roles('admin')
  @ApiOperation({ summary: 'Deactivate user account' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deactivateUser(
    @Param('id') userId: string,
    @Body() body: {
      reason?: string;
    },
  ) {
    await this.userService.deactivateUser(userId, body.reason);
    
    return {
      success: true,
      message: 'User deactivated successfully',
    };
  }

  @Get(':id/analytics')
  @Roles('admin')
  @ApiOperation({ summary: 'Get user analytics' })
  @ApiResponse({ status: 200, description: 'User analytics retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getUserAnalytics(@Param('id') userId: string) {
    const analytics = await this.userService.getUserAnalytics(userId);
    
    return {
      success: true,
      analytics,
      message: 'User analytics retrieved successfully',
    };
  }
}