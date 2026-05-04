import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WishlistService {
  private readonly logger = new Logger(WishlistService.name);

  constructor(private prisma: PrismaService) {}

  async add(userId: string, bookId: string) {
    // Verify book exists
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      throw new NotFoundException('Kitap bulunamadı');
    }

    // Check if already in wishlist
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wishlist: { where: { id: bookId } } },
    });

    if (user?.wishlist.length) {
      throw new ConflictException('Bu kitap zaten istek listenizde');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        wishlist: { connect: { id: bookId } },
      },
    });

    this.logger.log(`Book ${bookId} added to wishlist for user ${userId}`);
    return { message: 'Kitap istek listesine eklendi' };
  }

  async remove(userId: string, bookId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        wishlist: { disconnect: { id: bookId } },
      },
    });

    return { message: 'Kitap istek listesinden çıkarıldı' };
  }

  async getWishlist(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        wishlist: {
          include: {
            author: { select: { id: true, penName: true, avatarUrl: true } },
            categories: { include: { category: true } },
            _count: { select: { reviews: true } },
          },
          skip,
          take: limit,
        },
        _count: { select: { wishlist: true } },
      },
    });

    const total = user?._count?.wishlist || 0;

    return {
      data: user?.wishlist || [],
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async isInWishlist(userId: string, bookId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wishlist: { where: { id: bookId } } },
    });

    return { isInWishlist: (user?.wishlist?.length || 0) > 0 };
  }
}
