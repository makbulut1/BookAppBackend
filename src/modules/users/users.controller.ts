import {
  Controller,
  Get,
  Param,
  Query,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Public } from '../../auth/decorators';
import { JwtService } from '@nestjs/jwt';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Extract user ID from optional JWT token (no guard — public endpoint)
   */
  private extractUserId(authorization?: string): string | undefined {
    if (!authorization?.startsWith('Bearer ')) return undefined;
    try {
      const payload = this.jwtService.verify(authorization.slice(7));
      return payload.sub;
    } catch {
      return undefined;
    }
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: "Get a user's public profile" })
  getProfile(
    @Param('id') id: string,
    @Headers('authorization') auth?: string,
  ) {
    const currentUserId = this.extractUserId(auth);
    return this.usersService.getPublicProfile(id, currentUserId);
  }

  @Public()
  @Get(':id/reviews')
  @ApiOperation({ summary: "Get a user's public reviews" })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getReviews(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.getUserReviews(
      id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Public()
  @Get(':id/annotations')
  @ApiOperation({ summary: "Get a user's public annotations" })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getAnnotations(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.getUserAnnotations(
      id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Public()
  @Get(':id/shelf')
  @ApiOperation({ summary: "Get a user's reading shelf (finished books)" })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getShelf(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.getUserShelf(
      id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }
}
