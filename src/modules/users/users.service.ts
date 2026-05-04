import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get a user's public profile
   */
  async getPublicProfile(userId: string, currentUserId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        name: true,
        avatarUrl: true,
        bio: true,
        role: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            penName: true,
            biography: true,
            avatarUrl: true,
            isVerified: true,
            socialLinks: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            annotations: true,
            bookmarks: true,
            followers: true,
            following: true,
            readingProgress: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Check if current user follows this user
    let isFollowing = false;
    if (currentUserId && currentUserId !== userId) {
      const follow = await this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: userId,
          },
        },
      });
      isFollowing = !!follow;
    }

    return {
      ...user,
      isFollowing,
      stats: {
        reviews: user._count.reviews,
        annotations: user._count.annotations,
        followers: user._count.followers,
        following: user._count.following,
        booksRead: user._count.readingProgress,
      },
      _count: undefined,
    };
  }

  /**
   * Get a user's public reviews
   */
  async getUserReviews(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    const [reviews, total] = await Promise.all([
      this.prisma.userReview.findMany({
        where: { userId, isPublic: true },
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
      this.prisma.userReview.count({
        where: { userId, isPublic: true },
      }),
    ]);

    return {
      data: reviews,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get a user's public annotations
   */
  async getUserAnnotations(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    const [annotations, total] = await Promise.all([
      this.prisma.annotation.findMany({
        where: { userId, isPublic: true },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverImageUrl: true,
              coverColor: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.annotation.count({
        where: { userId, isPublic: true },
      }),
    ]);

    return {
      data: annotations,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get a user's reading shelf (finished books)
   */
  async getUserShelf(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    const [progress, total] = await Promise.all([
      this.prisma.readingProgress.findMany({
        where: { userId, finishedAt: { not: null } },
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
        orderBy: { finishedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.readingProgress.count({
        where: { userId, finishedAt: { not: null } },
      }),
    ]);

    return {
      data: progress.map((p) => ({
        book: p.book,
        finishedAt: p.finishedAt,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
