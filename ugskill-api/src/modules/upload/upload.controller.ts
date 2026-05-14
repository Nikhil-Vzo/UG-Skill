import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../../lib/storage';
import { ValidationError, AuthError } from '../../lib/errors';
import { logger } from '../../lib/logger';

// Maximum sizes in bytes
const MB = 1024 * 1024;
const GB = 1024 * MB;

const CATEGORY_RULES: Record<string, { roles: string[], maxBytes: number, mimes: string[] }> = {
  placement_drive: {
    roles: ['hr', 'admin'],
    maxBytes: 10 * MB,
    mimes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg', 'text/csv']
  },
  course_content: {
    roles: ['creator', 'admin'],
    maxBytes: 2 * GB,
    mimes: [
      'video/mp4', 'video/webm',
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/png', 'image/jpeg', 'image/webp',
      'text/plain', 'text/vtt',
      'application/json'
    ]
  },
  user_profile: {
    roles: ['*'], // All authenticated users
    maxBytes: 5 * MB,
    mimes: ['image/png', 'image/jpeg']
  },
  assignment_submission: {
    roles: ['*'], // All authenticated users
    maxBytes: 50 * MB,
    mimes: ['application/pdf', 'application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed']
  }
};

export const generateUploadUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileName, fileType, fileSize, category } = req.body;
    const user = req.user!; // Provided by requireAuth

    // 1. Validate Category
    const rule = CATEGORY_RULES[category];
    if (!rule) {
      throw new ValidationError(`Invalid upload category: ${category}`);
    }

    // 2. Validate Role
    if (!rule.roles.includes('*')) {
      const hasRole = user.roles.some((r) => rule.roles.includes(r));
      if (!hasRole) {
        throw new AuthError(`You do not have permission to upload files to category: ${category}`, 403);
      }
    }

    // 3. Validate File Type
    if (!rule.mimes.includes(fileType)) {
      throw new ValidationError(`File type ${fileType} is not allowed for category ${category}. Allowed types: ${rule.mimes.join(', ')}`);
    }

    // 4. Validate File Size
    if (!fileSize || typeof fileSize !== 'number' || fileSize <= 0) {
      throw new ValidationError('Invalid file size provided');
    }
    if (fileSize > rule.maxBytes) {
      throw new ValidationError(`File size exceeds the maximum limit of ${rule.maxBytes / MB}MB for category ${category}`);
    }

    // 5. Generate unique path
    // Format: uploads/{category}/{userId}/{uuid}_{sanitizedFileName}
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `uploads/${category}/${user.userId}/${uuidv4()}_${sanitizedFileName}`;

    // 6. Generate presigned URL via storage utility
    // We request the URL to expire in 3600 seconds (1 hour)
    const result = await storage.getUploadUrl(path, 3600, fileType);

    logger.info('Generated presigned upload URL', { userId: user.userId, category, path });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate a short-lived signed URL for a storage path
 */
export const signUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { path } = req.query;
    if (!path || typeof path !== 'string') {
      throw new ValidationError('Storage path is required');
    }

    const { signedUrl } = await storage.getDownloadUrl(path);

    res.status(200).json({
      success: true,
      data: { signedUrl },
    });
  } catch (error) {
    next(error);
  }
};
