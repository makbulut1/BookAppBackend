import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReadingService {
  private readonly logger = new Logger(ReadingService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Update or create reading progress for a book
   */
  async upsertProgress(
    userId: string,
    bookId: string,
    data: {
      currentPage?: number;
      currentChapterId?: string;
      progressPercent?: number;
    },
  ) {
    const existing = await this.prisma.readingProgress.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });

    const progress = await this.prisma.readingProgress.upsert({
      where: { userId_bookId: { userId, bookId } },
      create: {
        userId,
        bookId,
        currentPage: data.currentPage || 0,
        currentChapterId: data.currentChapterId,
        progressPercent: data.progressPercent || 0,
      },
      update: {
        currentPage: data.currentPage,
        currentChapterId: data.currentChapterId,
        progressPercent: data.progressPercent,
        lastReadAt: new Date(),
        ...(data.progressPercent && data.progressPercent >= 100
          ? { finishedAt: new Date() }
          : {}),
      },
    });

    this.logger.log(
      `Progress updated: User ${userId}, Book ${bookId}, ${data.progressPercent}%`,
    );

    return progress;
  }

  /**
   * Get reading progress for a specific book
   */
  async getProgress(userId: string, bookId: string) {
    return this.prisma.readingProgress.findUnique({
      where: { userId_bookId: { userId, bookId } },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            coverImageUrl: true,
            pageCount: true,
            author: { select: { penName: true } },
          },
        },
      },
    });
  }

  /**
   * Get all reading progress for a user (reading history)
   */
  async getHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [progress, total] = await Promise.all([
      this.prisma.readingProgress.findMany({
        where: { userId },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverImageUrl: true,
              coverColor: true,
              pageCount: true,
              author: { select: { penName: true } },
            },
          },
        },
        orderBy: { lastReadAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.readingProgress.count({ where: { userId } }),
    ]);

    return {
      data: progress,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Currently reading books (not finished)
   */
  async getCurrentlyReading(userId: string) {
    return this.prisma.readingProgress.findMany({
      where: {
        userId,
        finishedAt: null,
        progressPercent: { gt: 0 },
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverImageUrl: true,
            coverColor: true,
            pageCount: true,
            author: { select: { penName: true } },
          },
        },
      },
      orderBy: { lastReadAt: 'desc' },
      take: 10,
    });
  }

  /**
   * Start a reading session
   */
  async startSession(userId: string, bookId: string) {
    return this.prisma.readingSession.create({
      data: { userId, bookId },
    });
  }

  /**
   * End a reading session
   */
  async endSession(
    sessionId: string,
    userId: string,
    pagesRead: number,
  ) {
    const session = await this.prisma.readingSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) return null;

    const endedAt = new Date();
    const duration = Math.floor(
      (endedAt.getTime() - session.startedAt.getTime()) / 1000,
    );

    return this.prisma.readingSession.update({
      where: { id: sessionId },
      data: { endedAt, duration, pagesRead },
    });
  }

  /**
   * Get reading stats for a user
   */
  async getStats(userId: string) {
    const [
      totalBooksStarted,
      totalBooksFinished,
      totalSessions,
      totalReadingTime,
    ] = await Promise.all([
      this.prisma.readingProgress.count({ where: { userId } }),
      this.prisma.readingProgress.count({
        where: { userId, finishedAt: { not: null } },
      }),
      this.prisma.readingSession.count({ where: { userId } }),
      this.prisma.readingSession.aggregate({
        where: { userId, duration: { not: null } },
        _sum: { duration: true },
      }),
    ]);

    const totalMinutes = Math.round(
      (totalReadingTime._sum.duration || 0) / 60,
    );

    return {
      totalBooksStarted,
      totalBooksFinished,
      totalSessions,
      totalReadingMinutes: totalMinutes,
      totalReadingHours: Math.round(totalMinutes / 60 * 10) / 10,
    };
  }
}
