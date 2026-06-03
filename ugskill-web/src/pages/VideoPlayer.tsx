import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft, ChevronRight, Play, CheckCircle, Bookmark, BookmarkCheck,
  MessageSquare, FileText, Lightbulb, Volume2, Maximize, Minimize, Settings,
  Loader2, Send, BookOpen, ExternalLink, Download, AlignLeft, Link as LinkIcon,
  Keyboard, Clock, MoreVertical, X, RotateCcw, FastForward, Rewind, AlertCircle,
  FileVideo, Globe, Sparkles, Bot
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/loaders/Skeleton';
import api from '../lib/api';
import { useDebounce } from '../hooks/useDebounce';
import './VideoPlayer.css';

/* ─── Embed URL helpers ─── */
function getYouTubeEmbed(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0&modestbranding=1` : null;
}
function getVimeoEmbed(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? `https://player.vimeo.com/video/${m[1]}` : null;
}

/* ─────────────── Types ─────────────── */
interface Lecture {
  _id: string;
  title: string;
  duration?: string;
  completed: boolean;
  isFree?: boolean;
  type?: 'video' | 'document' | 'external_link' | 'text' | 'pdf' | 'article' | 'youtube';
  videoUrl?: string;
  video_url?: string;
  document_url?: string;
  external_url?: string;
  content?: string;
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

  const [activeTab, setActiveTab] = useState<'overview' | 'qa' | 'notes' | 'bookmarks' | 'ai'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [qaInput, setQaInput] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [bookmarks, setBookmarks] = useState<{timestamp: number; note: string}[]>([]);
  // AI Tutor state
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);
  const debouncedNote = useDebounce(noteBody, 1500);
  const noteSavedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Fetch course + curriculum ── */
  const { data: course, isLoading: courseLoading, isError: courseError } = useQuery<CourseDetail>({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const res = await api.get(`/lms/courses/${courseId}`);
      const raw = res.data.data ?? res.data;

      // Normalize MongoDB snake_case sections → curriculum with camelCase lecture fields
      const sections: any[] = raw.sections ?? raw.curriculum ?? [];
      const curriculum: Section[] = sections.map((s: any) => ({
        _id: s._id?.toString() || s.id || String(Math.random()),
        title: s.title ?? 'Untitled Section',
        lectures: (s.lectures ?? []).map((l: any) => ({
          ...l,
          _id: l._id?.toString() || l.id || String(Math.random()),
          title: l.title ?? 'Untitled Lecture',
          completed: l.completed ?? false,
          isFree: l.is_free_preview ?? l.is_preview ?? l.is_free ?? l.isFree ?? false,
          type: l.content_type ?? l.type ?? 'video',
          videoUrl: l.video_url ?? l.videoUrl ?? l.content_url,
          video_url: l.video_url ?? l.videoUrl ?? l.content_url,
          document_url: l.document_url ?? l.documentUrl ?? l.content_url,
          external_url: l.external_url ?? l.externalUrl ?? l.content_url,
          content: l.content,
        })),
      }));

      return { ...raw, curriculum };
    },
    enabled: !!courseId,
    staleTime: 120_000,
  });

  /* ── Fetch progress (summary + completed lecture IDs) ── */
  const { data: progressPayload } = useQuery<{ completedLectureIds?: string[]; progressPercent?: number } | null>({
    queryKey: ['progress', courseId],
    queryFn: async () => {
      try {
        const res = await api.get(`/lms/courses/${courseId}/progress`);
        return res.data.data ?? res.data ?? null;
      } catch {
        return null;
      }
    },
    enabled: !!courseId,
    staleTime: 30_000,
  });

  const completedIds: string[] = progressPayload?.completedLectureIds ?? [];

  // Merge Postgres-sourced completed state into lectures
  const allLectures = flattenLectures(course?.curriculum ?? []).map(l => ({
    ...l,
    completed: l.completed || completedIds.includes(l._id),
  }));
  const activeLectureId = lectureId ?? allLectures[0]?._id;
  const currentIndex = allLectures.findIndex(l => l._id === activeLectureId);
  const activeLecture = allLectures[currentIndex] ?? null;
  const completedCount = allLectures.filter(l => l.completed).length;

  // Lecture detail is already embedded in the course sections — no separate API call needed.
  // The GET /lectures/:id endpoint doesn't exist; all data comes from MongoDB sections.
  const lecture: Lecture | null = activeLecture;
  const lectureLoading = courseLoading;

  /* ── Mark complete ── */
  const completeMut = useMutation({
    mutationFn: () => api.post(`/lms/courses/${courseId}/lectures/${activeLectureId}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['progress', courseId] });
    },
  });

  /* ── Auto-complete non-video lectures after 5 seconds of viewing ── */
  useEffect(() => {
    if (!activeLecture || activeLecture.completed || completeMut.isPending) return;
    const type = activeLecture.type ?? 'video';
    if (type === 'video') return; // video auto-completes on onEnded
    const timer = setTimeout(() => {
      completeMut.mutate();
    }, 5000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLectureId]); // Re-trigger whenever lecture changes

  /* ── Q&A ── */
  const { data: qaPosts = [] } = useQuery<QAPost[]>({
    queryKey: ['qa', courseId, activeLectureId],
    queryFn: async () => {
      const res = await api.get(`/community/posts?lectureId=${activeLectureId}`);
      const payload = res.data.data?.posts ?? res.data.data ?? res.data ?? [];
      return Array.isArray(payload) ? payload : [];
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
      const payload = res.data.data ?? res.data;
      const note = Array.isArray(payload) ? payload[0] ?? null : payload?.body ? payload : null;
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

  /* ── Bookmarks: load on mount / lecture change ── */
  const { data: savedBookmarks } = useQuery<{timestamp: number; note: string}[]>({
    queryKey: ['bookmarks', courseId, activeLectureId],
    queryFn: async () => {
      const res = await api.get(`/courses/${courseId}/bookmarks/${activeLectureId}`);
      return res.data.data ?? res.data ?? [];
    },
    enabled: !!courseId && !!activeLectureId,
    staleTime: 60_000,
  });

  const saveBookmarksMut = useMutation({
    mutationFn: (newBookmarks: {timestamp: number; note: string}[]) =>
      api.post(`/courses/${courseId}/bookmarks/${activeLectureId}`, { bookmarks: newBookmarks }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks', courseId, activeLectureId] }),
  });

  useEffect(() => {
    if (savedBookmarks) {
      setBookmarks(savedBookmarks);
    }
  }, [savedBookmarks]);

  const debouncedBookmarks = useDebounce(bookmarks, 1500);
  const initialBookmarksLoaded = useRef(false);

  useEffect(() => {
    if (!initialBookmarksLoaded.current && savedBookmarks) {
      initialBookmarksLoaded.current = true;
      return;
    }
    if (initialBookmarksLoaded.current && JSON.stringify(debouncedBookmarks) !== JSON.stringify(savedBookmarks ?? [])) {
      saveBookmarksMut.mutate(debouncedBookmarks);
    }
  }, [debouncedBookmarks]);

  /* ── Navigation helpers ── */
  const goToLecture = useCallback((id: string) => {
    navigate(`/app/courses/${courseId}/player/${id}`);
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
    { id: 'bookmarks', label: 'Bookmarks', icon: <Bookmark size={15} /> },
    { id: 'ai', label: 'AI Tutor', icon: <Sparkles size={15} /> },
  ];

  /* ── AI Tutor send ── */
  const sendAiMessage = async () => {
    const msg = aiInput.trim();
    if (!msg || aiLoading) return;
    setAiInput('');
    setAiError(null);
    setAiMessages(prev => [...prev, { role: 'user', text: msg }]);
    setAiLoading(true);
    setTimeout(() => aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    try {
      const res = await api.post('/ai/chat', {
        message: msg,
        context: { lectureTitle: activeTitle, courseId },
      });
      const reply: string =
        res.data?.data?.reply ??
        res.data?.reply ??
        res.data?.message ??
        'I received your question but couldn\'t generate a response.';
      setAiMessages(prev => [...prev, { role: 'ai', text: reply }]);
    } catch {
      setAiError('AI Tutor is not available right now. Please try again later.');
    } finally {
      setAiLoading(false);
      setTimeout(() => aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      const video = videoRef.current;
      
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          video.paused ? video.play() : video.pause();
          break;
        case 'arrowright':
        case 'l':
          video.currentTime = Math.min(video.duration, video.currentTime + 10);
          break;
        case 'arrowleft':
        case 'j':
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'm':
          video.muted = !video.muted;
          break;
        case 'b':
          addBookmark();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const addBookmark = () => {
    if (!videoRef.current) return;
    const timestamp = Math.floor(videoRef.current.currentTime);
    setBookmarks(prev => [...prev, { timestamp, note: '' }]);
  };

  const seekToBookmark = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const courseTitle = course?.title ?? 'Loading...';
  const activeTitle = lecture?.title ?? activeLecture?.title ?? '';
  const contentType = lecture?.type ?? 'video';
  const progressPercent = allLectures.length ? Math.round((completedCount / allLectures.length) * 100) : 0;
  const contentTypeLabel: Record<string, string> = {
    video: 'Video lesson',
    youtube: 'Embedded lesson',
    document: 'Document',
    pdf: 'PDF document',
    article: 'Article',
    text: 'Reading lesson',
    external_link: 'External resource',
  };

  return (
    <div className="vp-page">
      {/* ── Top Bar ── */}
      <header className="vp-header">
        <div className="vp-header-left">
          <button className="vp-back-btn" onClick={() => navigate(`/app/courses/${courseId}`)}>
            <ChevronLeft size={20} />
          </button>
          {courseLoading ? (
            <Skeleton variant="text" width="200px" />
          ) : (
            <div className="vp-title-stack">
              <span className="vp-course-title">{courseTitle}</span>
              {activeTitle && <span className="vp-lecture-title">{activeTitle}</span>}
            </div>
          )}
        </div>
        <div className="vp-header-progress" aria-label={`Course progress ${progressPercent}%`}>
          <div className="vp-header-progress-meta">
            <span>{progressPercent}% complete</span>
            <span>{completedCount}/{allLectures.length || 0}</span>
          </div>
          <div className="vp-header-progress-track">
            <div className="vp-header-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        <div className="vp-header-right">
          {courseError && (
            <Badge variant="danger" size="sm">Error loading course</Badge>
          )}
          {!courseLoading && !courseError && allLectures.length === 0 && (
            <Badge variant="warning" size="sm">No curriculum</Badge>
          )}
          {!courseLoading && !courseError && (
            <Badge variant="success" size="sm">{completedCount} / {allLectures.length} complete</Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? 'Hide' : 'Show'} Curriculum
          </Button>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <div className="vp-layout">
        {/* ─── Left: Video + Tabs ─── */}
        <div className="vp-main">
          {/* Course fetch error */}
          {courseError && (
            <div style={{ background: 'var(--error-container)', padding: '2rem', textAlign: 'center', borderBottom: '1px solid var(--surface-highest)' }}>
              <AlertCircle size={32} style={{ color: 'var(--error)', marginBottom: '0.75rem' }} />
              <p style={{ color: 'var(--error)', fontWeight: 600, margin: '0 0 0.5rem' }}>Failed to load course</p>
              <p style={{ color: 'var(--text-low)', fontSize: '0.875rem', margin: 0 }}>The course may not exist or the server is unavailable.</p>
            </div>
          )}

          {/* Empty curriculum notice */}
          {!courseLoading && !courseError && (course?.curriculum?.length ?? 0) === 0 && (
            <div style={{ background: 'var(--surface-well)', padding: '2rem', textAlign: 'center', borderBottom: '1px solid var(--surface-highest)' }}>
              <BookOpen size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
              <p style={{ color: 'var(--text-secondary)', fontWeight: 600, margin: '0 0 0.5rem' }}>No curriculum yet</p>
              <p style={{ color: 'var(--text-low)', fontSize: '0.875rem', margin: 0 }}>This course has no sections or lectures. Use the Course Builder to add content.</p>
            </div>
          )}

          {/* Content Frame — branches by lecture type */}
          {activeLecture && (
            <div className="vp-lesson-strip">
              <div>
                <Badge variant="primary" size="sm">{contentTypeLabel[contentType] ?? 'Lesson'}</Badge>
                <h1>{activeTitle}</h1>
              </div>
              <div className="vp-lesson-strip-actions">
                <Button variant="ghost" size="sm" leftIcon={<ChevronLeft size={14} />} disabled={currentIndex <= 0} onClick={goPrev}>Prev</Button>
                <Button variant="outline" size="sm" rightIcon={<ChevronRight size={14} />} disabled={currentIndex >= allLectures.length - 1 || currentIndex < 0} onClick={goNext}>Next</Button>
              </div>
            </div>
          )}

          <div className={`vp-content-frame vp-content-${contentType}`}>
            {(() => {
              const type = lecture?.type ?? 'video';
              const videoSrc = lecture?.video_url ?? lecture?.videoUrl;

              /* ── VIDEO ── */
              if (type === 'video') {
                return videoSrc ? (
                  <div className="video-wrapper" ref={containerRef}>
                    <video
                      ref={videoRef}
                      key={videoSrc}
                      src={videoSrc}
                      controls
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onEnded={() => { if (!activeLecture?.completed) completeMut.mutate(); }}
                      onTimeUpdate={(e) => setVideoProgress(e.currentTarget.currentTime)}
                      onLoadedMetadata={(e) => { e.currentTarget.playbackRate = playbackSpeed; }}
                    />
                    {/* Playback Speed Control */}
                    <div className="video-controls">
                      <select 
                        value={playbackSpeed} 
                        onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                        className="playback-speed"
                      >
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                          <option key={speed} value={speed}>{speed}x</option>
                        ))}
                      </select>
                      <button onClick={addBookmark} className="bookmark-btn" title="Add Bookmark (B)">
                        <Bookmark size={16} />
                      </button>
                      <button onClick={() => setShowShortcuts(!showShortcuts)} className="shortcuts-btn" title="Keyboard Shortcuts">
                        <Keyboard size={16} />
                      </button>
                    </div>
                    {/* Keyboard Shortcuts Modal */}
                    {showShortcuts && (
                      <div className="shortcuts-modal" onClick={() => setShowShortcuts(false)}>
                        <div className="shortcuts-content" onClick={e => e.stopPropagation()}>
                          <div className="shortcuts-header">
                            <h3>Keyboard Shortcuts</h3>
                            <button onClick={() => setShowShortcuts(false)}><X size={16} /></button>
                          </div>
                          <div className="shortcuts-list">
                            {[
                              { key: 'Space / K', action: 'Play/Pause' },
                              { key: '← / J', action: 'Rewind 10s' },
                              { key: '→ / L', action: 'Forward 10s' },
                              { key: 'F', action: 'Fullscreen' },
                              { key: 'M', action: 'Mute/Unmute' },
                              { key: 'B', action: 'Add Bookmark' },
                            ].map(shortcut => (
                              <div key={shortcut.key} className="shortcut-item">
                                <kbd>{shortcut.key}</kbd>
                                <span>{shortcut.action}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    {lectureLoading
                      ? <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-glow)' }} />
                      : activeLecture
                        ? <>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.2)', border: '2px solid rgba(239,68,68,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <FileVideo size={28} color="rgba(239,68,68,0.8)" />
                            </div>
                            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', fontWeight: 600 }}>Video not yet uploaded</span>
                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>The instructor hasn't uploaded the video for this lecture yet.</span>
                          </>
                        : <>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(99,102,241,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(99,102,241,0.5)' }}>
                              <Play size={28} color="white" fill="white" />
                            </div>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>Select a lecture to begin</span>
                          </>
                    }
                  </div>
                );
              }

              /* ── DOCUMENT / ARTICLE / PDF ── */
              if (type === 'document' || type === 'pdf' || type === 'article') {
                const docUrl = lecture?.document_url;
                if (!docUrl && (type === 'article' || (type as string) === 'text') && lecture?.content) {
                  return (
                    <div style={{ width: '100%', height: '100%', overflow: 'auto', background: '#1a1a2e', padding: '2rem', color: 'white' }}>
                      <div dangerouslySetInnerHTML={{ __html: lecture.content }} />
                    </div>
                  );
                }

                if (docUrl) {
                  const isOfficeDoc = docUrl.match(/\.(pptx?|docx?|xlsx?)$/i);
                  const iframeSrc = isOfficeDoc 
                    ? `https://docs.google.com/viewer?url=${encodeURIComponent(docUrl)}&embedded=true`
                    : `${docUrl}#toolbar=0`;

                  return (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#1a1a2e' }}>
                      <iframe
                        src={iframeSrc}
                        style={{ flex: 1, border: 'none', width: '100%', height: '100%', background: 'white' }}
                        title={activeTitle}
                      />
                      <div style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'flex-end' }}>
                        <a href={docUrl} download target="_blank" rel="noopener noreferrer"
                          style={{ color: 'var(--primary-glow)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', textDecoration: 'none' }}>
                          <Download size={14} /> Download
                        </a>
                      </div>
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                    <FileText size={40} />
                    <span style={{ fontSize: '0.875rem' }}>Content not yet uploaded</span>
                  </div>
                );
              }

              /* ── EXTERNAL LINK / YOUTUBE ── */
              if (type === 'external_link' || type === 'youtube') {
                const extUrl = lecture?.external_url;
                if (!extUrl) return (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                    <LinkIcon size={40} />
                    <span style={{ fontSize: '0.875rem' }}>No link set</span>
                  </div>
                );
                const ytEmbed = getYouTubeEmbed(extUrl);
                const vimeoEmbed = getVimeoEmbed(extUrl);
                const embedSrc = ytEmbed ?? vimeoEmbed;
                return embedSrc ? (
                  <iframe
                    key={embedSrc}
                    src={embedSrc}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={activeTitle}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <LinkIcon size={40} color="rgba(255,255,255,0.4)" />
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>{activeTitle}</span>
                    <a href={extUrl} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem', background: 'rgba(99,102,241,0.85)', color: '#fff', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}>
                      <ExternalLink size={15} /> Open Link
                    </a>
                  </div>
                );
              }

              /* ── TEXT / RICH TEXT ── */
              if (type === 'text') {
                return (
                  <div style={{ width: '100%', height: '100%', overflowY: 'auto', background: 'var(--surface-root, #0e0e1a)', display: 'flex', justifyContent: 'center', padding: '2rem 1rem', boxSizing: 'border-box' }}>
                    <article style={{ maxWidth: 720, width: '100%', color: 'var(--text-high, #e2e8f0)', lineHeight: 1.8, fontSize: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary-glow, #818cf8)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        <AlignLeft size={14} /> Reading Lesson
                      </div>
                      {lecture?.content
                        ? <div className="rte-content" dangerouslySetInnerHTML={{ __html: lecture.content }} />
                        : <p style={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>No content written yet.</p>
                      }
                    </article>
                  </div>
                );
              }

              return null;
            })()}
          </div>

          {/* Mark Complete bar */}
          {activeLecture && !activeLecture.completed && (
            <div className="vp-complete-bar">
              <span style={{ color: 'var(--text-low)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 auto', minWidth: '200px' }}>
                <BookOpen size={15} /> Mark this lecture as complete when done
              </span>
              <Button
                variant="primary"
                size="sm"
                isLoading={completeMut.isPending}
                onClick={() => completeMut.mutate()}
                leftIcon={<CheckCircle size={14} />}
                style={{ flexShrink: 0 }}
              >
                Mark Complete
              </Button>
            </div>
          )}

          {/* Tabs */}
          <div className="vp-tabs-panel">
            <div className="vp-tabs">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={activeTab === tab.id ? 'active' : ''}
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
                  placeholder="Write your personal notes here... (timestamp: 00:00)"
                  value={noteBody}
                  onChange={e => { setNoteBody(e.target.value); noteSavedRef.current = false; }}
                  style={{ width: '100%', minHeight: 160, background: 'var(--surface-well)', border: '1px solid var(--surface-highest)', color: 'var(--text-high)', padding: '0.75rem', fontSize: '0.9375rem', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }}
                />
                {videoProgress > 0 && (
                  <button 
                    className="insert-timestamp-btn"
                    onClick={() => setNoteBody(prev => prev + `[${formatTime(videoProgress)}] `)}
                  >
                    <Clock size={14} /> Insert Current Timestamp
                  </button>
                )}
              </div>
            )}

            {/* Bookmarks Tab */}
            {activeTab === 'bookmarks' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {bookmarks.length === 0 ? (
                  <p style={{ color: 'var(--text-low)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>
                    No bookmarks yet. Press <kbd>B</kbd> while watching to add one!
                  </p>
                ) : (
                  <>
                    <p style={{ color: 'var(--text-low)', fontSize: '0.8125rem' }}>
                      Click a bookmark to jump to that timestamp.
                    </p>
                    <div className="bookmarks-list">
                      {bookmarks.map((bookmark, idx) => (
                        <div key={idx} className="bookmark-item" onClick={() => seekToBookmark(bookmark.timestamp)}>
                          <div className="bookmark-time">
                            <Clock size={14} />
                            {formatTime(bookmark.timestamp)}
                          </div>
                          <input
                            type="text"
                            placeholder="Add note..."
                            value={bookmark.note}
                            onChange={(e) => {
                              const newBookmarks = [...bookmarks];
                              newBookmarks[idx].note = e.target.value;
                              setBookmarks(newBookmarks);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button 
                            className="bookmark-jump"
                            onClick={(e) => { e.stopPropagation(); seekToBookmark(bookmark.timestamp); }}
                          >
                            <RotateCcw size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* AI Tutor Tab */}
            {activeTab === 'ai' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: 400, border: '1px solid var(--surface-highest)', borderRadius: 12, overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--surface-highest)', background: 'var(--surface-container)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <Bot size={16} style={{ color: 'var(--primary-glow)' }} />
                  <span style={{ color: 'var(--text-high)', fontWeight: 600, fontSize: '0.875rem' }}>AI Tutor</span>
                  <span style={{ color: 'var(--text-lowest)', fontSize: '0.75rem', marginLeft: 'auto' }}>Ask anything about this lecture</span>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--surface-well)' }}>
                  {aiMessages.length === 0 && !aiLoading && !aiError && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem', color: 'var(--text-lowest)' }}>
                      <Sparkles size={28} style={{ color: 'var(--primary-glow)', opacity: 0.6 }} />
                      <p style={{ margin: 0, fontSize: '0.875rem', textAlign: 'center' }}>Ask the AI Tutor anything about <strong style={{ color: 'var(--text-low)' }}>{activeTitle || 'this lecture'}</strong></p>
                    </div>
                  )}
                  {aiMessages.map((msg, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div style={{
                        maxWidth: '80%',
                        padding: '0.625rem 0.875rem',
                        borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                        background: msg.role === 'user' ? 'var(--primary)' : 'var(--surface-container)',
                        color: msg.role === 'user' ? '#fff' : 'var(--text-high)',
                        fontSize: '0.875rem',
                        lineHeight: 1.5,
                        border: msg.role === 'ai' ? '1px solid var(--surface-highest)' : 'none',
                      }}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {/* Typing indicator */}
                  {aiLoading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ padding: '0.625rem 0.875rem', background: 'var(--surface-container)', border: '1px solid var(--surface-highest)', borderRadius: '12px 12px 12px 2px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                        {[0, 1, 2].map(d => (
                          <span key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary-glow)', display: 'inline-block', animation: `vpTyping 1.2s ${d * 0.2}s ease-in-out infinite` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Error state */}
                  {aiError && !aiLoading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.875rem', background: 'var(--error-container, rgba(239,68,68,0.1))', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: 'var(--error, #ef4444)', fontSize: '0.8125rem' }}>
                      <AlertCircle size={14} /> {aiError}
                    </div>
                  )}
                  <div ref={aiMessagesEndRef} />
                </div>

                {/* Input */}
                <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', borderTop: '1px solid var(--surface-highest)', background: 'var(--surface-container)', flexShrink: 0 }}>
                  <input
                    type="text"
                    placeholder="Ask a question..."
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiMessage(); } }}
                    style={{ flex: 1, background: 'var(--surface-well)', border: '1px solid var(--surface-highest)', color: 'var(--text-high)', padding: '0.5rem 0.75rem', fontSize: '0.875rem', borderRadius: 8, outline: 'none' }}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={aiLoading}
                    disabled={!aiInput.trim() || aiLoading}
                    onClick={sendAiMessage}
                    leftIcon={<Send size={14} />}
                  >
                    Send
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Right: Curriculum Sidebar ─── */}
        {sidebarOpen && (
          <div className="vp-sidebar-overlay open" onClick={() => setSidebarOpen(false)} />
        )}
        {sidebarOpen && (
          <aside className="vp-sidebar" style={{ width: 320, flexShrink: 0, borderLeft: '1px solid var(--surface-highest)', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--surface-container)' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--surface-highest)', flexShrink: 0 }}>
              <h2 style={{ color: 'var(--text-high)', fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>Curriculum</h2>
              {!courseLoading && !courseError && <p style={{ color: 'var(--text-low)', fontSize: '0.75rem', marginTop: '0.25rem', margin: '0.25rem 0 0' }}>{course?.curriculum?.length ?? 0} module{(course?.curriculum?.length ?? 0) !== 1 ? 's' : ''}</p>}
              {courseError && <p style={{ color: 'var(--error)', fontSize: '0.75rem', margin: '0.25rem 0 0' }}>Error loading course</p>}
            </div>
            <ul style={{ flex: 1, overflowY: 'auto', listStyle: 'none', padding: 0, margin: 0 }}>
              {courseLoading && Array.from({ length: 6 }).map((_, i) => (
                <li key={i} style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--surface-highest)' }}>
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="text" width="40%" />
                </li>
              ))}
              {!courseLoading && (course?.curriculum?.length ?? 0) === 0 && (
                <li style={{ padding: '2rem 1.25rem', textAlign: 'center' }}>
                  <BookOpen size={28} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>No curriculum available.</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0.25rem 0 0' }}>Add sections in the Course Builder.</p>
                </li>
              )}
              {!courseLoading && (course?.curriculum ?? []).map(section => (
                <React.Fragment key={section._id}>
                  <li className="vp-section-heading" style={{ padding: '0.5rem 1.25rem', background: 'var(--surface-container-high)', borderBottom: '1px solid var(--surface-highest)' }}>
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
                          ) : (() => {
                            const t = lec.type ?? 'video';
                            if (t === 'document' || t === 'pdf') return <FileText size={15} color="var(--text-lowest)" />;
                            if (t === 'external_link' || t === 'youtube') return <Globe size={15} color="var(--text-lowest)" />;
                            if (t === 'text' || t === 'article') return <AlignLeft size={15} color="var(--text-lowest)" />;
                            return <span style={{ width: 18, height: 18, border: '2px solid var(--surface-highest)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', color: 'var(--text-lowest)', fontWeight: 700 }}>{i + 1}</span>;
                          })()}
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
              ))}
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
