import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            _count: { select: { books: true } },
          },
        },
        _count: { select: { books: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(idOrSlug: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        children: true,
        parent: true,
        books: {
          include: {
            book: {
              include: {
                author: { select: { id: true, penName: true } },
              },
            },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category not found: ${idOrSlug}`);
    }

    return category;
  }

  async create(data: { name: string; description?: string; parentId?: string; iconUrl?: string }) {
    const slug = data.name
      .toLowerCase()
      .replace(/[çğışöü]/g, (c) => {
        const map: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ş: 's', ö: 'o', ü: 'u' };
        return map[c] || c;
      })
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    return this.prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        iconUrl: data.iconUrl,
        parentId: data.parentId,
      },
    });
  }

  async delete(id: string) {
    await this.prisma.category.delete({ where: { id } });
    return { message: 'Kategori başarıyla silindi' };
  }
}
