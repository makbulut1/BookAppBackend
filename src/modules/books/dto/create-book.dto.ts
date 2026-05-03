import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsArray,
} from 'class-validator';
import { BookFormat } from '@prisma/client';

export class CreateBookDto {
  @ApiProperty({ example: 'Satır Arası' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'Bir yazılımcının kitap okuma serüveni.',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'https://example.com/cover.jpg', required: false })
  @IsUrl()
  @IsOptional()
  coverImageUrl?: string;

  @ApiProperty({ example: '#5a1313', required: false })
  @IsString()
  @IsOptional()
  coverColor?: string;

  @ApiProperty({ example: '978-3-16-148410-0', required: false })
  @IsString()
  @IsOptional()
  isbn?: string;

  @ApiProperty({ example: 'tr', required: false })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({ example: 29.99, required: false })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isFree?: boolean;

  @ApiProperty({ enum: BookFormat, example: 'EPUB', required: false })
  @IsEnum(BookFormat)
  @IsOptional()
  format?: BookFormat;

  @ApiProperty({ example: 'https://example.com/book.pdf', required: false })
  @IsUrl()
  @IsOptional()
  fileUrl?: string;

  @ApiProperty({
    example: ['category-uuid-1'],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categoryIds?: string[];

  @ApiProperty({
    example: ['roman', 'bilim-kurgu'],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
