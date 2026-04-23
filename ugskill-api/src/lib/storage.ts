import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '../config/s3';
import { env } from '../config/env';
import { logger } from './logger';

export const storage = {
  /**
   * Generate a presigned URL to allow a client to securely stream a file directly to AWS S3
   */
  async getUploadUrl(path: string, expiresInSeconds: number = 3600, contentType?: string) {
    try {
      const command = new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: path,
        ContentType: contentType
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });

      return {
        signedUrl,
        path,
        bucket: env.AWS_S3_BUCKET
      };
    } catch (error) {
      logger.error('Error generating pre-signed upload URL for S3', error);
      throw error;
    }
  },

  /**
   * Generate a presigned URL to allow a client to securely download a file
   */
  async getDownloadUrl(path: string, expiresInSeconds: number = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: path
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });

      return { signedUrl };
    } catch (error) {
      logger.error('Error generating pre-signed download URL for S3', error);
      throw error;
    }
  },

  /**
   * Remove a file from a bucket
   */
  async removeFile(path: string) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: path
      });

      await s3Client.send(command);
    } catch (error) {
      logger.error('Error removing file from S3', error);
      throw error;
    }
  }
};
