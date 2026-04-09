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
    const { bookId, pdfUrl } = job.data;
    this.logger.log(`Processing PDF for book ${bookId} from ${pdfUrl}`);

    try {
      // 1. Update status to PROCESSING
      await this.prisma.book.update({
        where: { id: bookId },
        data: { status: BookStatus.PROCESSING },
      });

      // 2. Parse PDF
      const result = await this.pdfService.parseFromUrl(pdfUrl);

      this.logger.log(
        `Successfully parsed PDF for book ${bookId}. Pages: ${result.pages}`,
      );

      // 3. Update status to READY and save pages/metadata
      await this.prisma.book.update({
        where: { id: bookId },
        data: {
          status: BookStatus.READY,
          pages: result.pageTexts,
          pageCount: result.pages,
          metadata: result.metadata as any,
        },
      });

      this.logger.log(
        `Book ${bookId} is now READY with ${result.pageTexts.length} accurately extracted pages.`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process PDF for book ${bookId}: ${error.message}`,
      );
      await this.prisma.book.update({
        where: { id: bookId },
        data: { status: BookStatus.FAILED },
      });
    }
  }
}
