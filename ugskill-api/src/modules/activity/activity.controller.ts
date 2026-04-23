import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { logger } from '../../lib/logger';
import { events, APP_EVENTS } from '../../lib/events';

export const ingestEvents = async (req: Request, res: Response) => {
  try {
    const eventList = Array.isArray(req.body) ? req.body : [req.body];
    
    // Add server-side timestamps and parse standard fields
    const enrichedEvents = eventList.map(event => ({
      ...event,
      userId: req.user?.userId || null,
      serverReceivedAt: new Date(),
    }));

    if (enrichedEvents.length > 0) {
      if (!mongoose.connection.db) throw new Error("Mongo Not Connected");
      await mongoose.connection.db.collection('activity_events').insertMany(enrichedEvents);
      logger.debug(`Ingested ${enrichedEvents.length} distinct activity events`);

      // CDC: emit ACTIVITY_COMPLETED for lecture_completion events
      // so progress_summary gets materialized in PG
      for (const event of enrichedEvents) {
        if (event.event_type === 'lecture_completion' && event.userId) {
          events.emit(APP_EVENTS.ACTIVITY_COMPLETED, {
            studentId: event.userId,
            courseId: event.course_id || event.entity_id,
            lectureId: event.entity_id,
            totalLectures: event.metadata?.total_lectures,
            watchTimeSecs: event.metadata?.watch_time_secs,
          });
        }
      }
    }

    res.status(202).json({ success: true, count: enrichedEvents.length });
  } catch (error) {
    logger.error('Failed to ingest activity events', error);
    res.status(500).json({ success: false, error: 'Failed to ingest events' });
  }
};

