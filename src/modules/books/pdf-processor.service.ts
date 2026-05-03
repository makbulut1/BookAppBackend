import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { BookStatus } from '@prisma/client';
import { Logger } from '@nestjs/common';
import { PDFService } from './pdf.service';

@Processor('pdf-processing')
export class PDFProcessor extends WorkerHost {
  private readonly logger = new Logger(PDFProcessor.name);

  constructor(
    private prisma: PrismaService,
    private pdfService: PDFService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { bookId, fileUrl } = job.data;
    this.logger.log(`Processing file for book ${bookId} from ${fileUrl}`);

    try {
      // 1. Update status to PROCESSING
      await this.prisma.book.update({
        where: { id: bookId },
        data: { status: BookStatus.PROCESSING },
      });

      // 2. Parse the file (PDF/EPUB)
      const result = await this.pdfService.parseFromUrl(fileUrl);

      this.logger.log(
        `Successfully parsed file for book ${bookId}. Pages: ${result.pages}`,
      );

      // 3. Create chapters from parsed pages
      for (let i = 0; i < result.pageTexts.length; i++) {
        const content = result.pageTexts[i];
        const wordCount = content.split(/\s+/).length;

        await this.prisma.chapter.upsert({
          where: {
            bookId_orderIndex: {
              bookId,
              orderIndex: i + 1,
            },
          },
          create: {
            bookId,
            title: `Bölüm ${i + 1}`,
            content,
            orderIndex: i + 1,
            wordCount,
          },
          update: {
            content,
            wordCount,
          },
        });
      }

      // 4. Update book status to PUBLISHED and save metadata
      const totalWordCount = result.pageTexts
        .join(' ')
        .split(/\s+/).length;

      await this.prisma.book.update({
        where: { id: bookId },
        data: {
          status: BookStatus.PUBLISHED,
          pageCount: result.pages,
          wordCount: totalWordCount,
          metadata: result.metadata as any,
        },
      });

      this.logger.log(
        `Book ${bookId} is now PUBLISHED with ${result.pageTexts.length} chapters.`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process file for book ${bookId}: ${error.message}`,
      );
      await this.prisma.book.update({
        where: { id: bookId },
        data: { status: BookStatus.FAILED },
      });
    }
  }
}
