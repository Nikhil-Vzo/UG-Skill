import { db } from '../config/postgres';
import { placementSessions } from './pg/schema/placement';

async function main() {
  try {
    const sessionsList = await db.select().from(placementSessions);
    console.log('--- PLACEMENT SESSIONS IN POSTGRES ---');
    console.log(JSON.stringify(sessionsList, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

main();
