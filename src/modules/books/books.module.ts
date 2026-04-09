import { Module } from '@nestjs/common';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { BullModule } from '@nestjs/bullmq';
import { PDFProcessor } from './pdf-processor.service';
import { PDFService } from './pdf.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'pdf-processing',
    }),
  ],
  controllers: [BooksController],
  providers: [BooksService, PDFProcessor, PDFService],
})
export class BooksModule {}
