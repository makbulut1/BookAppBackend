import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as xml2js from 'xml2js';

const { EPub } = require('epub2');

@Injectable()
export class PDFService {
  private readonly logger = new Logger(PDFService.name);

  async parseFromUrl(
    url: string,
  ): Promise<{
    text: string;
    pages: number;
    metadata: any;
    pageTexts: string[];
  }> {
    const extension = url.split('.').pop()?.toLowerCase();

    try {
      this.logger.log(
        `Downloading book from ${url} (Detected extension: ${extension})`,
      );
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);

      if (extension === 'pdf') {
        return await this.parsePDF(buffer);
      } else if (extension === 'epub') {
        return await this.parseEPUB(buffer);
      } else if (extension === 'acsm') {
        return await this.parseACSM(buffer.toString());
      } else {
        // Fallback attempt based on content type or try PDF as default
        return await this.parsePDF(buffer);
      }
    } catch (error) {
      this.logger.error(`Error parsing book from URL: ${error.message}`);
      throw error;
    }
  }

  private async parsePDF(buffer: Buffer) {
    this.logger.log('Parsing PDF content');
    const { PDFParse } = require('pdf-parse');

    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const info = await parser.getInfo();

    // Optional cleanup
    if (typeof parser.destroy === 'function') {
      await parser.destroy();
    }

    const pageTexts = result.pages
      ? result.pages.map((p: any) => p.text)
      : [result.text];

    return {
      text: result.text,
      pages: result.total || info.total || 0,
      metadata: info.info,
      pageTexts: pageTexts,
    };
  }

  private async parseEPUB(buffer: Buffer) {
    this.logger.log('Parsing EPUB content');

    // Write buffer to temp file because epub2 prefers paths (or we can use temporary file)
    // For simplicity and since we are on a fast machine:
    const tmpPath = `/tmp/tmp-${Date.now()}.epub`;
    const fs = require('fs');
    fs.writeFileSync(tmpPath, buffer);

    try {
      const epub = await EPub.createAsync(tmpPath);
      const pageTexts: string[] = [];

      // Extract text from each chapter
      for (const chapter of epub.flow) {
        const text = await epub.getChapterRawAsync(chapter.id);
        // Basic HTML to text conversion (could be improved)
        const plainText = text.replace(/<[^>]*>?/gm, ' ').trim();
        if (plainText) pageTexts.push(plainText);
      }

      return {
        text: pageTexts.join('\n\n'),
        pages: pageTexts.length,
        metadata: {
          title: epub.metadata.title,
          creator: epub.metadata.creator,
        },
        pageTexts: pageTexts,
      };
    } finally {
      if (require('fs').existsSync(tmpPath)) {
        require('fs').unlinkSync(tmpPath);
      }
    }
  }

  private async parseACSM(xmlContent: string) {
    this.logger.log('Parsing ACSM license metadata');
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(xmlContent);

    // ACSM structure usually looks like <fulfillmentToken><metadata>
    const metadata = result.fulfillmentToken?.metadata || {};
    const title = metadata['dc:title'] || 'Yüklenmemiş Kitap (ACSM)';
    const author = metadata['dc:creator'] || 'Bilinmeyen Yazar';

    return {
      text: 'Bu bir ACSM lisans dosyasıdır. Gerçek kitabı okumak için Adobe Digital Editions ile etkinleştirilmelidir.',
      pages: 1,
      metadata: { title, author, isACSM: true },
      pageTexts: [
        'Bu kitap bir ACSM lisansıdır. Lütfen gerçek PDF veya EPUB dosyasını yükleyin.',
      ],
    };
  }
}
