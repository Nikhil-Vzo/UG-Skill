import { db } from '../config/postgres';
import { placementSessions } from './pg/schema/placement';
import { eq } from 'drizzle-orm';

async function main() {
  try {
    const id = 'cf62a22d-ebd3-4d66-ad32-178dc1c787b5';
    console.log('Resetting placement session status to scheduled...');
    const result = await db.update(placementSessions).set({ status: 'scheduled', startedAt: null }).where(eq(placementSessions.id, id)).returning();
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error during reset:', err);
  }
  process.exit(0);
}

main();
