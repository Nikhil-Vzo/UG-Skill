import { Job } from 'bullmq';
import { logger } from '../lib/logger';
import { resend } from '../config/resend';
import { getPgClient } from '../config/postgres';

export const handleNotification = async (job: Job) => {
  const { to, subject, html, userId, metadata } = job.data;
  
  try {
    let messageId = null;
    let status = 'SENT';

    // If Resend is configured, actually send it
    if (resend) {
      const resp = await resend.emails.send({
        from: 'system@ugskill.com', // Replace with verified domain
        to,
        subject,
        html,
      });
      
      if (resp.error) {
        throw new Error(resp.error.message);
      }
      messageId = resp.data?.id;
    } else {
      // Mock sending in local dev
      logger.info(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
    }

    const sql = getPgClient();
    await sql`
      INSERT INTO notification_logs (user_id, channel, subject, recipient, provider_message_id, metadata, status)
      VALUES (${userId || null}, 'EMAIL', ${subject}, ${Array.isArray(to) ? to[0] : to}, ${messageId || null}, ${metadata ? JSON.stringify(metadata) : null}, ${status})
    `;

  } catch (error) {
    logger.error('Failed to process notification job', error);
    
    // Log failure
    try {
      const sql = getPgClient();
      await sql`
        INSERT INTO notification_logs (user_id, channel, subject, recipient, metadata, status, error_message)
        VALUES (${userId || null}, 'EMAIL', ${subject}, ${Array.isArray(to) ? to[0] : to}, ${metadata ? JSON.stringify(metadata) : null}, 'FAILED', ${error instanceof Error ? error.message : 'Unknown error'})
      `;
    } catch (dbErr) {
      logger.error('Failed to write failure log to DB', dbErr);
    }

    throw error; // Let BullMQ retry it based on backoff strategy
  }
};
