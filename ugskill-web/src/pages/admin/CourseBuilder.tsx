import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, GripVertical, FileVideo, FileText, Settings, Save, AlertCircle, Loader } from 'lucide-react';
import api from '../../lib/api';

/* ---------- types ---------- */
interface Lecture {
  id: string;
  title: string;
  type: 'video' | 'reading' | 'quiz';
  duration?: string;
  videoUrl?: string;
}

interface Section {
  id: string;
  title: string;
  lectures: Lecture[];
}

interface CourseDetails {
  id: string;
  title: string;
  sections: Section[];
}

/* ---------- fetchers ---------- */
const fetchCourse = async (courseId: string): Promise<CourseDetails> => {
  const { data } = await api.get(`/lms/courses/${courseId}`);
  return data.data;
};

const saveCurriculum = async ({ courseId, sections }: { courseId: string; sections: Section[] }) => {
  const { data } = await api.put(`/lms/courses/${courseId}/sections`, { sections });
  return data;
};

const publishCourse = async (courseId: string) => {
  const { data } = await api.patch(`/lms/courses/${courseId}`, { status: 'published' });
  return data;
};

/* ---------- icon helper ---------- */
const LectureIcon = ({ type }: { type: string }) => {
  if (type === 'video') return <FileVideo size={18} color="var(--primary)" />;
  return <FileText size={18} color="var(--text-muted)" />;
};

/* ---------- component ---------- */
export const CourseBuilder: React.FC = () => {
  const { courseId } = useParams<{ courseId?: string }>();
  const navigate = useNavigate();

  // If no courseId route param, show empty builder (new course)
  const isNew = !courseId;

  const { data: course, isPending, isError } = useQuery<CourseDetails>({
    queryKey: ['course-builder', courseId],
    queryFn: () => fetchCourse(courseId!),
    enabled: !!courseId,
  });

  const [localSections, setLocalSections] = useState<Section[]>([]);
  const sections = course?.sections ?? localSections;

  const saveMutation = useMutation({
    mutationFn: () => saveCurriculum({ courseId: courseId!, sections }),
    onSuccess: () => alert('Curriculum saved!'),
  });

  const publishMutation = useMutation({
    mutationFn: () => publishCourse(courseId!),
    onSuccess: () => navigate('/admin/courses'),
  });

  const addModule = () => {
    const newSec: Section = { id: `new_${Date.now()}`, title: 'New Module', lectures: [] };
    setLocalSections((s) => [...s, newSec]);
  };

  const addLecture = (sectionId: string) => {
    const newLec: Lecture = { id: `lec_${Date.now()}`, title: 'New Lesson', type: 'video' };
    setLocalSections((prev) => {
      const base = course?.sections ?? prev;
      return base.map((s) =>
        s.id === sectionId ? { ...s, lectures: [...s.lectures, newLec] } : s
      );
    });
  };

  /* Loading */
  if (!isNew && isPending) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem', color: 'var(--text-secondary)' }}>
        <Loader size={24} style={{ animation: 'spin 0.8s linear infinite' }} />
        Loading course…
      </div>
    );
  }

  /* Error */
  if (!isNew && isError) {
    return (
      <div style={{ padding: '2rem' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--error)' }}>
            <AlertCircle size={20} />
            <span>Failed to load course. Check the course ID.</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '2rem' }}>
            {isNew ? 'New Course' : (course?.title ?? 'Course Builder')}
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            {isNew ? 'Design and organize your curriculum.' : `${sections.length} module(s) · ${sections.reduce((a, s) => a + s.lectures.length, 0)} lecture(s)`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button variant="outline" leftIcon={<Settings size={18} />}>Settings</Button>
          {!isNew && (
            <>
              <Button
                variant="outline"
                leftIcon={<Save size={18} />}
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
              <Button
                variant="primary"
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
              >
                {publishMutation.isPending ? 'Publishing…' : 'Publish Course'}
              </Button>
            </>
          )}
        </div>
      </header>

      {isNew && (
        <Card>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            To build a course curriculum, first create the course via the API or the course creation form, then navigate to <code style={{ background: 'var(--surface)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>/admin/courses/:courseId/builder</code>.
          </p>
          <Button onClick={() => navigate('/admin/courses/new')}>Create New Course</Button>
        </Card>
      )}

      {/* Curriculum */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {sections.map((mod) => (
          <Card key={mod.id}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <GripVertical size={20} color="var(--text-muted)" style={{ cursor: 'grab' }} />
                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{mod.title}</h3>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({mod.lectures.length} lessons)</span>
              </div>
              <Button variant="outline" size="sm">Edit</Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '2rem' }}>
              {mod.lectures.map((item) => (
                <div
                  key={item.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--surface)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <GripVertical size={16} color="var(--text-muted)" style={{ cursor: 'grab' }} />
                    <LectureIcon type={item.type} />
                    <span style={{ color: 'var(--text-primary)' }}>{item.title}</span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{item.duration ?? '—'}</span>
                </div>
              ))}

              <Button
                variant="ghost"
                leftIcon={<Plus size={16} />}
                style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}
                onClick={() => addLecture(mod.id)}
              >
                Add Lesson
              </Button>
            </div>
          </Card>
        ))}

        <Button
          variant="outline"
          size="lg"
          leftIcon={<Plus size={20} />}
          style={{ marginTop: '0.5rem' }}
          onClick={addModule}
        >
          Add Module
        </Button>
      </div>
    </div>
  );
};
