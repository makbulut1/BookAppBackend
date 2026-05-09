import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BookStatus, UserRole } from '@prisma/client';
import { CreateBookDto, UpdateBookDto, CreateChapterDto } from './dto';
import { S3Service } from '../storage/s3.service';

@Injectable()
export class BooksService {
  private readonly logger = new Logger(BooksService.name);

  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
    @InjectQueue('pdf-processing') private pdfQueue: Queue,
  ) {}

  async uploadBookFile(bookId: string, userId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Dosya yüklenemedi');

    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: { author: true },
    });

    if (!book) throw new NotFoundException(`Kitap bulunamadı: ${bookId}`);

    if (book.author.userId !== userId) {
      throw new ForbiddenException('Bu kitabın dosyasını yükleme yetkiniz yok');
    }

    // 1. Upload to MinIO
    const key = await this.s3Service.uploadFile(file, 'book-files');
    const fileUrl = this.s3Service.getFileUrl(key);

    // 2. Update Book record
    const updatedBook = await this.prisma.book.update({
      where: { id: bookId },
      data: {
        fileUrl,
        status: BookStatus.PROCESSING,
      },
    });

    // 3. Trigger BullMQ Job
    await this.pdfQueue.add('process-pdf', {
      bookId: book.id,
      fileUrl: fileUrl,
    });

    this.logger.log(`Book ${bookId} file uploaded to MinIO and queued for processing`);

    return {
      message: 'Kitap dosyası yüklendi, işleme süreci başlatıldı',
      fileUrl,
    };
  }

  /**
   * Create a new book (Author or Admin only)
   */
  async create(authorUserId: string, dto: CreateBookDto) {
    // Find the author profile for this user
    const author = await this.prisma.author.findUnique({
      where: { userId: authorUserId },
    });

    if (!author) {
      throw new ForbiddenException(
        'Kitap oluşturmak için yazar profiliniz olmalı',
      );
    }

    // Generate slug from title
    const slug = this.generateSlug(dto.title);

    // Handle tags — create if they don't exist
    let tagConnections: { tagId: string }[] = [];
    if (dto.tags && dto.tags.length > 0) {
      const tags = await Promise.all(
        dto.tags.map(async (tagName) => {
          const tagSlug = this.generateSlug(tagName);
          return this.prisma.tag.upsert({
            where: { slug: tagSlug },
            create: { name: tagName, slug: tagSlug },
            update: {},
          });
        }),
      );
      tagConnections = tags.map((t) => ({ tagId: t.id }));
    }

    const book = await this.prisma.book.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description,
        coverImageUrl: dto.coverImageUrl,
        coverColor: dto.coverColor,
        isbn: dto.isbn,
        language: dto.language || 'tr',
        price: dto.price,
        isFree: dto.isFree ?? (dto.price ? false : true),
        format: dto.format,
        fileUrl: dto.fileUrl,
        authorId: author.id,
        status: dto.fileUrl ? BookStatus.PROCESSING : BookStatus.DRAFT,
        categories: dto.categoryIds
          ? {
              create: dto.categoryIds.map((categoryId) => ({
                categoryId,
              })),
            }
          : undefined,
        tags: tagConnections.length > 0
          ? { create: tagConnections }
          : undefined,
      },
      include: {
        author: { select: { id: true, penName: true } },
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    });

    // If a file URL is provided, queue it for processing
    if (dto.fileUrl) {
      await this.pdfQueue.add('process-pdf', {
        bookId: book.id,
        fileUrl: dto.fileUrl,
      });
      this.logger.log(`Queued book ${book.id} for processing`);
    }

    return book;
  }

  /**
   * List all published books with pagination, search, and filters
   */
  async findAll(options: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    authorId?: string;
    status?: BookStatus;
    sortBy?: 'title' | 'createdAt' | 'publishedAt';
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      authorId,
      status = BookStatus.PUBLISHED,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * limit;

    const where: any = {};

    // Status filter
    if (status) {
      where.status = status;
    }

    // Search by title or description
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { author: { penName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Category filter
    if (category) {
      where.categories = {
        some: { category: { slug: category } },
      };
    }

    // Author filter
    if (authorId) {
      where.authorId = authorId;
    }

    const [books, total] = await Promise.all([
      this.prisma.book.findMany({
        where,
        skip,
        take: limit,
        include: {
          author: { select: { id: true, penName: true, avatarUrl: true } },
          categories: { include: { category: true } },
          _count: {
            select: {
              reviews: true,
              readingProgress: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.book.count({ where }),
    ]);

    // Calculate average ratings for each book
    const booksWithRatings = await Promise.all(
      books.map(async (book) => {
        const avgRating = await this.prisma.userReview.aggregate({
          where: { bookId: book.id },
          _avg: { rating: true },
        });

        return {
          ...book,
          averageRating: avgRating._avg.rating
            ? Math.round(avgRating._avg.rating * 10) / 10
            : null,
        };
      }),
    );

    return {
      data: booksWithRatings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single book by slug or ID
   */
  async findOne(identifier: string) {
    const book = await this.prisma.book.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
      },
      include: {
        author: {
          select: {
            id: true,
            penName: true,
            avatarUrl: true,
            biography: true,
          },
        },
        publisher: true,
        chapters: {
          select: {
            id: true,
            title: true,
            orderIndex: true,
            wordCount: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
        reviews: {
          include: {
            user: {
              select: { id: true, displayName: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            reviews: true,
            annotations: true,
            readingProgress: true,
          },
        },
      },
    });

    if (!book) {
      throw new NotFoundException(`Book not found: ${identifier}`);
    }

    // Get average rating
    const avgRating = await this.prisma.userReview.aggregate({
      where: { bookId: book.id },
      _avg: { rating: true },
    });

    return {
      ...book,
      averageRating: avgRating._avg.rating
        ? Math.round(avgRating._avg.rating * 10) / 10
        : null,
    };
  }

  /**
   * Update a book (Owner author or Admin)
   */
  async update(
    id: string,
    userId: string,
    userRole: UserRole,
    dto: UpdateBookDto,
  ) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: { author: true },
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    // Check ownership
    if (book.author.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Bu kitabı düzenleme yetkiniz yok');
    }

    // Handle slug update if title changes
    const updateData: any = { ...dto };
    if (dto.title) {
      updateData.slug = this.generateSlug(dto.title);
    }

    // Remove relation fields from direct update
    delete updateData.categoryIds;
    delete updateData.tags;

    // Handle category updates
    if (dto.categoryIds) {
      await this.prisma.categoriesOnBooks.deleteMany({
        where: { bookId: id },
      });

      if (dto.categoryIds.length > 0) {
        await this.prisma.categoriesOnBooks.createMany({
          data: dto.categoryIds.map((categoryId) => ({
            bookId: id,
            categoryId,
          })),
        });
      }
    }

    // Handle tag updates
    if (dto.tags) {
      await this.prisma.tagsOnBooks.deleteMany({
        where: { bookId: id },
      });

      if (dto.tags.length > 0) {
        const tags = await Promise.all(
          dto.tags.map(async (tagName) => {
            const tagSlug = this.generateSlug(tagName);
            return this.prisma.tag.upsert({
              where: { slug: tagSlug },
              create: { name: tagName, slug: tagSlug },
              update: {},
            });
          }),
        );

        await this.prisma.tagsOnBooks.createMany({
          data: tags.map((tag) => ({ bookId: id, tagId: tag.id })),
        });
      }
    }

    // Handle publish
    if (dto.status === BookStatus.PUBLISHED && !book.publishedAt) {
      updateData.publishedAt = new Date();
    }

    return this.prisma.book.update({
      where: { id },
      data: updateData,
      include: {
        author: { select: { id: true, penName: true } },
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    });
  }

  /**
   * Delete a book (Owner author or Admin)
   */
  async delete(id: string, userId: string, userRole: UserRole) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: { author: true },
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    if (book.author.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Bu kitabı silme yetkiniz yok');
    }

    await this.prisma.book.delete({ where: { id } });
    return { message: 'Kitap başarıyla silindi' };
  }

  /**
   * Add a chapter to a book
   */
  async addChapter(bookId: string, userId: string, dto: CreateChapterDto) {
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: { author: true },
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${bookId} not found`);
    }

    if (book.author.userId !== userId) {
      throw new ForbiddenException('Bu kitaba bölüm ekleme yetkiniz yok');
    }

    const wordCount = dto.content.split(/\s+/).length;

    const chapter = await this.prisma.chapter.create({
      data: {
        bookId,
        title: dto.title,
        content: dto.content,
        orderIndex: dto.orderIndex,
        wordCount,
      },
    });

    // Update book word count
    const totalWordCount = await this.prisma.chapter.aggregate({
      where: { bookId },
      _sum: { wordCount: true },
    });

    const chapterCount = await this.prisma.chapter.count({
      where: { bookId },
    });

    await this.prisma.book.update({
      where: { id: bookId },
      data: {
        wordCount: totalWordCount._sum.wordCount || 0,
        pageCount: chapterCount,
      },
    });

    return chapter;
  }

  /**
   * Get chapters for a book
   */
  async getChapters(bookId: string) {
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${bookId} not found`);
    }

    return this.prisma.chapter.findMany({
      where: { bookId },
      orderBy: { orderIndex: 'asc' },
    });
  }

  /**
   * Get a single chapter with full content
   */
  async getChapter(bookId: string, chapterId: string) {
    const chapter = await this.prisma.chapter.findFirst({
      where: { id: chapterId, bookId },
    });

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    return chapter;
  }

  /**
   * Get books authored by a specific user (for author dashboard)
   */
  async findByAuthorUserId(userId: string) {
    const author = await this.prisma.author.findUnique({
      where: { userId },
    });

    if (!author) {
      throw new NotFoundException('Author profile not found');
    }

    return this.prisma.book.findMany({
      where: { authorId: author.id },
      include: {
        _count: {
          select: {
            reviews: true,
            readingProgress: true,
            chapters: true,
          },
        },
        categories: { include: { category: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private generateSlug(text: string): string {
    const turkishMap: Record<string, string> = {
      ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u',
      Ç: 'c', Ğ: 'g', İ: 'i', Ö: 'o', Ş: 's', Ü: 'u',
    };

    let slug = text.toLowerCase();
    for (const [from, to] of Object.entries(turkishMap)) {
      slug = slug.replace(new RegExp(from, 'g'), to);
    }

    slug = slug
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Add timestamp to ensure uniqueness
    return `${slug}-${Date.now().toString(36)}`;
  }
}
