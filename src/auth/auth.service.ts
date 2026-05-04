import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, UpdateProfileDto } from './dto';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '@prisma/client';

// User response type without password
type SafeUser = Omit<User, 'password'>;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ user: SafeUser; accessToken: string }> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Bu e-posta adresi zaten kayıtlı');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Generate default avatar URL
    const defaultAvatarName = dto.displayName || dto.name || 'User';
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(defaultAvatarName)}&background=random&color=fff&size=256`;

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        displayName: dto.displayName,
        avatarUrl,
      },
    });

    // Generate JWT token
    const accessToken = this.generateToken(user);

    this.logger.log(`New user registered: ${user.email}`);

    const { password: _, ...safeUser } = user;
    return { user: safeUser, accessToken };
  }

  async login(
    dto: LoginDto,
  ): Promise<{ user: SafeUser; accessToken: string }> {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Geçersiz e-posta veya şifre');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Geçersiz e-posta veya şifre');
    }

    // Generate JWT token
    const accessToken = this.generateToken(user);

    this.logger.log(`User logged in: ${user.email}`);

    const { password: _, ...safeUser } = user;
    return { user: safeUser, accessToken };
  }

  async getProfile(userId: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        author: true,
        _count: {
          select: {
            reviews: true,
            annotations: true,
            bookmarks: true,
            readingProgress: true,
            following: true,
            followers: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı');
    }

    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<SafeUser> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.displayName !== undefined && { displayName: dto.displayName }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
      },
    });

    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  async becomeAuthor(
    userId: string,
    penName: string,
    biography?: string,
  ): Promise<SafeUser> {
    // Check if user already has an author profile
    const existingAuthor = await this.prisma.author.findUnique({
      where: { userId },
    });

    if (existingAuthor) {
      throw new ConflictException('Zaten bir yazar profiliniz var');
    }

    // Generate default avatar URL for author
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(penName)}&background=random&color=fff&size=256`;

    // Create author profile and update user role in a transaction
    await this.prisma.$transaction([
      this.prisma.author.create({
        data: {
          userId,
          penName,
          biography,
          avatarUrl,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { role: UserRole.AUTHOR },
      }),
    ]);

    return this.getProfile(userId);
  }

  private generateToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }
}
