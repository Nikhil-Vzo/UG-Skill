import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronDown, ChevronRight, Star, Clock, Users, BookOpen, Play,
  Award, CheckCircle, Lock, ArrowLeft, Loader2, AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/loaders/Skeleton';
import api from '../lib/api';

/* ─────────────────────── Types ─────────────────────── */
interface Lecture {
  _id: string;
  title: string;
  duration?: string;
  isFree?: boolean;
}

interface Section {
  _id: string;
  title: string;
  duration?: string;
  lectures: Lecture[];
}

interface CourseDetail {
  _id: string;
  title: string;
  subtitle?: string;
  instructor: { fullName: string; title?: string; _id: string } | string;
  rating?: number;
  reviewsCount?: number;
  studentsCount?: number;
  durationWeeks?: number;
  level?: string;
  category?: string;
  tags?: string[];
  lastUpdated?: string;
  isEnrolled?: boolean;
  whatYouLearn?: string[];
  curriculum?: Section[];
  thumbnailUrl?: string;
}

/* ──────────────── Accordion Section ──────────────── */
const CurriculumSection: React.FC<{ section: Section; enrolled: boolean; courseId: string }> = ({ section, enrolled, courseId }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="surface-well" style={{ overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-high)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {open ? <ChevronDown size={18} color="var(--primary-glow)" /> : <ChevronRight size={18} color="var(--text-low)" />}
          <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{section.title}</span>
        </div>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-low)', flexShrink: 0 }}>
          {section.lectures.length} lectures{section.duration ? ` · ${section.duration}` : ''}
        </span>
      </button>
      {open && (
        <ul style={{ borderTop: '1px solid var(--surface-highest)', margin: 0, padding: 0, listStyle: 'none' }}>
          {section.lectures.map(lec => (
            <li
              key={lec._id}
              style={{ padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--surface-highest)', cursor: (lec.isFree || enrolled) ? 'pointer' : 'default' }}
              onClick={() => {
                if (lec.isFree || enrolled) {
                  navigate(`/courses/${courseId}/player/${lec._id}`);
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {lec.isFree || enrolled ? (
                  <Play size={14} color="var(--success)" />
                ) : (
                  <Lock size={14} color="var(--text-lowest)" />
                )}
                <span style={{ fontSize: '0.875rem', color: (lec.isFree || enrolled) ? 'var(--text-high)' : 'var(--text-low)' }}>{lec.title}</span>
                {lec.isFree && <Badge variant="success" size="sm">Preview</Badge>}
              </div>
              {lec.duration && <span style={{ fontSize: '0.8125rem', color: 'var(--text-low)', flexShrink: 0 }}>{lec.duration}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* ──────────────────────── Skeleton Loader ──────────────────────── */
const CourseLandingSkeleton: React.FC = () => (
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
    <Skeleton variant="text" width="100px" height="20px" className="mb-6" />
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2.5rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Skeleton variant="text" width="60%" height="40px" />
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="rectangular" height={180} />
        <Skeleton variant="rectangular" height={240} />
      </div>
      <Skeleton variant="rectangular" height={400} />
    </div>
  </div>
);

/* ──────────────────────── Main Page ────────────────────────────── */
export const CourseLanding: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: course, isLoading, isError } = useQuery<CourseDetail>({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const res = await api.get(`/lms/courses/${courseId}`);
      return res.data.data ?? res.data;
    },
    enabled: !!courseId,
  });

  const enrollMut = useMutation({
    mutationFn: () => api.post('/lms/enrollments', { 
      enrollableType: 'course', 
      enrollableId: courseId,
      source: 'self'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      navigate(`/app/courses/${courseId}/player`);
    },
    onError: (error: any) => {
      // If the student is already enrolled, just send them to the player
      const msg: string = error?.response?.data?.error?.message || '';
      if (
        msg.toLowerCase().includes('already enrolled') ||
        error?.response?.status === 400
      ) {
        navigate(`/app/courses/${courseId}/player`);
      }
    },
  });

  if (isLoading) return <CourseLandingSkeleton />;

  if (isError || !course) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <AlertCircle size={48} color="var(--error)" style={{ marginBottom: '1rem' }} />
        <h2 style={{ color: 'var(--text-high)', marginBottom: '0.5rem' }}>Course Not Found</h2>
        <p style={{ color: 'var(--text-low)', marginBottom: '1.5rem' }}>Unable to load this course. Please check connectivity or try again.</p>
        <Button variant="outline" onClick={() => navigate(-1)} leftIcon={<ArrowLeft size={16} />}>Go Back</Button>
      </div>
    );
  }

  const instructorName = typeof course.instructor === 'string' ? course.instructor : course.instructor?.fullName ?? 'UGSkill Faculty';
  const instructorTitle = typeof course.instructor === 'string' ? '' : course.instructor?.title ?? '';
  const isEnrolled = course.isEnrolled ?? false;

  // Normalize MongoDB snake_case fields to what the UI expects
  const thumbnailUrl = (course as any).thumbnail_url || course.thumbnailUrl;
  const curriculum: Section[] = (course as any).sections?.map((s: any) => ({
    _id: s._id?.toString() || String(Math.random()),
    title: s.title,
    duration: s.duration,
    lectures: (s.lectures || []).map((l: any) => ({
      _id: l._id?.toString() || String(Math.random()),
      title: l.title,
      duration: l.duration,
      isFree: l.is_free ?? l.isFree ?? false,
    })),
  })) ?? course.curriculum ?? [];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--text-low)', cursor: 'pointer', marginBottom: '1.5rem', fontSize: '0.875rem' }}
      >
        <ArrowLeft size={16} /> Back to Catalog
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2.5rem', alignItems: 'start' }}>
        {/* ─── Left Column ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Hero */}
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {course.category && <Badge variant="primary">{course.category}</Badge>}
              {course.level && <Badge variant="default">{course.level}</Badge>}
              {(course.tags ?? []).map(t => <Badge key={t} variant="outline" size="sm">{t}</Badge>)}
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', color: 'var(--text-high)', lineHeight: 1.2, marginBottom: '0.75rem' }}>
              {course.title}
            </h1>
            {course.subtitle && <p style={{ color: 'var(--text-low)', fontSize: '1.125rem', marginBottom: '1.5rem' }}>{course.subtitle}</p>}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--text-low)' }}>
              {course.rating != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Star size={15} fill="var(--primary-glow)" color="var(--primary-glow)" />
                  <strong style={{ color: 'var(--text-high)' }}>{course.rating.toFixed(1)}</strong>
                  {course.reviewsCount != null && <span>({course.reviewsCount.toLocaleString()} reviews)</span>}
                </div>
              )}
              {course.studentsCount != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Users size={15} /><span>{course.studentsCount.toLocaleString()} enrolled</span>
                </div>
              )}
              {course.durationWeeks != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={15} /><span>{course.durationWeeks} Weeks</span>
                </div>
              )}
              {course.lastUpdated && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <BookOpen size={15} /><span>Updated {course.lastUpdated}</span>
                </div>
              )}
            </div>
          </div>

          {/* What You'll Learn */}
          {(course.whatYouLearn ?? []).length > 0 && (
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h2 style={{ color: 'var(--text-high)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', fontFamily: 'var(--font-display)' }}>
                <Award size={20} color="var(--primary-glow)" /> Cognitive Outcomes
              </h2>
              <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
                {course.whatYouLearn!.map((item, i) => (
                  <li key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.875rem', color: 'var(--text-medium)' }}>
                    <CheckCircle size={15} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Curriculum */}
          {curriculum.length > 0 && (
            <div>
              <h2 style={{ color: 'var(--text-high)', marginBottom: '1rem', fontSize: '1.125rem', fontFamily: 'var(--font-display)' }}>
                Curriculum Architecture
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {curriculum.map(s => (
                  <CurriculumSection key={s._id} section={s} enrolled={isEnrolled} courseId={courseId!} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── Right Column — Sticky Enroll Card ─── */}
        <aside style={{ position: 'sticky', top: '5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Preview Thumbnail */}
            <div style={{
              height: '180px',
              background: thumbnailUrl ? `url(${thumbnailUrl}) center/cover` : 'var(--surface-highest)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden',
              border: '1px solid var(--surface-highest)'
            }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 50%, rgba(99,102,241,0.2) 0%, transparent 70%)' }} />
              <div
                style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 30px rgba(99,102,241,0.4)', position: 'relative' }}
                onClick={() => navigate(`/courses/${courseId}/player`)}
              >
                <Play size={24} color="white" fill="white" />
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-low)', fontSize: '0.75rem', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Enterprise Access</p>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-high)', fontFamily: 'var(--font-display)' }}>FREE</span>
              <p style={{ color: 'var(--primary-glow)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>Included in your institutional plan</p>
            </div>

            {isEnrolled ? (
              <Button
                variant="primary"
                fullWidth
                size="lg"
                onClick={() => navigate(`/courses/${courseId}/player`)}
                leftIcon={<Play size={18} />}
              >
                Continue Learning
              </Button>
            ) : (
              <Button
                variant="primary"
                fullWidth
                size="lg"
                isLoading={enrollMut.isPending}
                onClick={() => enrollMut.mutate()}
                leftIcon={enrollMut.isPending ? <Loader2 size={18} /> : <BookOpen size={18} />}
              >
                Enroll &amp; Begin Training
              </Button>
            )}

            {enrollMut.isError && (
              <p style={{ color: 'var(--error)', fontSize: '0.8125rem', textAlign: 'center' }}>Enrollment failed. Please try again.</p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--surface-highest)' }}>
              {['Full lifetime access', 'Certificate of completion', 'AI-powered study assistance', 'Downloadable resources'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-low)' }}>
                  <CheckCircle size={13} color="var(--success)" /> {f}
                </div>
              ))}
            </div>

            {/* Instructor */}
            <div className="surface-well" style={{ padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary-glow)', flexShrink: 0 }}>
                {instructorName[0]}
              </div>
              <div>
                <div style={{ color: 'var(--text-high)', fontWeight: 600, fontSize: '0.9375rem' }}>{instructorName}</div>
                {instructorTitle && <div style={{ color: 'var(--text-low)', fontSize: '0.75rem' }}>{instructorTitle}</div>}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
