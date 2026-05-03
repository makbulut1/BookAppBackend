import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Mehmet Eren', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'mehmeteren', required: false })
  @IsString()
  @IsOptional()
  displayName?: string;
}
