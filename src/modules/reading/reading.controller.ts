import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReadingService } from './reading.service';
import { JwtAuthGuard } from '../../auth/guards';
import { CurrentUser } from '../../auth/decorators';

@ApiTags('reading')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('reading')
export class ReadingController {
  constructor(private readonly readingService: ReadingService) {}

  @Post('progress')
  @ApiOperation({ summary: 'Update reading progress for a book' })
  upsertProgress(
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      bookId: string;
      currentPage?: number;
      currentChapterId?: string;
      progressPercent?: number;
    },
  ) {
    return this.readingService.upsertProgress(userId, body.bookId, body);
  }

  @Get('progress/:bookId')
  @ApiOperation({ summary: 'Get reading progress for a specific book' })
  getProgress(
    @CurrentUser('id') userId: string,
    @Param('bookId') bookId: string,
  ) {
    return this.readingService.getProgress(userId, bookId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get reading history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getHistory(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.readingService.getHistory(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('currently-reading')
  @ApiOperation({ summary: 'Get currently reading books' })
  getCurrentlyReading(@CurrentUser('id') userId: string) {
    return this.readingService.getCurrentlyReading(userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get reading statistics' })
  getStats(@CurrentUser('id') userId: string) {
    return this.readingService.getStats(userId);
  }

  @Post('sessions/start')
  @ApiOperation({ summary: 'Start a reading session' })
  startSession(
    @CurrentUser('id') userId: string,
    @Body() body: { bookId: string },
  ) {
    return this.readingService.startSession(userId, body.bookId);
  }

  @Put('sessions/:sessionId/end')
  @ApiOperation({ summary: 'End a reading session' })
  endSession(
    @CurrentUser('id') userId: string,
    @Param('sessionId') sessionId: string,
    @Body() body: { pagesRead: number },
  ) {
    return this.readingService.endSession(sessionId, userId, body.pagesRead);
  }
}
