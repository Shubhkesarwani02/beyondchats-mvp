/**
 * File Storage Utility
 * 
 * This utility provides a unified interface for file storage operations.
 * Currently supports local storage (development) and can be extended for cloud storage.
 * 
 * TODO: Implement cloud storage provider (S3, Vercel Blob, R2, etc.)
 */

import { writeFile, readFile, access } from 'fs/promises';
import path from 'path';
import { constants } from 'fs';

export interface FileStorage {
  upload(file: Buffer, filename: string, contentType?: string): Promise<string>;
  getUrl(filename: string): Promise<string>;
  delete(filename: string): Promise<void>;
  exists(filename: string): Promise<boolean>;
}

/**
 * Local File Storage (Development Only)
 * DO NOT USE IN PRODUCTION
 */
class LocalFileStorage implements FileStorage {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads');
  }

  async upload(file: Buffer, filename: string): Promise<string> {
    const filePath = path.join(this.uploadDir, filename);
    await writeFile(filePath, file);
    return `/uploads/${filename}`;
  }

  async getUrl(filename: string): Promise<string> {
    // Return relative URL for local storage
    return `/uploads/${filename}`;
  }

  async delete(filename: string): Promise<void> {
    const { unlink } = await import('fs/promises');
    const filePath = path.join(this.uploadDir, filename);
    await unlink(filePath);
  }

  async exists(filename: string): Promise<boolean> {
    const filePath = path.join(this.uploadDir, filename);
    try {
      await access(filePath, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async read(filename: string): Promise<Buffer> {
    const filePath = path.join(this.uploadDir, filename);
    return await readFile(filePath);
  }
}

/**
 * AWS S3 File Storage
 * Uncomment and configure when ready to use
 */
/*
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

class S3FileStorage implements FileStorage {
  private s3Client: S3Client;
  private bucket: string;
  private region: string;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET!;
    this.region = process.env.AWS_REGION!;
    
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  async upload(file: Buffer, filename: string, contentType: string): Promise<string> {
    const key = `pdfs/${filename}`;
    
    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
      // ACL: 'public-read', // or use presigned URLs for private access
    }));

    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async getUrl(filename: string): Promise<string> {
    const key = `pdfs/${filename}`;
    
    // Option 1: Public URL
    // return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    
    // Option 2: Presigned URL (more secure)
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    
    return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 }); // 1 hour
  }

  async delete(filename: string): Promise<void> {
    const key = `pdfs/${filename}`;
    
    await this.s3Client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
  }

  async exists(filename: string): Promise<boolean> {
    const key = `pdfs/${filename}`;
    
    try {
      await this.s3Client.send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
      return true;
    } catch {
      return false;
    }
  }
}
*/

/**
 * Vercel Blob Storage
 * Uncomment and configure when ready to use
 */
/*
import { put, del, head } from '@vercel/blob';

class VercelBlobStorage implements FileStorage {
  async upload(file: Buffer, filename: string, contentType: string): Promise<string> {
    const blob = await put(filename, file, {
      access: 'public',
      contentType: contentType,
    });

    return blob.url;
  }

  async getUrl(filename: string): Promise<string> {
    // Vercel Blob URLs are permanent and accessible directly
    // If you need to regenerate, you'll need to store the URL in your database
    throw new Error('URL retrieval not implemented - store URLs in database');
  }

  async delete(filename: string): Promise<void> {
    // Need the full URL to delete in Vercel Blob
    // Store the URL in database and pass it here
    await del(filename);
  }

  async exists(filename: string): Promise<boolean> {
    try {
      await head(filename);
      return true;
    } catch {
      return false;
    }
  }
}
*/

/**
 * Cloudflare R2 Storage (S3-compatible)
 * Uncomment and configure when ready to use
 */
/*
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

class R2FileStorage implements FileStorage {
  private s3Client: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID!;
    this.bucket = process.env.R2_BUCKET_NAME!;
    this.publicUrl = process.env.R2_PUBLIC_URL!; // Your custom domain or R2.dev domain
    
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }

  async upload(file: Buffer, filename: string, contentType: string): Promise<string> {
    const key = `pdfs/${filename}`;
    
    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    }));

    return `${this.publicUrl}/${key}`;
  }

  async getUrl(filename: string): Promise<string> {
    const key = `pdfs/${filename}`;
    return `${this.publicUrl}/${key}`;
  }

  async delete(filename: string): Promise<void> {
    const key = `pdfs/${filename}`;
    
    await this.s3Client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
  }

  async exists(filename: string): Promise<boolean> {
    const key = `pdfs/${filename}`;
    
    try {
      await this.s3Client.send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
      return true;
    } catch {
      return false;
    }
  }
}
*/

/**
 * Get the appropriate storage implementation based on environment
 */
export function getFileStorage(): FileStorage & { read?: (filename: string) => Promise<Buffer> } {
  const storageType = process.env.FILE_STORAGE_TYPE || 'local';

  switch (storageType) {
    case 'local':
      return new LocalFileStorage();
    
    // Uncomment when implementing cloud storage:
    // case 's3':
    //   return new S3FileStorage();
    // case 'vercel':
    //   return new VercelBlobStorage();
    // case 'r2':
    //   return new R2FileStorage();
    
    default:
      console.warn(`Unknown storage type: ${storageType}, falling back to local`);
      return new LocalFileStorage();
  }
}

/**
 * Helper to determine if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Helper to validate storage configuration
 */
export function validateStorageConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const storageType = process.env.FILE_STORAGE_TYPE || 'local';

  if (isProduction() && storageType === 'local') {
    errors.push('WARNING: Using local storage in production. This will not work in serverless environments!');
  }

  switch (storageType) {
    case 's3':
      if (!process.env.AWS_ACCESS_KEY_ID) errors.push('AWS_ACCESS_KEY_ID not set');
      if (!process.env.AWS_SECRET_ACCESS_KEY) errors.push('AWS_SECRET_ACCESS_KEY not set');
      if (!process.env.AWS_REGION) errors.push('AWS_REGION not set');
      if (!process.env.AWS_S3_BUCKET) errors.push('AWS_S3_BUCKET not set');
      break;
    
    case 'vercel':
      if (!process.env.BLOB_READ_WRITE_TOKEN) errors.push('BLOB_READ_WRITE_TOKEN not set');
      break;
    
    case 'r2':
      if (!process.env.R2_ACCOUNT_ID) errors.push('R2_ACCOUNT_ID not set');
      if (!process.env.R2_ACCESS_KEY_ID) errors.push('R2_ACCESS_KEY_ID not set');
      if (!process.env.R2_SECRET_ACCESS_KEY) errors.push('R2_SECRET_ACCESS_KEY not set');
      if (!process.env.R2_BUCKET_NAME) errors.push('R2_BUCKET_NAME not set');
      if (!process.env.R2_PUBLIC_URL) errors.push('R2_PUBLIC_URL not set');
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
