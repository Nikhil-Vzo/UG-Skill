import React from 'react';
import type { Course } from '../../../store/dashboard.store';
import { AuraProgress } from '../../loaders/AuraProgress';
import { Button } from '../../ui/Button';

interface CourseCardProps {
  course: Course;
  onContinue?: (courseId: string) => void;
  viewMode?: 'grid' | 'list';
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onContinue, viewMode = 'grid' }) => {
  if (viewMode === 'list') {
    return (
      <div className="course-card-list surface-card">
        <div className="course-card-list__thumbnail">
          {course.thumbnail ? (
            <img src={course.thumbnail} alt={course.title} />
          ) : (
            <div className="course-card-list__thumb-placeholder" />
          )}
        </div>
        <div className="course-card-list__body">
          <div className="course-card-list__info">
            <h3 className="course-card-list__title">{course.title}</h3>
            <p className="course-card-list__instructor">by {course.instructor}</p>
          </div>
          <div className="course-card-list__footer">
            <div className="course-card-list__progress">
              <AuraProgress progress={course.progress} size="sm" />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onContinue?.(course.id)}
            >
              {course.progress === 0 ? 'Start' : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Grid mode (default)
  return (
    <div className="course-card-grid surface-card">
      <div>
        <h3 className="course-card-grid__title">{course.title}</h3>
        <p className="course-card-grid__instructor">Instructor: {course.instructor}</p>
      </div>
      
      <div style={{ margin: '0.5rem 0' }}>
        <AuraProgress progress={course.progress} size="sm" />
      </div>
      
      <div className="course-card-grid__footer">
        <span className="course-card-grid__meta">
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
