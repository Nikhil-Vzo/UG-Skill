import { notificationQueue } from '../../config/queue';
import { resend } from '../../config/resend';
import { getPgClient } from '../../config/postgres';
import { logger } from '../../lib/logger';

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
    if (!notificationQueue) {
      // If queue is disabled, send directly/synchronously
      logger.info('Redis disabled: sending notification directly', { subject: params.subject });
      try {
        let messageId = null;
        let status = 'SENT';

        if (resend) {
          const resp = await resend.emails.send({
            from: 'system@ugskill.com',
            to: params.to,
            subject: params.subject,
            html: params.html,
          });
          if (resp.error) {
            throw new Error(resp.error.message);
          }
          messageId = resp.data?.id;
        } else {
          logger.info(`[MOCK EMAIL] To: ${params.to} | Subject: ${params.subject}`);
        }

        const sql = getPgClient();
        await sql`
          INSERT INTO notification_logs (user_id, channel, subject, recipient, provider_message_id, metadata, status)
          VALUES (${params.userId || null}, 'EMAIL', ${params.subject}, ${Array.isArray(params.to) ? params.to[0] : params.to}, ${messageId || null}, ${params.metadata ? JSON.stringify(params.metadata) : null}, ${status})
        `;
      } catch (error) {
        logger.error('Failed to process direct notification', error);
        try {
          const sql = getPgClient();
          await sql`
            INSERT INTO notification_logs (user_id, channel, subject, recipient, metadata, status, error_message)
            VALUES (${params.userId || null}, 'EMAIL', ${params.subject}, ${Array.isArray(params.to) ? params.to[0] : params.to}, ${params.metadata ? JSON.stringify(params.metadata) : null}, 'FAILED', ${error instanceof Error ? error.message : 'Unknown error'})
          `;
        } catch (dbErr) {
          logger.error('Failed to write direct failure log to DB', dbErr);
        }
      }
      return;
    }

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
