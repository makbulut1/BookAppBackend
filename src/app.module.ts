import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BooksModule } from './modules/books/books.module';
import { PrismaModule } from './prisma/prisma.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { JamModule } from './jam/jam.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/static',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    BooksModule,
    JamModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
