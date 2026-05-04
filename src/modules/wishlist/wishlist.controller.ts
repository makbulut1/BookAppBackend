import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../../auth/guards';
import { CurrentUser } from '../../auth/decorators';

@ApiTags('wishlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post(':bookId')
  @ApiOperation({ summary: 'Add a book to wishlist' })
  add(
    @CurrentUser('id') userId: string,
    @Param('bookId') bookId: string,
  ) {
    return this.wishlistService.add(userId, bookId);
  }

  @Delete(':bookId')
  @ApiOperation({ summary: 'Remove a book from wishlist' })
  remove(
    @CurrentUser('id') userId: string,
    @Param('bookId') bookId: string,
  ) {
    return this.wishlistService.remove(userId, bookId);
  }

  @Get()
  @ApiOperation({ summary: 'Get my wishlist' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getWishlist(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.wishlistService.getWishlist(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get(':bookId/check')
  @ApiOperation({ summary: 'Check if a book is in my wishlist' })
  check(
    @CurrentUser('id') userId: string,
    @Param('bookId') bookId: string,
  ) {
    return this.wishlistService.isInWishlist(userId, bookId);
  }
}
