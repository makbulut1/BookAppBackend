import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
} from 'class-validator';

export class CreateBookmarkDto {
  @ApiProperty({ example: 'book-uuid' })
  @IsString()
  @IsNotEmpty()
  bookId: string;

  @ApiProperty({ example: 'chapter-uuid', required: false })
  @IsString()
  @IsOptional()
  chapterId?: string;

  @ApiProperty({ example: 47 })
  @IsInt()
  @Min(0)
  pageNumber: number;

  @ApiProperty({ example: 'Güzel sahne', required: false })
  @IsString()
  @IsOptional()
  title?: string;
}
