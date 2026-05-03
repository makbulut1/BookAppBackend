import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAuthorDto, UpdateAuthorDto } from './dto';

@Injectable()
export class AuthorsService {
  private readonly logger = new Logger(AuthorsService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [authors, total] = await Promise.all([
      this.prisma.author.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: { books: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.author.count(),
    ]);

    return {
      data: authors,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const author = await this.prisma.author.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
          },
        },
        books: {
          where: { status: 'PUBLISHED' },
          include: {
            _count: {
              select: { reviews: true },
            },
          },
          orderBy: { publishedAt: 'desc' },
        },
      },
    });

    if (!author) {
      throw new NotFoundException(`Author with ID ${id} not found`);
    }

    return author;
  }

  async findByUserId(userId: string) {
    const author = await this.prisma.author.findUnique({
      where: { userId },
      include: {
        books: {
          include: {
            _count: {
              select: { reviews: true, readingProgress: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!author) {
      throw new NotFoundException('Author profile not found for this user');
    }

    return author;
  }

  async update(id: string, userId: string, dto: UpdateAuthorDto) {
    // Verify ownership
    const author = await this.prisma.author.findUnique({
      where: { id },
    });

    if (!author || author.userId !== userId) {
      throw new NotFoundException(
        'Author not found or you are not the owner',
      );
    }

    return this.prisma.author.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Author dashboard — aggregated stats
   */
  async getDashboard(userId: string) {
    const author = await this.prisma.author.findUnique({
      where: { userId },
      include: {
        books: {
          include: {
            _count: {
              select: {
                reviews: true,
                readingProgress: true,
                annotations: true,
                readingSessions: true,
              },
            },
            reviews: {
              select: { rating: true },
            },
          },
        },
      },
    });

    if (!author) {
      throw new NotFoundException('Author profile not found');
    }

    // Calculate aggregated statistics
    const totalBooks = author.books.length;
    const publishedBooks = author.books.filter(
      (b) => b.status === 'PUBLISHED',
    ).length;
    const totalReaders = author.books.reduce(
      (sum, b) => sum + b._count.readingProgress,
      0,
    );
    const totalReviews = author.books.reduce(
      (sum, b) => sum + b._count.reviews,
      0,
    );
    const totalAnnotations = author.books.reduce(
      (sum, b) => sum + b._count.annotations,
      0,
    );

    // Calculate average rating
    const allRatings = author.books.flatMap((b) =>
      b.reviews.map((r) => r.rating),
    );
    const averageRating =
      allRatings.length > 0
        ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
        : 0;

    return {
      author: {
        id: author.id,
        penName: author.penName,
        isVerified: author.isVerified,
      },
      stats: {
        totalBooks,
        publishedBooks,
        draftBooks: totalBooks - publishedBooks,
        totalReaders,
        totalReviews,
        totalAnnotations,
        averageRating: Math.round(averageRating * 10) / 10,
      },
      recentBooks: author.books.slice(0, 5).map((book) => ({
        id: book.id,
        title: book.title,
        status: book.status,
        coverImageUrl: book.coverImageUrl,
        readers: book._count.readingProgress,
        reviews: book._count.reviews,
        createdAt: book.createdAt,
      })),
    };
  }
}
