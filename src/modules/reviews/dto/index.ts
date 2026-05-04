import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 'book-uuid' })
  @IsString()
  @IsNotEmpty()
  bookId: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Muhteşem bir eser', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: 'Yazarın dili çok akıcı, konusu çok etkileyici.' })
  @IsString()
  @IsNotEmpty()
  comment: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

export class UpdateReviewDto {
  @ApiProperty({ example: 4, minimum: 1, maximum: 5, required: false })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiProperty({ example: 'Güncellenmiş başlık', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: 'Güncellenmiş yorum', required: false })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
