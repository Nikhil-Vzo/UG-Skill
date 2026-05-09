import mongoose from 'mongoose';

const MONGO_URI = "mongodb://localhost:27017/ugskill";

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  status: { type: String, enum: ['draft', 'review', 'published', 'archived'], required: true },
  pg_creator_id: { type: String, required: true },
  schema_version: { type: Number, required: true, default: 1 },
  category: { type: String },
  sub_category: { type: String },
  difficulty: { type: String },
  language: { type: String, default: 'english' },
  thumbnail_url: { type: String },
  is_free: { type: Boolean, default: false },
  price: { type: Number, default: 0 },
  tags: [String],
  sections: [mongoose.Schema.Types.Mixed],
  avg_rating: { type: Number },
  total_ratings: { type: Number, default: 0 },
  enrollment_count: { type: Number, default: 0 },
  lecture_count: { type: Number, default: 0 },
  total_duration_secs: { type: Number, default: 0 },
  version: { type: Number, default: 1 },
}, { timestamps: true });

const CourseModel = mongoose.model('Course', CourseSchema);

const SAMPLE_COURSES = [
  {
    title: 'Full Stack Web Development with React & Node.js',
    status: 'published',
    pg_creator_id: '86659f77-5058-45a8-9d4a-912f2c206977',
    category: 'Engineering',
    sub_category: 'Web Development',
    difficulty: 'intermediate',
    is_free: false,
    price: 49.99,
    thumbnail_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60',
    tags: ['react', 'node', 'javascript', 'web'],
    sections: [
      {
        title: 'Introduction to Modern Web',
        lectures: [
          { title: 'The Evolution of the Web', type: 'video', duration_secs: 600 },
          { title: 'Setting up your Dev Environment', type: 'video', duration_secs: 900 }
        ]
      }
    ]
  },
  {
    title: 'Data Science Bootcamp: From Zero to Hero',
    status: 'published',
    pg_creator_id: '86659f77-5058-45a8-9d4a-912f2c206977',
    category: 'Data Science',
    sub_category: 'Machine Learning',
    difficulty: 'beginner',
    is_free: true,
    price: 0,
    thumbnail_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60',
    tags: ['python', 'data science', 'ml'],
    sections: []
  },
  {
    title: 'Mastering System Design',
    status: 'draft',
    pg_creator_id: '86659f77-5058-45a8-9d4a-912f2c206977',
    category: 'Engineering',
    sub_category: 'Architecture',
    difficulty: 'advanced',
    is_free: false,
    price: 99.00,
    thumbnail_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc51?w=800&auto=format&fit=crop&q=60',
    tags: ['system design', 'scalability', 'backend'],
    sections: []
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing
    await CourseModel.deleteMany({});
    console.log('Cleared existing courses');
    
    // Insert
    await CourseModel.insertMany(SAMPLE_COURSES);
    console.log(`Successfully seeded ${SAMPLE_COURSES.length} courses`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
