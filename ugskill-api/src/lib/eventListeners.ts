import { events, APP_EVENTS } from './events';
import { cdcSyncQueue } from '../config/queue';
import { logger } from './logger';

export const registerEventListeners = () => {
  logger.info('Registering application event listeners...');

  // Catch-all CDC events wrapper
  const handleCdcEvent = async (eventType: string, payload: any) => {
    try {
      if (!cdcSyncQueue) {
        logger.debug(`CDC sync queue is disabled; skipping sync for ${eventType}`);
        return;
      }
      await cdcSyncQueue.add(eventType, {
        eventType,
        payload,
        timestamp: new Date().toISOString()
      }, {
        // Debounce if needed, or straight pass-through
        removeOnComplete: true,
      });
      logger.debug(`Queued CDC sync for ${eventType}`);
    } catch (error) {
      logger.error(`Failed to queue CDC job for ${eventType}`, error);
    }
  };

  // Bind specific events
  events.on(APP_EVENTS.COURSE_CREATED, (payload) => handleCdcEvent(APP_EVENTS.COURSE_CREATED, payload));
  events.on(APP_EVENTS.COURSE_UPDATED, (payload) => handleCdcEvent(APP_EVENTS.COURSE_UPDATED, payload));
  events.on(APP_EVENTS.ROADMAP_CREATED, (payload) => handleCdcEvent(APP_EVENTS.ROADMAP_CREATED, payload));
  events.on(APP_EVENTS.ROADMAP_UPDATED, (payload) => handleCdcEvent(APP_EVENTS.ROADMAP_UPDATED, payload));
  events.on(APP_EVENTS.USER_REGISTERED, (payload) => handleCdcEvent(APP_EVENTS.USER_REGISTERED, payload));
  events.on(APP_EVENTS.USER_UPDATED, (payload) => handleCdcEvent(APP_EVENTS.USER_UPDATED, payload));
  events.on(APP_EVENTS.JOB_POSTED, (payload) => handleCdcEvent(APP_EVENTS.JOB_POSTED, payload));
  events.on(APP_EVENTS.EXAM_SUBMITTED, (payload) => handleCdcEvent(APP_EVENTS.EXAM_SUBMITTED, payload));
  events.on(APP_EVENTS.ACTIVITY_COMPLETED, (payload) => handleCdcEvent(APP_EVENTS.ACTIVITY_COMPLETED, payload));
  events.on(APP_EVENTS.MOCK_SCORED, (payload) => handleCdcEvent(APP_EVENTS.MOCK_SCORED, payload));
  events.on(APP_EVENTS.GD_SCORED, (payload) => handleCdcEvent(APP_EVENTS.GD_SCORED, payload));
};
