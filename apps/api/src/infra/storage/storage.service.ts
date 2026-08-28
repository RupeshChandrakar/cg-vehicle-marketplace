import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

/**
 * Thin wrapper around the S3-compatible bucket (MinIO locally, S3 in
 * production) so the rest of the app never touches the AWS SDK directly —
 * swapping providers later means changing only this file.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(configService: ConfigService) {
    this.bucket = configService.getOrThrow<string>('STORAGE_BUCKET');
    this.publicUrl = configService.getOrThrow<string>('STORAGE_PUBLIC_URL');
    this.client = new S3Client({
      endpoint: configService.getOrThrow<string>('STORAGE_ENDPOINT'),
      region: configService.getOrThrow<string>('STORAGE_REGION'),
      credentials: {
        accessKeyId: configService.getOrThrow<string>('STORAGE_ACCESS_KEY_ID'),
        secretAccessKey: configService.getOrThrow<string>(
          'STORAGE_SECRET_ACCESS_KEY',
        ),
      },
      // MinIO needs path-style URLs (bucket in the path, not a subdomain).
      forcePathStyle: true,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.ensureBucketExists();
  }

  async upload(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  /** Vehicle photos are public once a listing is live — no signed URLs needed. */
  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }

  /** Used by ReelsService to pull vehicle photos onto local disk as real
   *  FFmpeg input files — nothing else in the app needs to read storage
   *  objects back out, only ever serve their public URL. */
  async download(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    const bytes = await response.Body?.transformToByteArray();
    if (!bytes) {
      throw new Error(`Storage object "${key}" has no body`);
    }
    return Buffer.from(bytes);
  }

  private async ensureBucketExists(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return;
    } catch {
      // Falls through to create it below.
    }

    try {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      await this.client.send(
        new PutBucketPolicyCommand({
          Bucket: this.bucket,
          Policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: '*',
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${this.bucket}/*`],
              },
            ],
          }),
        }),
      );
      this.logger.log(
        `Created storage bucket "${this.bucket}" with public read access`,
      );
    } catch (error) {
      // Non-fatal: the API should still boot for routes that don't touch
      // storage, and an actual upload attempt will surface a clear error.
      this.logger.warn(
        `Could not ensure storage bucket "${this.bucket}" exists: ${(error as Error).message}`,
      );
    }
  }
}
