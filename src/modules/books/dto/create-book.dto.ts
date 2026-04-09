import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateBookDto {
  @ApiProperty({ example: 'The Great Gatsby' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'F. Scott Fitzgerald' })
  @IsString()
  @IsNotEmpty()
  author: string;

  @ApiProperty({ example: 'https://example.com/book.pdf', required: false })
  @IsUrl()
  @IsOptional()
  pdfUrl?: string;
}
