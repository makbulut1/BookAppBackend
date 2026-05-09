import { 
  Controller, 
  Post, 
  UseGuards, 
  UseInterceptors, 
  UploadedFile, 
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards';
import { CurrentUser } from '../../auth/decorators';
import { UploadService } from './upload.service';

@ApiTags('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('avatar')
  @ApiOperation({ summary: 'Kullanıcı profil fotoğrafını yükle' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadService.updateAvatar(userId, file);
  }

  @Post('cover/:bookId')
  @ApiOperation({ summary: 'Kitap kapağı yükle' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadCover(
    @CurrentUser('id') userId: string,
    @Param('bookId') bookId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadService.updateCover(userId, bookId, file);
  }
}
