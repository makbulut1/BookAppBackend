import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Mehmet Eren', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'mehmeteren', required: false })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({ example: 'Kitap okumayı seven bir yazılımcı.', required: false })
  @IsString()
  @IsOptional()
  bio?: string;
}
