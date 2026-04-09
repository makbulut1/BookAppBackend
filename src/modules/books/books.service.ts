import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Book, BookStatus } from '@prisma/client';

@Injectable()
export class BooksService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('pdf-processing') private pdfQueue: Queue,
  ) {}

  async create(data: {
    title: string;
    author: string;
    pdfUrl?: string;
  }): Promise<Book> {
    const book = await this.prisma.book.create({
      data: {
        ...data,
        status: data.pdfUrl ? BookStatus.PROCESSING : BookStatus.READY,
      },
    });

    if (data.pdfUrl) {
      await this.pdfQueue.add('process-pdf', {
        bookId: book.id,
        pdfUrl: data.pdfUrl,
      });
    }

    return book;
  }

  async findAll() {
    return this.prisma.book.findMany({
      include: {
        _count: {
          select: { reviews: true, annotations: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: {
        reviews: true,
        annotations: true,
      },
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    return book;
  }
}
