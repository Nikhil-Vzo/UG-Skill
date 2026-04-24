import { supabaseAdmin } from '../config/supabase';
import { env } from '../config/env';
import { logger } from './logger';

export const storage = {
  /**
   * Generate a presigned URL to allow a client to securely stream a file directly to Supabase
   */
  async getUploadUrl(path: string, expiresInSeconds: number = 3600, contentType?: string) {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(env.SUPABASE_STORAGE_BUCKET)
        .createSignedUploadUrl(path);

      if (error) throw error;

      return {
        signedUrl: data.signedUrl,
        path,
        bucket: env.SUPABASE_STORAGE_BUCKET,
        token: data.token
      };
    } catch (error) {
      logger.error('Error generating pre-signed upload URL for Supabase', error);
      throw error;
    }
  },

  /**
   * Generate a presigned URL to allow a client to securely download a file
   */
  async getDownloadUrl(path: string, expiresInSeconds: number = 3600) {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(env.SUPABASE_STORAGE_BUCKET)
        .createSignedUrl(path, expiresInSeconds);

      if (error) throw error;

      return { signedUrl: data.signedUrl };
    } catch (error) {
      logger.error('Error generating pre-signed download URL for Supabase', error);
      throw error;
    }
  },

  /**
   * Remove a file from a bucket
   */
  async removeFile(path: string) {
    try {
      const { error } = await supabaseAdmin.storage
        .from(env.SUPABASE_STORAGE_BUCKET)
        .remove([path]);

      if (error) throw error;
    } catch (error) {
      logger.error('Error removing file from Supabase', error);
      throw error;
    }
  }
};
