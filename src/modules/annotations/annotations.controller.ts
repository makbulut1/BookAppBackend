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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnnotationsService } from './annotations.service';
import { CreateAnnotationDto, UpdateAnnotationDto } from './dto';
import { JwtAuthGuard } from '../../auth/guards';
import { CurrentUser } from '../../auth/decorators';

@ApiTags('annotations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('annotations')
export class AnnotationsController {
  constructor(private readonly annotationsService: AnnotationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new annotation/highlight' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAnnotationDto,
  ) {
    return this.annotationsService.create(userId, dto);
  }

  @Get('book/:bookId')
  @ApiOperation({ summary: 'Get annotations for a book (own + public)' })
  findByBook(
    @Param('bookId') bookId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.annotationsService.findByBook(bookId, userId);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get all my annotations' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findMine(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.annotationsService.findByUser(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an annotation' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateAnnotationDto,
  ) {
    return this.annotationsService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an annotation' })
  delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.annotationsService.delete(id, userId);
  }
}
