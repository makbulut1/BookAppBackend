import { Module } from '@nestjs/common';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { BullModule } from '@nestjs/bullmq';
import { PDFProcessor } from './pdf-processor.service';
import { PDFService } from './pdf.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'pdf-processing',
    }),
    StorageModule,
  ],
  controllers: [BooksController],
  providers: [BooksService, PDFProcessor, PDFService],
  exports: [BooksService],
})
export class BooksModule {}
