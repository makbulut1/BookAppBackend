import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAnnotationDto, UpdateAnnotationDto } from './dto';

@Injectable()
export class AnnotationsService {
  private readonly logger = new Logger(AnnotationsService.name);

  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateAnnotationDto) {
    const annotation = await this.prisma.annotation.create({
      data: {
        userId,
        bookId: dto.bookId,
        chapterId: dto.chapterId,
        rangeStart: dto.rangeStart,
        rangeEnd: dto.rangeEnd,
        color: dto.color || 'yellow',
        note: dto.note,
        pageNumber: dto.pageNumber,
        isPublic: dto.isPublic ?? false,
      },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
        book: { select: { id: true, title: true } },
      },
    });

    this.logger.log(
      `Annotation created: ${annotation.id} by user ${userId} on book ${dto.bookId}`,
    );

    return annotation;
  }

  async findByBook(bookId: string, userId?: string) {
    const where: any = { bookId };

    // Show user's own + public annotations
    if (userId) {
      where.OR = [{ userId }, { isPublic: true }];
    } else {
      where.isPublic = true;
    }

    return this.prisma.annotation.findMany({
      where,
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: [{ pageNumber: 'asc' }, { rangeStart: 'asc' }],
    });
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [annotations, total] = await Promise.all([
      this.prisma.annotation.findMany({
        where: { userId },
        include: {
          book: {
            select: { id: true, title: true, slug: true, coverImageUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.annotation.count({ where: { userId } }),
    ]);

    return {
      data: annotations,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async update(id: string, userId: string, dto: UpdateAnnotationDto) {
    const annotation = await this.prisma.annotation.findUnique({
      where: { id },
    });

    if (!annotation) {
      throw new NotFoundException('Anotasyon bulunamadı');
    }

    if (annotation.userId !== userId) {
      throw new ForbiddenException('Bu anotasyonu düzenleme yetkiniz yok');
    }

    return this.prisma.annotation.update({
      where: { id },
      data: {
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.note !== undefined && { note: dto.note }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
      },
    });
  }

  async delete(id: string, userId: string) {
    const annotation = await this.prisma.annotation.findUnique({
      where: { id },
    });

    if (!annotation) {
      throw new NotFoundException('Anotasyon bulunamadı');
    }

    if (annotation.userId !== userId) {
      throw new ForbiddenException('Bu anotasyonu silme yetkiniz yok');
    }

    await this.prisma.annotation.delete({ where: { id } });
    return { message: 'Anotasyon silindi' };
  }
}
