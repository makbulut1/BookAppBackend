import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { BooksService } from './books.service';
import { CreateBookDto, UpdateBookDto, CreateChapterDto } from './dto';
import { JwtAuthGuard } from '../../auth/guards';
import { CurrentUser, Public, Roles } from '../../auth/decorators';
import { BookStatus, UserRole } from '@prisma/client';

@ApiTags('books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new book (Author/Admin only)' })
  @ApiResponse({ status: 201, description: 'Book created successfully' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBookDto,
  ) {
    return this.booksService.create(userId, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all published books with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'authorId', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['title', 'createdAt', 'publishedAt'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('authorId') authorId?: string,
    @Query('sortBy') sortBy?: 'title' | 'createdAt' | 'publishedAt',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.booksService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      category,
      authorId,
      sortBy,
      sortOrder,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-books')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get books authored by current user' })
  getMyBooks(@CurrentUser('id') userId: string) {
    return this.booksService.findByAuthorUserId(userId);
  }

  @Public()
  @Get(':identifier')
  @ApiOperation({ summary: 'Get a book by ID or slug' })
  findOne(@Param('identifier') identifier: string) {
    return this.booksService.findOne(identifier);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a book (Owner/Admin only)' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @Body() dto: UpdateBookDto,
  ) {
    return this.booksService.update(id, userId, role, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a book (Owner/Admin only)' })
  delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.booksService.delete(id, userId, role);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/upload')
  @ApiBearerAuth()
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Upload book file (PDF/EPUB) and trigger processing' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.booksService.uploadBookFile(id, userId, file);
  }

  // ─── Chapter Endpoints ──────────────────────

  @UseGuards(JwtAuthGuard)
  @Post(':bookId/chapters')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a chapter to a book' })
  addChapter(
    @Param('bookId') bookId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateChapterDto,
  ) {
    return this.booksService.addChapter(bookId, userId, dto);
  }

  @Public()
  @Get(':bookId/chapters')
  @ApiOperation({ summary: 'Get all chapters of a book (table of contents)' })
  getChapters(@Param('bookId') bookId: string) {
    return this.booksService.getChapters(bookId);
  }

  @Public()
  @Get(':bookId/chapters/:chapterId')
  @ApiOperation({ summary: 'Get a specific chapter with full content' })
  getChapter(
    @Param('bookId') bookId: string,
    @Param('chapterId') chapterId: string,
  ) {
    return this.booksService.getChapter(bookId, chapterId);
  }
}
