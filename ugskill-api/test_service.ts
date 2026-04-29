import mongoose from 'mongoose';
import { enrollmentService } from './src/modules/enrollment/enrollment.service';
import { connectMongo } from './src/config/mongodb';
import { env } from './src/config/env';

async function test() {
  await connectMongo();
  try {
    await enrollmentService.enroll('dummyStudentId', {
      enrollableType: 'course',
      enrollableId: '69f2659e63149b2e7fd65b9a',
      source: 'self'
    });
    console.log('SUCCESS');
  } catch (err: any) {
    console.error('ERROR THROWN:', err.statusCode, err.message);
  }
  process.exit(0);
}

test();
