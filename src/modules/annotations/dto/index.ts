import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsBoolean,
  Min,
} from 'class-validator';

export class CreateAnnotationDto {
  @ApiProperty({ example: 'book-uuid' })
  @IsString()
  @IsNotEmpty()
  bookId: string;

  @ApiProperty({ example: 'chapter-uuid', required: false })
  @IsString()
  @IsOptional()
  chapterId?: string;

  @ApiProperty({ example: 120, description: 'Start character index' })
  @IsInt()
  @Min(0)
  rangeStart: number;

  @ApiProperty({ example: 185, description: 'End character index' })
  @IsInt()
  @Min(0)
  rangeEnd: number;

  @ApiProperty({ example: 'yellow', required: false })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ example: 'Bu cümle çok etkileyici!', required: false })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty({ example: 42 })
  @IsInt()
  @Min(0)
  pageNumber: number;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

export class UpdateAnnotationDto {
  @ApiProperty({ example: 'mint', required: false })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ example: 'Güncellenmiş not', required: false })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
