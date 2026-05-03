import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthorsService } from './authors.service';
import { UpdateAuthorDto } from './dto';
import { JwtAuthGuard } from '../../auth/guards';
import { CurrentUser, Public } from '../../auth/decorators';

@ApiTags('authors')
@Controller('authors')
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all authors' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.authorsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get author by ID' })
  @ApiResponse({ status: 200, description: 'Author details with books' })
  findOne(@Param('id') id: string) {
    return this.authorsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user author profile' })
  getMyAuthorProfile(@CurrentUser('id') userId: string) {
    return this.authorsService.findByUserId(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/dashboard')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get author dashboard with stats' })
  getDashboard(@CurrentUser('id') userId: string) {
    return this.authorsService.getDashboard(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update author profile' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateAuthorDto,
  ) {
    return this.authorsService.update(id, userId, dto);
  }
}
