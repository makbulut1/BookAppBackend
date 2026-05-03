import { PartialType } from '@nestjs/swagger';
import { CreateBookDto } from './create-book.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { BookStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBookDto extends PartialType(CreateBookDto) {
  @ApiProperty({ enum: BookStatus, required: false })
  @IsEnum(BookStatus)
  @IsOptional()
  status?: BookStatus;
}
