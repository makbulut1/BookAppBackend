import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../storage/s3.service';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  async updateAvatar(userId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Dosya yüklenemedi');
    
    const key = await this.s3Service.uploadFile(file, 'avatars');
    const avatarUrl = this.s3Service.getFileUrl(key);
    
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { author: true }
    });
    
    if (user?.author) {
      await this.prisma.author.update({
        where: { userId },
        data: { avatarUrl },
      });
    }

    this.logger.log(`Avatar updated for user ${userId} in MinIO`);
    return { message: 'Profil fotoğrafı güncellendi', avatarUrl };
  }

  async updateCover(userId: string, bookId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Dosya yüklenemedi');

    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: { author: true }
    });

    if (!book) throw new NotFoundException('Kitap bulunamadı');
    
    if (book.author.userId !== userId) {
      throw new BadRequestException('Bu kitabın kapağını değiştirme yetkiniz yok');
    }

    const key = await this.s3Service.uploadFile(file, 'covers');
    const coverImageUrl = this.s3Service.getFileUrl(key);

    await this.prisma.book.update({
      where: { id: bookId },
      data: { coverImageUrl },
    });

    this.logger.log(`Cover updated for book ${bookId} in MinIO`);
    return { message: 'Kitap kapağı güncellendi', coverImageUrl };
  }
}
