import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt } from 'class-validator';

export class CreateChapterDto {
  @ApiProperty({ example: 'Bölüm 1: Başlangıç' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Bir zamanlar uzak bir diyarda...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  orderIndex: number;
}
