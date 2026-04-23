import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft, ChevronRight, Play, CheckCircle,
  MessageSquare, FileText, Lightbulb, Volume2, Maximize, Settings,
  Loader2, Send, BookOpen
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/loaders/Skeleton';
import api from '../lib/api';
import { useDebounce } from '../hooks/useDebounce';

/* ─────────────── Types ─────────────── */
interface Lecture {
  _id: string;
  title: string;
  duration?: string;
  completed: boolean;
  isFree?: boolean;
  videoUrl?: string;
  description?: string;
}

interface Section {
  _id: string;
  title: string;
  lectures: Lecture[];
}

interface CourseDetail {
  _id: string;
  title: string;
  curriculum: Section[];
}

interface QAPost {
  _id: string;
  author: { fullName: string };
  body: string;
  createdAt: string;
}

interface Note {
  _id?: string;
  body: string;
  timestamp?: number; // video seconds
}

/* ─────────── Flatten curriculum to ordered lecture list ─────────── */
function flattenLectures(curriculum: Section[]): Lecture[] {
  return curriculum.flatMap(s => s.lectures);
}

/* ─────────── VideoPlayer ─────────── */
export const VideoPlayer: React.FC = () => {
  const { courseId, lectureId } = useParams<{ courseId: string; lectureId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'qa' | 'notes'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [qaInput, setQaInput] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const debouncedNote = useDebounce(noteBody, 1500);
  const noteSavedRef = useRef(false);

  /* ── Fetch course + curriculum ── */
  const { data: course, isLoading: courseLoading } = useQuery<CourseDetail>({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const res = await api.get(`/lms/courses/${courseId}`);
      return res.data.data ?? res.data;
    },
    enabled: !!courseId,
    staleTime: 120_000,
  });

  const allLectures = flattenLectures(course?.curriculum ?? []);
  const activeLectureId = lectureId ?? allLectures[0]?._id;
  const currentIndex = allLectures.findIndex(l => l._id === activeLectureId);
  const activeLecture = allLectures[currentIndex] ?? null;
  const completedCount = allLectures.filter(l => l.completed).length;

  /* ── Fetch lecture detail (video URL, description) ── */
  const { data: lecture, isLoading: lectureLoading } = useQuery<Lecture>({
    queryKey: ['lecture', courseId, activeLectureId],
    queryFn: async () => {
      const res = await api.get(`/lms/courses/${courseId}/lectures/${activeLectureId}`);
      return res.data.data ?? res.data;
    },
    enabled: !!courseId && !!activeLectureId,
    staleTime: 60_000,
    // Merge with sidebar entry while loading
    placeholderData: activeLecture ?? undefined,
  });

  /* ── Mark complete ── */
  const completeMut = useMutation({
    mutationFn: () => api.post(`/lms/courses/${courseId}/lectures/${activeLectureId}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });

  /* ── Q&A ── */
  const { data: qaPosts = [] } = useQuery<QAPost[]>({
    queryKey: ['qa', courseId, activeLectureId],
    queryFn: async () => {
      const res = await api.get(`/community/posts?lectureId=${activeLectureId}`);
      return res.data.data?.posts ?? res.data.data ?? res.data ?? [];
    },
    enabled: activeTab === 'qa' && !!activeLectureId,
    staleTime: 30_000,
  });

  const postQaMut = useMutation({
    mutationFn: (body: string) => api.post('/community/posts', { lectureId: activeLectureId, courseId, body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qa', courseId, activeLectureId] });
      setQaInput('');
    },
  });

  /* ── Notes: load on mount / lecture change ── */
  const { data: savedNote } = useQuery<Note | null>({
    queryKey: ['notes', courseId, activeLectureId],
    queryFn: async () => {
      const res = await api.get(`/lms/notes?courseId=${courseId}&lectureId=${activeLectureId}`);
      const note = res.data.data?.[0] ?? res.data?.[0] ?? null;
      return note;
    },
    enabled: activeTab === 'notes' && !!activeLectureId,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (savedNote?.body !== undefined) {
      setNoteBody(savedNote.body);
      noteSavedRef.current = true;
    }
  }, [savedNote]);

  const saveNoteMut = useMutation({
    mutationFn: (body: string) =>
      api.post('/lms/notes', { courseId, lectureId: activeLectureId, body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes', courseId, activeLectureId] }),
  });

  // Auto-save debounced note
  useEffect(() => {
    if (noteSavedRef.current) {
      noteSavedRef.current = false;
      return;
    }
    if (debouncedNote && debouncedNote !== (savedNote?.body ?? '')) {
      saveNoteMut.mutate(debouncedNote);
    }
  }, [debouncedNote]);

  /* ── Navigation helpers ── */
  const goToLecture = useCallback((id: string) => {
    navigate(`/courses/${courseId}/player/${id}`);
  }, [courseId, navigate]);

  const goPrev = () => {
    if (currentIndex > 0) goToLecture(allLectures[currentIndex - 1]._id);
  };

  const goNext = () => {
    if (currentIndex < allLectures.length - 1) goToLecture(allLectures[currentIndex + 1]._id);
  };

  const TABS: { id: typeof activeTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Lightbulb size={15} /> },
    { id: 'qa', label: 'Q&A', icon: <MessageSquare size={15} /> },
    { id: 'notes', label: 'My Notes', icon: <FileText size={15} /> },
  ];

  const courseTitle = course?.title ?? 'Loading...';
  const activeTitle = lecture?.title ?? activeLecture?.title ?? '';

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', overflow: 'hidden', background: 'var(--surface-root)' }}>
      {/* ── Top Bar ── */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', height: '52px', background: 'var(--surface-container)', borderBottom: '1px solid var(--surface-highest)', flexShrink: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
          <button onClick={() => navigate(`/courses/${courseId}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-low)', display: 'flex', flexShrink: 0 }}>
            <ChevronLeft size={20} />
          </button>
          {courseLoading ? (
            <Skeleton variant="text" width="200px" />
          ) : (
            <>
              <span style={{ color: 'var(--text-high)', fontWeight: 600, fontSize: '0.9375rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>{courseTitle}</span>
              {activeTitle && <span style={{ color: 'var(--text-lowest)', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>/ {activeTitle}</span>}
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          {!courseLoading && (
            <Badge variant="success" size="sm">{completedCount} / {allLectures.length} complete</Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? 'Hide' : 'Show'} Curriculum
          </Button>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ─── Left: Video + Tabs ─── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          {/* Video Frame */}
          <div style={{ background: '#000', aspectRatio: '16/9', width: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', maxHeight: '60vh' }}>
            {lecture?.videoUrl ? (
              <video
                key={lecture.videoUrl}
                src={lecture.videoUrl}
                controls
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onEnded={() => {
                  if (!activeLecture?.completed) completeMut.mutate();
                }}
              />
            ) : (
              <>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0a0a1a 0%, #0d0d2b 50%, #0a0a1a 100%)' }} />
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  {lectureLoading ? (
                    <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-glow)' }} />
                  ) : (
                    <>
                      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(99,102,241,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(99,102,241,0.5)', cursor: 'default' }}>
                        <Play size={28} color="white" fill="white" />
                      </div>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>{activeTitle || 'Select a lecture'}</span>
                    </>
                  )}
                </div>
                {/* Fake controls bar for non-video UI */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1rem', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Play size={18} color="white" />
                  <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                    <div style={{ width: '0%', height: '100%', background: 'var(--primary-glow)', borderRadius: 2 }} />
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>0:00 / {activeLecture?.duration ?? '--'}</span>
                  <Volume2 size={16} color="rgba(255,255,255,0.7)" />
                  <Settings size={16} color="rgba(255,255,255,0.7)" />
                  <Maximize size={16} color="rgba(255,255,255,0.7)" />
                </div>
              </>
            )}
          </div>

          {/* Mark Complete bar */}
          {activeLecture && !activeLecture.completed && (
            <div style={{ padding: '0.75rem 1.5rem', background: 'var(--surface-container)', borderBottom: '1px solid var(--surface-highest)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-low)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={15} /> Mark this lecture as complete when done
              </span>
              <Button
                variant="primary"
                size="sm"
                isLoading={completeMut.isPending}
                onClick={() => completeMut.mutate()}
                leftIcon={<CheckCircle size={14} />}
              >
                Mark Complete
              </Button>
            </div>
          )}

          {/* Tabs */}
          <div style={{ margin: '0 1.5rem 1.5rem', flexShrink: 0 }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--surface-highest)', marginBottom: '1.25rem', gap: '0.25rem' }}>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer',
                    borderBottom: activeTab === tab.id ? '2px solid var(--primary-glow)' : '2px solid transparent',
                    color: activeTab === tab.id ? 'var(--primary-glow)' : 'var(--text-low)',
                    fontWeight: activeTab === tab.id ? 600 : 400, fontSize: '0.875rem',
                    marginBottom: '-1px', transition: 'all 0.15s',
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div style={{ color: 'var(--text-medium)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
                {lectureLoading ? (
                  <>
                    <Skeleton variant="text" width="50%" height="22px" className="mb-4" />
                    <Skeleton variant="text" width="90%" />
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="70%" />
                  </>
                ) : (
                  <>
                    <h3 style={{ color: 'var(--text-high)', marginBottom: '0.75rem' }}>{activeTitle}</h3>
                    <p>{lecture?.description ?? 'No description available for this lecture.'}</p>
                  </>
                )}
              </div>
            )}

            {/* Q&A Tab */}
            {activeTab === 'qa' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {qaPosts.length === 0 ? (
                  <p style={{ color: 'var(--text-lowest)', fontSize: '0.875rem', padding: '1rem 0' }}>No questions yet. Be the first to ask!</p>
                ) : (
                  qaPosts.map(post => (
                    <div key={post._id} className="surface-well" style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-glow)', fontWeight: 700, flexShrink: 0, fontSize: '0.875rem' }}>
                          {post.author.fullName[0]}
                        </div>
                        <div>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span style={{ color: 'var(--text-high)', fontWeight: 600, fontSize: '0.875rem' }}>{post.author.fullName}</span>
                            <span style={{ color: 'var(--text-lowest)', fontSize: '0.75rem' }}>{new Date(post.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                          </div>
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-medium)', margin: 0 }}>{post.body}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <textarea
                    placeholder="Ask the instructor or community..."
                    value={qaInput}
                    onChange={e => setQaInput(e.target.value)}
                    style={{ flex: 1, minHeight: 80, background: 'var(--surface-well)', border: '1px solid var(--surface-highest)', color: 'var(--text-high)', padding: '0.75rem', fontSize: '0.875rem', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={postQaMut.isPending}
                    disabled={!qaInput.trim()}
                    onClick={() => postQaMut.mutate(qaInput.trim())}
                    style={{ alignSelf: 'flex-end' }}
                    leftIcon={<Send size={14} />}
                  >
                    Post
                  </Button>
                </div>
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ color: 'var(--text-low)', fontSize: '0.8125rem' }}>
                  Notes are auto-saved as you type.
                  {saveNoteMut.isPending && <span style={{ color: 'var(--primary-glow)', marginLeft: '0.5rem' }}>Saving...</span>}
                  {saveNoteMut.isSuccess && !saveNoteMut.isPending && <span style={{ color: 'var(--success)', marginLeft: '0.5rem' }}>Saved ✓</span>}
                </p>
                <textarea
                  placeholder="Write your personal notes here..."
                  value={noteBody}
                  onChange={e => { setNoteBody(e.target.value); noteSavedRef.current = false; }}
                  style={{ width: '100%', minHeight: 160, background: 'var(--surface-well)', border: '1px solid var(--surface-highest)', color: 'var(--text-high)', padding: '0.75rem', fontSize: '0.9375rem', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ─── Right: Curriculum Sidebar ─── */}
        {sidebarOpen && (
          <aside style={{ width: 320, flexShrink: 0, borderLeft: '1px solid var(--surface-highest)', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--surface-container)' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--surface-highest)', flexShrink: 0 }}>
              <h2 style={{ color: 'var(--text-high)', fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>Curriculum</h2>
              {!courseLoading && <p style={{ color: 'var(--text-low)', fontSize: '0.75rem', marginTop: '0.25rem', margin: '0.25rem 0 0' }}>{course?.curriculum?.length ?? 0} module{(course?.curriculum?.length ?? 0) !== 1 ? 's' : ''}</p>}
            </div>
            <ul style={{ flex: 1, overflowY: 'auto', listStyle: 'none', padding: 0, margin: 0 }}>
              {courseLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <li key={i} style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--surface-highest)' }}>
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="40%" />
                  </li>
                ))
              ) : (
                (course?.curriculum ?? []).map(section => (
                  <React.Fragment key={section._id}>
                    <li style={{ padding: '0.5rem 1.25rem', background: 'var(--surface-container-high)', borderBottom: '1px solid var(--surface-highest)' }}>
                      <span style={{ color: 'var(--text-lowest)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>{section.title}</span>
                    </li>
                    {section.lectures.map((lec, i) => (
                      <li key={lec._id}>
                        <button
                          onClick={() => goToLecture(lec._id)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.875rem 1.25rem',
                            background: activeLectureId === lec._id ? 'var(--primary-low)' : 'none',
                            border: 'none', borderBottom: '1px solid var(--surface-highest)',
                            cursor: 'pointer', textAlign: 'left',
                            borderLeft: activeLectureId === lec._id ? '3px solid var(--primary-glow)' : '3px solid transparent',
                          }}
                        >
                          <div style={{ flexShrink: 0, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {lec.completed ? (
                              <CheckCircle size={18} color="var(--success)" />
                            ) : activeLectureId === lec._id ? (
                              <Play size={16} color="var(--primary-glow)" fill="var(--primary-glow)" />
                            ) : (
                              <span style={{ width: 18, height: 18, border: '2px solid var(--surface-highest)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', color: 'var(--text-lowest)', fontWeight: 700 }}>{i + 1}</span>
                            )}
                          </div>
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <p style={{ color: activeLectureId === lec._id ? 'var(--primary-glow)' : lec.completed ? 'var(--text-medium)' : 'var(--text-low)', fontSize: '0.8125rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                              {lec.title}
                            </p>
                            <span style={{ color: 'var(--text-lowest)', fontSize: '0.6875rem' }}>{lec.duration ?? ''}</span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </React.Fragment>
                ))
              )}
            </ul>
            <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--surface-highest)', display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              <Button variant="ghost" size="sm" style={{ flex: 1 }} leftIcon={<ChevronLeft size={14} />} disabled={currentIndex <= 0} onClick={goPrev}>Prev</Button>
              <Button variant="primary" size="sm" style={{ flex: 1 }} rightIcon={<ChevronRight size={14} />} disabled={currentIndex >= allLectures.length - 1 || currentIndex < 0} onClick={goNext}>Next</Button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
