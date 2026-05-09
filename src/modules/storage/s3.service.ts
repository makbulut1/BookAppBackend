import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand, 
  HeadBucketCommand, 
  CreateBucketCommand,
  PutBucketPolicyCommand
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

@Injectable()
export class S3Service implements OnModuleInit {
  private readonly logger = new Logger(S3Service.name);
  private s3Client: S3Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: 'us-east-1',
      endpoint: `http://${this.configService.get('MINIO_ENDPOINT')}:${this.configService.get('MINIO_PORT')}`,
      credentials: {
        accessKeyId: this.configService.get('MINIO_ROOT_USER') || 'minioadmin',
        secretAccessKey: this.configService.get('MINIO_ROOT_PASSWORD') || 'minioadmin',
      },
      forcePathStyle: true,
    });
    this.bucket = this.configService.get('MINIO_BUCKET') || 'books';
  }

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Bucket "${this.bucket}" already exists.`);
    } catch (error) {
      this.logger.log(`Bucket "${this.bucket}" not found. Creating...`);
      await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      
      // Make bucket public for read access (optional but common for avatars/covers)
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'PublicRead',
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucket}/*`],
          },
        ],
      };
      
      await this.s3Client.send(new PutBucketPolicyCommand({
        Bucket: this.bucket,
        Policy: JSON.stringify(policy),
      }));
      
      this.logger.log(`Bucket "${this.bucket}" created and set to public read.`);
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const key = `${folder}/${Date.now()}-${file.originalname}`;
    
    const parallelUploads3 = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      },
    });

    await parallelUploads3.done();
    
    return key;
  }

  async deleteFile(key: string) {
    try {
      await this.s3Client.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
    } catch (error) {
      this.logger.error(`Error deleting file ${key}: ${error.message}`);
    }
  }

  getFileUrl(key: string): string {
    // For MinIO local development, we return the direct link
    // In production, this might be a CloudFront or CDN URL
    const endpoint = `http://${this.configService.get('MINIO_ENDPOINT')}:${this.configService.get('MINIO_PORT')}`;
    return `${endpoint}/${this.bucket}/${key}`;
  }
}
