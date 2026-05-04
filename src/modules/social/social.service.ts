import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);

  constructor(private prisma: PrismaService) {}

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new ConflictException('Kendinizi takip edemezsiniz');
    }

    // Check if target user exists
    const targetUser = await this.prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!targetUser) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Check if already following
    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    if (existing) {
      throw new ConflictException('Zaten takip ediyorsunuz');
    }

    const follow = await this.prisma.follow.create({
      data: { followerId, followingId },
      include: {
        following: {
          select: { id: true, displayName: true, name: true, avatarUrl: true },
        },
      },
    });

    // Create notification for the followed user
    await this.prisma.notification.create({
      data: {
        userId: followingId,
        type: NotificationType.NEW_FOLLOWER,
        title: 'Yeni takipçi',
        message: `${targetUser.displayName || targetUser.name || 'Biri'} sizi takip etmeye başladı`,
        data: { followerId },
      },
    });

    this.logger.log(`User ${followerId} followed ${followingId}`);
    return follow;
  }

  async unfollow(followerId: string, followingId: string) {
    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    if (!existing) {
      throw new NotFoundException('Takip ilişkisi bulunamadı');
    }

    await this.prisma.follow.delete({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    return { message: 'Takip bırakıldı' };
  }

  async getFollowers(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: {
              id: true,
              displayName: true,
              name: true,
              avatarUrl: true,
              bio: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.follow.count({ where: { followingId: userId } }),
    ]);

    return {
      data: followers.map((f) => f.follower),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getFollowing(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            select: {
              id: true,
              displayName: true,
              name: true,
              avatarUrl: true,
              bio: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.follow.count({ where: { followerId: userId } }),
    ]);

    return {
      data: following.map((f) => f.following),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async isFollowing(followerId: string, followingId: string) {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    return { isFollowing: !!follow };
  }
}
