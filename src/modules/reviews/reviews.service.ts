import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto, UpdateReviewDto } from './dto';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    // Check if user already reviewed this book
    const existing = await this.prisma.userReview.findUnique({
      where: { bookId_userId: { bookId: dto.bookId, userId } },
    });

    if (existing) {
      throw new ConflictException('Bu kitaba zaten yorum yapmışsınız');
    }

    const review = await this.prisma.userReview.create({
      data: {
        userId,
        bookId: dto.bookId,
        rating: dto.rating,
        title: dto.title,
        comment: dto.comment,
        isPublic: dto.isPublic ?? true,
      },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
        book: { select: { id: true, title: true } },
      },
    });

    this.logger.log(
      `Review created: ${review.id} — ${dto.rating}★ on book ${dto.bookId}`,
    );

    return review;
  }

  async findByBook(bookId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total, aggregate] = await Promise.all([
      this.prisma.userReview.findMany({
        where: { bookId, isPublic: true },
        include: {
          user: { select: { id: true, displayName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.userReview.count({ where: { bookId, isPublic: true } }),
      this.prisma.userReview.aggregate({
        where: { bookId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    // Rating distribution (1-5)
    const distribution = await this.prisma.userReview.groupBy({
      by: ['rating'],
      where: { bookId },
      _count: { rating: true },
    });

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach((d) => {
      ratingDistribution[d.rating] = d._count.rating;
    });

    return {
      data: reviews,
      summary: {
        averageRating: aggregate._avg.rating
          ? Math.round(aggregate._avg.rating * 10) / 10
          : null,
        totalReviews: aggregate._count.rating,
        distribution: ratingDistribution,
      },
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.userReview.findMany({
        where: { userId },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverImageUrl: true,
              coverColor: true,
              author: { select: { penName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.userReview.count({ where: { userId } }),
    ]);

    return {
      data: reviews,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async update(id: string, userId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.userReview.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Yorum bulunamadı');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('Bu yorumu düzenleme yetkiniz yok');
    }

    return this.prisma.userReview.update({
      where: { id },
      data: {
        ...(dto.rating !== undefined && { rating: dto.rating }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.comment !== undefined && { comment: dto.comment }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
      },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });
  }

  async delete(id: string, userId: string) {
    const review = await this.prisma.userReview.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Yorum bulunamadı');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('Bu yorumu silme yetkiniz yok');
    }

    await this.prisma.userReview.delete({ where: { id } });
    return { message: 'Yorum silindi' };
  }

  async likeReview(id: string) {
    const review = await this.prisma.userReview.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Yorum bulunamadı');
    }

    return this.prisma.userReview.update({
      where: { id },
      data: { likes: { increment: 1 } },
    });
  }
}
