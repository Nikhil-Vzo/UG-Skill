import React from 'react';
import type { Course } from '../../../store/dashboard.store';
import { AuraProgress } from '../../loaders/AuraProgress';
import { Button } from '../../ui/Button';

interface CourseCardProps {
  course: Course;
  onContinue?: (courseId: string) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onContinue }) => {
  return (
    <div className="surface-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h3 style={{ color: 'var(--on-surface)', fontSize: '1.125rem', marginBottom: '0.25rem' }}>{course.title}</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>Instructor: {course.instructor}</p>
      </div>
      
      <div style={{ margin: '0.5rem 0' }}>
        <AuraProgress progress={course.progress} size="sm" />
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
          Last active: {new Date(course.lastAccessed).toLocaleDateString()}
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onContinue?.(course.id)}
        >
          {course.progress === 0 ? 'Start' : 'Continue'}
        </Button>
      </div>
    </div>
  );
};
