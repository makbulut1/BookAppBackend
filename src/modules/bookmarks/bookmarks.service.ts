import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookmarkDto } from './dto';

@Injectable()
export class BookmarksService {
  private readonly logger = new Logger(BookmarksService.name);

  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBookmarkDto) {
    const bookmark = await this.prisma.bookmark.create({
      data: {
        userId,
        bookId: dto.bookId,
        chapterId: dto.chapterId,
        pageNumber: dto.pageNumber,
        title: dto.title,
      },
      include: {
        book: {
          select: { id: true, title: true, slug: true, coverImageUrl: true },
        },
      },
    });

    this.logger.log(
      `Bookmark created: page ${dto.pageNumber} of book ${dto.bookId}`,
    );

    return bookmark;
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      this.prisma.bookmark.findMany({
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
      this.prisma.bookmark.count({ where: { userId } }),
    ]);

    return {
      data: bookmarks,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByBook(userId: string, bookId: string) {
    return this.prisma.bookmark.findMany({
      where: { userId, bookId },
      orderBy: { pageNumber: 'asc' },
    });
  }

  async delete(id: string, userId: string) {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: { id },
    });

    if (!bookmark) {
      throw new NotFoundException('Yer imi bulunamadı');
    }

    if (bookmark.userId !== userId) {
      throw new ForbiddenException('Bu yer imini silme yetkiniz yok');
    }

    await this.prisma.bookmark.delete({ where: { id } });
    return { message: 'Yer imi silindi' };
  }

  async deleteAllForBook(userId: string, bookId: string) {
    const result = await this.prisma.bookmark.deleteMany({
      where: { userId, bookId },
    });

    return { message: `${result.count} yer imi silindi` };
  }
}
