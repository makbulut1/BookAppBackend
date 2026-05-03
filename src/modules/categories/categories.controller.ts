import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../../auth/guards';
import { Public, Roles } from '../../auth/decorators';
import { UserRole } from '@prisma/client';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all categories (tree structure)' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Public()
  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get category by ID or slug with books' })
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.categoriesService.findOne(idOrSlug);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new category (Admin only)' })
  create(
    @Body()
    body: {
      name: string;
      description?: string;
      parentId?: string;
      iconUrl?: string;
    },
  ) {
    return this.categoriesService.create(body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a category (Admin only)' })
  delete(@Param('id') id: string) {
    return this.categoriesService.delete(id);
  }
}
