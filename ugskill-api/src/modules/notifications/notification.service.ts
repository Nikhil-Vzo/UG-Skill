import { notificationQueue } from '../../config/queue';

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export const notificationService = {
  /**
   * Pushes an email completely asynchronously onto the BullMQ queue
   */
  async sendEmail(params: SendEmailParams) {
    // Add job to BullMQ
    await notificationQueue.add('sendEmail', params, {
      removeOnComplete: true, // we already log to Postgres, no need to keep in Redis
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    });
  }
};
