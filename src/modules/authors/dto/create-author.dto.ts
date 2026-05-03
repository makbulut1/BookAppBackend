import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateAuthorDto {
  @ApiProperty({ example: 'Orhan Pamuk' })
  @IsString()
  @IsNotEmpty()
  penName: string;

  @ApiProperty({
    example: 'Nobel ödüllü Türk romancı.',
    required: false,
  })
  @IsString()
  @IsOptional()
  biography?: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({ example: 'https://orhanpamuk.com', required: false })
  @IsUrl()
  @IsOptional()
  websiteUrl?: string;

  @ApiProperty({
    example: { twitter: '@orhanpamuk', instagram: '@orhanpamuk' },
    required: false,
  })
  @IsOptional()
  socialLinks?: Record<string, string>;
}
