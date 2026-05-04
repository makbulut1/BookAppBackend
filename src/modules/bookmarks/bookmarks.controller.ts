import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkDto } from './dto';
import { JwtAuthGuard } from '../../auth/guards';
import { CurrentUser } from '../../auth/decorators';

@ApiTags('bookmarks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a bookmark' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBookmarkDto,
  ) {
    return this.bookmarksService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all my bookmarks' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findMine(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bookmarksService.findByUser(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('book/:bookId')
  @ApiOperation({ summary: 'Get bookmarks for a specific book' })
  findByBook(
    @CurrentUser('id') userId: string,
    @Param('bookId') bookId: string,
  ) {
    return this.bookmarksService.findByBook(userId, bookId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bookmark' })
  delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.bookmarksService.delete(id, userId);
  }

  @Delete('book/:bookId')
  @ApiOperation({ summary: 'Delete all bookmarks for a book' })
  deleteAllForBook(
    @CurrentUser('id') userId: string,
    @Param('bookId') bookId: string,
  ) {
    return this.bookmarksService.deleteAllForBook(userId, bookId);
  }
}
