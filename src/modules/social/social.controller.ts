import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SocialService } from './social.service';
import { JwtAuthGuard } from '../../auth/guards';
import { CurrentUser } from '../../auth/decorators';

@ApiTags('social')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Post('follow/:userId')
  @ApiOperation({ summary: 'Follow a user' })
  follow(
    @CurrentUser('id') followerId: string,
    @Param('userId') followingId: string,
  ) {
    return this.socialService.follow(followerId, followingId);
  }

  @Delete('follow/:userId')
  @ApiOperation({ summary: 'Unfollow a user' })
  unfollow(
    @CurrentUser('id') followerId: string,
    @Param('userId') followingId: string,
  ) {
    return this.socialService.unfollow(followerId, followingId);
  }

  @Get('followers')
  @ApiOperation({ summary: 'Get my followers' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMyFollowers(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.socialService.getFollowers(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('following')
  @ApiOperation({ summary: 'Get users I follow' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMyFollowing(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.socialService.getFollowing(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('followers/:userId')
  @ApiOperation({ summary: "Get a user's followers" })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getUserFollowers(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.socialService.getFollowers(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('following/:userId')
  @ApiOperation({ summary: "Get users a user follows" })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getUserFollowing(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.socialService.getFollowing(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('is-following/:userId')
  @ApiOperation({ summary: 'Check if I follow a user' })
  isFollowing(
    @CurrentUser('id') followerId: string,
    @Param('userId') followingId: string,
  ) {
    return this.socialService.isFollowing(followerId, followingId);
  }
}
