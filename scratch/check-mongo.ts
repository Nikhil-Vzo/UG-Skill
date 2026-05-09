import mongoose from 'mongoose';

const MONGO_URI = "mongodb://localhost:27017/ugskill";

async function checkCourses() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collections = await db?.listCollections().toArray();
    console.log('Collections:', collections?.map(c => c.name));
    
    const courses = await db?.collection('courses').find({}).toArray();
    console.log('Total Courses:', courses?.length);
    if (courses && courses.length > 0) {
      console.log('First Course Title:', courses[0].title);
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCourses();
