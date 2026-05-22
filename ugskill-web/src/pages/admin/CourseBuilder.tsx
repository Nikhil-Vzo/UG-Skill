import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, GripVertical, FileVideo, FileText, Link as LinkIcon,
  AlignLeft, Settings, Save, AlertCircle, AlertTriangle, Loader, ChevronDown,
  ChevronUp, Trash2, Image, Upload, X, Check, Eye,
  EyeOff, Edit2,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FileUpload } from '../../components/ui/FileUpload';
import { RichTextEditor } from '../../components/ui/RichTextEditor';
import { Modal } from '../../components/ui/Modal';
import api from '../../lib/api';
import './CourseBuilder.css';

/* ─── Types ─────────────────────────────────────────────────── */
type LectureType = 'video' | 'document' | 'external_link' | 'text';

interface Resource {
  id: string;
  type: 'pdf' | 'link';
  title: string;
  url: string;
}

interface Lecture {
  id: string;
  title: string;
  type: LectureType;
  is_free_preview: boolean;
  duration_secs?: number;
  video_url?: string;
  hls_manifest_url?: string;
  transcript_url?: string;
  document_url?: string;
  external_url?: string;
  content?: string;
  resources: Resource[];
  ai_summary?: string;
  key_takeaways?: string[];
  topic_tags?: string[];
}

interface Section {
  id: string;
  title: string;
  description?: string;
  lectures: Lecture[];
}

interface CourseDetails {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  category?: string;
  sub_category?: string;
  difficulty?: string;
  language?: string;
  thumbnail_url?: string;
  thumbnailUrl?: string;
  is_free?: boolean;
  isFree?: boolean;
  price?: number;
  tags?: string[];
  sections: Section[];
  whatYouLearn?: string[] | string;
  durationWeeks?: number;
}

/* ─── Helpers ────────────────────────────────────────────────── */
const LECTURE_TYPE_META: Record<LectureType, { label: string; icon: React.ReactNode; color: string; desc: string }> = {
  video:         { label: 'Video',    icon: <FileVideo size={15} />,  color: '#6366f1', desc: 'MP4 or WebM up to 2 GB' },
  document:      { label: 'Document', icon: <FileText size={15} />,   color: '#22c55e', desc: 'PDF or PowerPoint up to 100 MB' },
  external_link: { label: 'Link',     icon: <LinkIcon size={15} />,   color: '#f59e0b', desc: 'YouTube, Vimeo, or any URL' },
  text:          { label: 'Text',     icon: <AlignLeft size={15} />,  color: '#06b6d4', desc: 'Rich text lesson written here' },
};

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  video_ok:    { label: '✅ Video attached',    color: '#22c55e' },
  doc_ok:      { label: '📄 Document attached', color: '#22c55e' },
  link_ok:     { label: '🔗 Link set',          color: '#f59e0b' },
  text_ok:     { label: '📝 Text written',      color: '#06b6d4' },
  empty:       { label: '⚠ Content missing',   color: '#ef4444' },
};

function getLectureStatus(lec: Lecture): string {
  if (lec.type === 'video' && lec.video_url) return 'video_ok';
  if (lec.type === 'document' && lec.document_url) return 'doc_ok';
  if (lec.type === 'external_link' && lec.external_url) return 'link_ok';
  if (lec.type === 'text' && lec.content && lec.content !== '<p></p>') return 'text_ok';
  return 'empty';
}

function getEmbedUrl(url: string): string | null {
  const ytMatch = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

/* ─── Fetchers ───────────────────────────────────────────────── */
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

/* ─── Type Picker Modal ──────────────────────────────────────── */
const TypePickerModal: React.FC<{ onPick: (t: LectureType) => void; onClose: () => void }> = ({ onPick, onClose }) => (
  <Modal isOpen={true} onClose={onClose} title="Choose Lesson Type">
    <div className="cb-type-grid">
      {(Object.entries(LECTURE_TYPE_META) as [LectureType, typeof LECTURE_TYPE_META[LectureType]][]).map(([type, meta]) => (
        <button key={type} className="cb-type-card" onClick={() => { onPick(type); onClose(); }}>
          <span className="cb-type-icon" style={{ background: `${meta.color}20`, color: meta.color }}>{meta.icon}</span>
          <strong>{meta.label}</strong>
          <span className="cb-type-desc">{meta.desc}</span>
        </button>
      ))}
    </div>
  </Modal>
);

/* ─── Resource Row ───────────────────────────────────────────── */
const ResourceRow: React.FC<{
  resource: Resource;
  onChange: (r: Resource) => void;
  onRemove: () => void;
}> = ({ resource, onChange, onRemove }) => (
  <div className="cb-resource-row">
    <span className="cb-resource-icon">
      {resource.type === 'pdf' ? <FileText size={14} /> : <LinkIcon size={14} />}
    </span>
    <input
      className="cb-input cb-resource-title"
      placeholder="Resource title"
      value={resource.title}
      onChange={(e) => onChange({ ...resource, title: e.target.value })}
    />
    {resource.type === 'link' ? (
      <input
        className="cb-input cb-resource-url"
        placeholder="https://..."
        value={resource.url}
        onChange={(e) => onChange({ ...resource, url: e.target.value })}
      />
    ) : (
      <span className="cb-resource-path">{resource.url ? '✓ PDF uploaded' : 'No file yet'}</span>
    )}
    <button className="cb-icon-btn danger" onClick={onRemove}><X size={14} /></button>
  </div>
);

/* ─── Lecture Edit Panel ─────────────────────────────────────── */
const LectureEditPanel: React.FC<{
  lecture: Lecture;
  sectionId: string;
  onChange: (updated: Lecture) => void;
}> = ({ lecture, onChange }) => {
  const meta = LECTURE_TYPE_META[lecture.type];
  const panelRef = useRef<HTMLDivElement>(null);

  const lectureRef = useRef(lecture);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    lectureRef.current = lecture;
  }, [lecture]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Auto-scroll into view when panel opens
  React.useEffect(() => {
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  const upd = useCallback(<K extends keyof Lecture>(key: K, val: Lecture[K]) => {
    const next = { ...lectureRef.current, [key]: val };
    lectureRef.current = next;
    onChangeRef.current(next);
  }, []);

  const addResource = (type: 'pdf' | 'link') => {
    const r: Resource = { id: `res_${Date.now()}`, type, title: '', url: '' };
    upd('resources', [...(lectureRef.current.resources || []), r]);
  };
  const updateResource = (idx: number, updates: Partial<Resource>) => {
    const a = [...(lectureRef.current.resources || [])];
    if (a[idx]) {
      a[idx] = { ...a[idx], ...updates };
      upd('resources', a);
    }
  };
  const removeResource = (idx: number) => {
    upd('resources', (lectureRef.current.resources || []).filter((_, i) => i !== idx));
  };

  return (
    <div className="cb-lecture-panel" ref={panelRef}>
      {/* Title + free preview */}
      <div className="cb-panel-row">
        <label className="cb-label">Lesson Title</label>
        <div className="cb-panel-row-inner">
          <input className="cb-input cb-title-input" value={lecture.title}
            onChange={(e) => upd('title', e.target.value)} placeholder="Lesson title…" />
          <button className={`cb-toggle-btn${lecture.is_free_preview ? ' active' : ''}`}
            onClick={() => upd('is_free_preview', !lecture.is_free_preview)}>
            {lecture.is_free_preview ? <Eye size={14} /> : <EyeOff size={14} />}
            {lecture.is_free_preview ? ' Free Preview' : ' Locked'}
          </button>
        </div>
      </div>

      <div className="cb-type-badge" style={{ background: `${meta.color}18`, color: meta.color, borderColor: `${meta.color}40` }}>
        {meta.icon} {meta.label}
      </div>

      {/* VIDEO */}
      {lecture.type === 'video' && (
        <div className="cb-section-block">
          <label className="cb-label">Video File</label>
          {lecture.video_url ? (
            <div className="cb-attached">
              <Check size={16} color="#22c55e" /><span>Video uploaded</span>
              <button className="cb-icon-btn danger" onClick={() => upd('video_url', undefined)}><X size={14} /></button>
            </div>
          ) : (
            <FileUpload category="course_content" acceptedTypes="video/mp4,video/webm"
              maxSizeMB={2000} onUploadComplete={(p, file) => {
                upd('video_url', p);
                if (file) {
                  const video = document.createElement('video');
                  video.preload = 'metadata';
                  video.onloadedmetadata = () => {
                    window.URL.revokeObjectURL(video.src);
                    upd('duration_secs', Math.round(video.duration));
                  };
                  video.src = URL.createObjectURL(file);
                }
              }} />
          )}
          <label className="cb-label mt">
            Transcript File <span className="cb-optional">(optional — AI will auto-generate later)</span>
          </label>
          {lecture.transcript_url ? (
            <div className="cb-attached">
              <Check size={16} color="#22c55e" /><span>Transcript uploaded</span>
              <button className="cb-icon-btn danger" onClick={() => upd('transcript_url', undefined)}><X size={14} /></button>
            </div>
          ) : (
            <FileUpload category="course_content" acceptedTypes="text/vtt,text/plain"
              maxSizeMB={5} onUploadComplete={(p) => upd('transcript_url', p)} />
          )}
        </div>
      )}

      {/* DOCUMENT */}
      {lecture.type === 'document' && (
        <div className="cb-section-block">
          <label className="cb-label">Document File <span className="cb-optional">(PDF or PPTX)</span></label>
          {lecture.document_url ? (
            <div className="cb-attached">
              <Check size={16} color="#22c55e" /><span>Document uploaded</span>
              <button className="cb-icon-btn danger" onClick={() => upd('document_url', undefined)}><X size={14} /></button>
            </div>
          ) : (
            <FileUpload category="course_content"
              acceptedTypes="application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              maxSizeMB={100} onUploadComplete={(p) => upd('document_url', p)} />
          )}
        </div>
      )}

      {/* EXTERNAL LINK */}
      {lecture.type === 'external_link' && (
        <div className="cb-section-block">
          <label className="cb-label">URL</label>
          <input className="cb-input" type="url" placeholder="https://youtube.com/watch?v=..."
            value={lecture.external_url ?? ''}
            onChange={(e) => upd('external_url', e.target.value)} />
          {lecture.external_url && getEmbedUrl(lecture.external_url) && (
            <p className="cb-hint">✅ YouTube/Vimeo detected — will embed in player</p>
          )}
          {lecture.external_url && !getEmbedUrl(lecture.external_url) && lecture.external_url.startsWith('http') && (
            <p className="cb-hint">🔗 Will open in new tab</p>
          )}
        </div>
      )}

      {/* TEXT */}
      {lecture.type === 'text' && (
        <div className="cb-section-block">
          <label className="cb-label">Lesson Content</label>
          <RichTextEditor content={lecture.content} onChange={(html) => upd('content', html)}
            placeholder="Write your lesson — supports headings, lists, code blocks, links…"
            minHeight={360} />
        </div>
      )}

      {/* Duration input for video & link types */}
      {(lecture.type === 'video' || lecture.type === 'external_link') && (
        <div className="cb-section-block" style={{ marginTop: '0.75rem' }}>
          <label className="cb-label">Lesson Duration</label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <input
                type="number"
                min={0}
                className="cb-input"
                style={{ width: '80px', textAlign: 'center' }}
                value={Math.floor((lecture.duration_secs || 0) / 60) || ''}
                placeholder="0"
                onChange={(e) => {
                  const m = Math.max(0, parseInt(e.target.value, 10) || 0);
                  const s = (lecture.duration_secs || 0) % 60;
                  upd('duration_secs', (m * 60) + s);
                }}
              />
              <span className="cb-optional">min</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <input
                type="number"
                min={0}
                max={59}
                className="cb-input"
                style={{ width: '80px', textAlign: 'center' }}
                value={((lecture.duration_secs || 0) % 60) || ''}
                placeholder="00"
                onChange={(e) => {
                  const m = Math.floor((lecture.duration_secs || 0) / 60);
                  const s = Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0));
                  upd('duration_secs', (m * 60) + s);
                }}
              />
              <span className="cb-optional">sec</span>
            </div>
          </div>
        </div>
      )}

      {/* Resources */}
      <div className="cb-section-block">
        <div className="cb-section-label-row">
          <label className="cb-label">
            Resources <span className="cb-optional">(attachments students can download)</span>
          </label>
          <div className="cb-resource-btns">
            <button className="cb-add-resource-btn" onClick={() => addResource('pdf')}>
              <Upload size={13} /> Add PDF
            </button>
            <button className="cb-add-resource-btn" onClick={() => addResource('link')}>
              <LinkIcon size={13} /> Add Link
            </button>
          </div>
        </div>
        {lecture.resources.length > 0 ? (
          <div className="cb-resources-list">
            {lecture.resources.map((r, idx) =>
              r.type === 'pdf' && !r.url ? (
                <div key={r.id} className="cb-resource-upload-row">
                  <input className="cb-input" placeholder="Resource title" value={r.title}
                    onChange={(e) => updateResource(idx, { title: e.target.value })} />
                  <FileUpload category="course_content" acceptedTypes="application/pdf"
                    maxSizeMB={50} onUploadComplete={(p) => updateResource(idx, { url: p })} />
                  <button className="cb-icon-btn danger" onClick={() => removeResource(idx)}><X size={14} /></button>
                </div>
              ) : (
                <ResourceRow key={r.id} resource={r}
                  onChange={(updated) => updateResource(idx, updated)}
                  onRemove={() => removeResource(idx)} />
              )
            )}
          </div>
        ) : (
          <p className="cb-empty-hint">No resources added yet. Add PDFs or links to supplement this lesson.</p>
        )}
      </div>
    </div>
  );
};

/* ─── Main CourseBuilder ─────────────────────────────────────── */
export const CourseBuilder: React.FC = () => {
  const { courseId } = useParams<{ courseId?: string }>();
  const navigate = useNavigate();
  const isNew = !courseId;
  const queryClient = useQueryClient();

  const [localSections, setLocalSections] = useState<Section[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>();
  const [thumbnailPreview, setThumbnailPreview] = useState<string | undefined>();
  const [title, setTitle] = useState<string>('');
  const [subtitle, setSubtitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [whatYouLearn, setWhatYouLearn] = useState<string>('');
  const [category, setCategory] = useState<string>('Engineering');
  const [difficulty, setDifficulty] = useState<string>('beginner');
  const [language, setLanguage] = useState<string>('english');
  const [durationWeeks, setDurationWeeks] = useState<number>(4);
  const [price, setPrice] = useState<number>(0);
  const [isFree, setIsFree] = useState<boolean>(false);

  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [editingLectureId, setEditingLectureId] = useState<string | null>(null);
  const [typePickerFor, setTypePickerFor] = useState<{ sectionId: string } | null>(null);
  const [saveOk, setSaveOk] = useState(false);

  /* ── Drag & Drop states ── */
  const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(null);
  const [draggedLectureInfo, setDraggedLectureInfo] = useState<{ sectionId: string; index: number } | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);
  const [dragOverLectureId, setDragOverLectureId] = useState<string | null>(null);

  /* ── Validation & Modal states ── */
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  const { data: courseData, isPending, isError } = useQuery<CourseDetails>({
    queryKey: ['course-builder', courseId],
    queryFn: () => fetchCourse(courseId!),
    enabled: !!courseId,
  });

  // Initialize local state once data is fetched
  React.useEffect(() => {
    if (courseData) {
      const sections = (courseData.sections ?? []).map((s: any) => ({
        ...s,
        id: s._id ?? s.id,
        lectures: (s.lectures ?? []).map((l: any) => {
          let mappedType = l.type ?? l.content_type ?? 'video';
          if (mappedType === 'youtube') mappedType = 'external_link';
          if (mappedType === 'pdf') mappedType = 'document';
          if (mappedType === 'article') mappedType = 'text';

          return {
            id: l._id ?? l.id,
            title: l.title ?? 'Untitled',
            type: mappedType,
            is_free_preview: l.is_free_preview ?? l.is_preview ?? false,
            duration_secs: l.duration_secs,
            video_url: l.video_url,
            hls_manifest_url: l.hls_manifest_url,
            transcript_url: l.transcript_url,
            document_url: l.document_url,
            external_url: l.external_url,
            content: l.content,
            resources: l.resources ?? [],
            ai_summary: l.ai_summary,
            key_takeaways: l.key_takeaways,
            topic_tags: l.topic_tags,
          };
        }),
      }));
      setLocalSections(sections);
      const thumb = courseData.thumbnail_url ?? courseData.thumbnailUrl;
      setThumbnailUrl(thumb);
      setThumbnailPreview(thumb);
      setTitle(courseData.title ?? '');
      setSubtitle(courseData.subtitle ?? '');
      setDescription(courseData.description ?? '');
      setWhatYouLearn(Array.isArray(courseData.whatYouLearn) ? courseData.whatYouLearn.join(', ') : (courseData.whatYouLearn ?? ''));
      setCategory(courseData.category ?? 'Engineering');
      setDifficulty(courseData.difficulty ?? 'beginner');
      setLanguage(courseData.language ?? 'english');
      setDurationWeeks(courseData.durationWeeks ?? 4);
      setPrice(courseData.price ?? 0);
      setIsFree(courseData.is_free ?? courseData.isFree ?? false);
    }
  }, [courseData]);

  const [saveError, setSaveError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        subtitle,
        description,
        whatYouLearn: whatYouLearn.split(',').map((s: string) => s.trim()).filter(Boolean),
        durationWeeks,
        category,
        difficulty,
        language,
        isFree,
        price,
        thumbnailUrl,
      };

      if (isNew) {
        const { data } = await api.post('/lms/courses', payload);
        const newId = data.data?._id || data.data?.id;
        if (newId) {
          navigate(`/app/admin/courses/${newId}/builder`, { replace: true });
        }
        return data.data;
      } else {
        await saveCurriculum({ courseId: courseId!, sections: localSections });
        await api.put(`/lms/courses/${courseId}`, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-builder', courseId] });
      setSaveOk(true);
      setSaveError(null);
      setTimeout(() => setSaveOk(false), 2000);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || err?.message || 'Save failed — check console for details';
      setSaveError(msg);
      console.error('[CourseBuilder] save failed:', err?.response?.data ?? err);
    },
  });
  const publishMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        subtitle,
        description,
        whatYouLearn: whatYouLearn.split(',').map((s: string) => s.trim()).filter(Boolean),
        durationWeeks,
        category,
        difficulty,
        language,
        isFree,
        price,
        thumbnailUrl,
      };

      // Auto-save the latest curriculum and course metadata before publishing
      await saveCurriculum({ courseId: courseId!, sections: localSections });
      await api.put(`/lms/courses/${courseId}`, payload);

      return publishCourse(courseId!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-builder', courseId] });
      navigate('/app/admin/courses');
    },
  });

  const addSection = () => {
    const s: Section = { id: `sec_${Date.now()}`, title: 'New Module', lectures: [] };
    setLocalSections((p) => [...p, s]);
    setExpandedSection(s.id);
  };
  const updateSectionTitle = (id: string, title: string) =>
    setLocalSections((p) => p.map((s) => s.id === id ? { ...s, title } : s));
  const deleteSection = (id: string) =>
    setLocalSections((p) => p.filter((s) => s.id !== id));

  const addLecture = (sectionId: string, type: LectureType) => {
    const l: Lecture = { id: `lec_${Date.now()}`, title: 'New Lesson', type, is_free_preview: false, resources: [] };
    setLocalSections((p) => p.map((s) => s.id === sectionId ? { ...s, lectures: [...s.lectures, l] } : s));
    // Auto-open the edit panel AND ensure the section is expanded
    setEditingLectureId(l.id);
    setExpandedSection(sectionId);
  };
  const updateLecture = useCallback((sectionId: string, updated: Lecture) => {
    setLocalSections((p) =>
      p.map((s) => s.id === sectionId
        ? { ...s, lectures: s.lectures.map((l) => l.id === updated.id ? updated : l) }
        : s)
    );
  }, []);
  const deleteLecture = (sectionId: string, lectureId: string) => {
    setLocalSections((p) => p.map((s) =>
      s.id === sectionId ? { ...s, lectures: s.lectures.filter((l) => l.id !== lectureId) } : s
    ));
    if (editingLectureId === lectureId) setEditingLectureId(null);
  };

  const totalLectures = localSections.reduce((a, s) => a + s.lectures.length, 0);

  /* ── Drag & Drop handlers ── */
  const handleSectionDragStart = (e: React.DragEvent, index: number) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.cb-grip')) {
      e.preventDefault();
      return;
    }
    setDraggedLectureInfo(null);
    setDraggedSectionIndex(index);
    e.dataTransfer.setData('text/plain', `section:${index}`);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSectionDragOver = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    if (draggedSectionIndex !== null) {
      setDragOverSectionId(sectionId);
    }
  };

  const handleSectionDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverSectionId(null);
    const data = e.dataTransfer.getData('text/plain');
    if (data.startsWith('section:')) {
      const sourceIndex = parseInt(data.split(':')[1], 10);
      if (sourceIndex === targetIndex || isNaN(sourceIndex)) return;

      const reordered = [...localSections];
      const [removed] = reordered.splice(sourceIndex, 1);
      reordered.splice(targetIndex, 0, removed);
      setLocalSections(reordered);
    }
    setDraggedSectionIndex(null);
  };

  const handleSectionDragEnd = () => {
    setDraggedSectionIndex(null);
    setDragOverSectionId(null);
  };

  const handleLectureDragStart = (e: React.DragEvent, sectionId: string, lectureIndex: number) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.cb-grip-sm')) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    setDraggedSectionIndex(null);
    setDraggedLectureInfo({ sectionId, index: lectureIndex });
    e.dataTransfer.setData('text/plain', `lecture:${sectionId}:${lectureIndex}`);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleLectureDragOver = (e: React.DragEvent, targetLectureId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedLectureInfo !== null) {
      setDragOverLectureId(targetLectureId);
    }
  };

  const handleLectureDrop = (e: React.DragEvent, targetSectionId: string, targetLectureIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverLectureId(null);
    const data = e.dataTransfer.getData('text/plain');
    if (data.startsWith('lecture:')) {
      const parts = data.split(':');
      const sourceSectionId = parts[1];
      const sourceLectureIndex = parseInt(parts[2], 10);

      const sourceSectionIdx = localSections.findIndex(s => s.id === sourceSectionId);
      const targetSectionIdx = localSections.findIndex(s => s.id === targetSectionId);

      if (sourceSectionIdx === -1 || targetSectionIdx === -1 || isNaN(sourceLectureIndex)) return;

      const newSections = [...localSections];
      const sourceLectures = [...newSections[sourceSectionIdx].lectures];
      const [movedLecture] = sourceLectures.splice(sourceLectureIndex, 1);

      if (sourceSectionId === targetSectionId) {
        sourceLectures.splice(targetLectureIndex, 0, movedLecture);
        newSections[sourceSectionIdx] = {
          ...newSections[sourceSectionIdx],
          lectures: sourceLectures
        };
      } else {
        const targetLectures = [...newSections[targetSectionIdx].lectures];
        targetLectures.splice(targetLectureIndex, 0, movedLecture);
        newSections[sourceSectionIdx] = {
          ...newSections[sourceSectionIdx],
          lectures: sourceLectures
        };
        newSections[targetSectionIdx] = {
          ...newSections[targetSectionIdx],
          lectures: targetLectures
        };
      }

      setLocalSections(newSections);
    }
    setDraggedLectureInfo(null);
  };

  const handleLecturesContainerDrop = (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();
    setDragOverLectureId(null);
    const data = e.dataTransfer.getData('text/plain');
    if (data.startsWith('lecture:')) {
      const parts = data.split(':');
      const sourceSectionId = parts[1];
      const sourceLectureIndex = parseInt(parts[2], 10);

      if (sourceSectionId === targetSectionId) return;

      const sourceSectionIdx = localSections.findIndex(s => s.id === sourceSectionId);
      const targetSectionIdx = localSections.findIndex(s => s.id === targetSectionId);

      if (sourceSectionIdx === -1 || targetSectionIdx === -1 || isNaN(sourceLectureIndex)) return;

      const newSections = [...localSections];
      const sourceLectures = [...newSections[sourceSectionIdx].lectures];
      const [movedLecture] = sourceLectures.splice(sourceLectureIndex, 1);

      const targetLectures = [...newSections[targetSectionIdx].lectures, movedLecture];

      newSections[sourceSectionIdx] = {
        ...newSections[sourceSectionIdx],
        lectures: sourceLectures
      };
      newSections[targetSectionIdx] = {
        ...newSections[targetSectionIdx],
        lectures: targetLectures
      };

      setLocalSections(newSections);
    }
    setDraggedLectureInfo(null);
  };

  const handleLectureDragEnd = () => {
    setDraggedLectureInfo(null);
    setDragOverLectureId(null);
  };

  /* ── Up/Down Reordering Arrow Actions ── */
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= localSections.length) return;
    const reordered = [...localSections];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;
    setLocalSections(reordered);
  };

  const moveLecture = (sectionId: string, lectureIndex: number, direction: 'up' | 'down') => {
    const sectionIdx = localSections.findIndex(s => s.id === sectionId);
    if (sectionIdx === -1) return;
    const targetIdx = direction === 'up' ? lectureIndex - 1 : lectureIndex + 1;
    const lectures = localSections[sectionIdx].lectures;
    if (targetIdx < 0 || targetIdx >= lectures.length) return;

    const reorderedLectures = [...lectures];
    const temp = reorderedLectures[lectureIndex];
    reorderedLectures[lectureIndex] = reorderedLectures[targetIdx];
    reorderedLectures[targetIdx] = temp;

    const newSections = [...localSections];
    newSections[sectionIdx] = {
      ...newSections[sectionIdx],
      lectures: reorderedLectures
    };
    setLocalSections(newSections);
  };

  /* ── Validation Checklist Helpers ── */
  const getValidationIssues = useCallback(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!title.trim()) errors.push("Course title is empty.");
    if (!description.trim() || description === '<p></p>') errors.push("Course description is empty.");
    if (!thumbnailUrl) warnings.push("Course thumbnail is missing.");
    if (localSections.length === 0) {
      errors.push("Curriculum has no modules.");
    } else {
      localSections.forEach((s) => {
        if (s.lectures.length === 0) {
          warnings.push(`Module "${s.title}" has no lessons.`);
        }
        s.lectures.forEach((l) => {
          if (getLectureStatus(l) === 'empty') {
            errors.push(`Lesson "${l.title}" in Module "${s.title}" has no content attached.`);
          }
        });
      });
    }

    return { errors, warnings };
  }, [title, description, thumbnailUrl, localSections]);

  const { errors: pubErrors, warnings: pubWarnings } = getValidationIssues();
  const hasErrors = pubErrors.length > 0;

  if (!isNew && isPending) return (
    <div className="cb-center"><Loader size={24} className="cb-spin" /> Loading course…</div>
  );
  if (!isNew && isError) return (
    <div className="cb-error"><AlertCircle size={20} /> Failed to load course.</div>
  );

  return (
    <div className="cb-root">
      {/* Header */}
      <header className="cb-header">
        <div>
          <h1 className="cb-heading">{isNew ? 'New Course' : 'Course Builder'}</h1>
          <p className="cb-subheading">{localSections.length} module(s) · {totalLectures} lesson(s)</p>
        </div>
        <div className="cb-header-actions">
          <Button variant="outline" leftIcon={<Settings size={18} />} onClick={() => navigate('/app/admin/courses')}>Back to Courses</Button>
          <Button variant="outline"
            leftIcon={saveOk ? <Check size={18} color="#22c55e" /> : <Save size={18} />}
            onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !title.trim()}>
            {saveMutation.isPending ? 'Saving…' : saveOk ? 'Saved!' : isNew ? 'Create Course' : 'Save'}
          </Button>
          {!isNew && (
            <Button variant="primary" onClick={() => setIsPublishModalOpen(true)} disabled={publishMutation.isPending}>
              {publishMutation.isPending ? 'Publishing…' : 'Publish Course'}
            </Button>
          )}
        </div>
      </header>

      {/* Save error banner */}
      {saveError && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', padding: '0.625rem 1.25rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={15} /> {saveError}
        </div>
      )}

      {/* Course Information */}
      <Card className="cb-info-card">
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>
            Course Settings & Metadata
          </h3>
          
          <div className="cb-info-grid">
            <div className="cb-info-main">
              <div className="cb-panel-row" style={{ marginBottom: '1rem' }}>
                <label className="cb-label">Course Title</label>
                <input className="cb-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter course title..." />
              </div>

              <div className="cb-panel-row" style={{ marginBottom: '1.25rem' }}>
                <label className="cb-label">Description</label>
                <RichTextEditor content={description} onChange={(html) => setDescription(html)} placeholder="Provide a compelling overview of what students will learn..." minHeight={180} />
              </div>

              <div className="cb-panel-row" style={{ marginBottom: '1rem' }}>
                <label className="cb-label">Course Subtitle</label>
                <input className="cb-input" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Provide a brief, catchy subtitle..." />
              </div>

              <div className="cb-panel-row" style={{ marginBottom: '1rem' }}>
                <label className="cb-label">What You'll Learn (comma separated list)</label>
                <input className="cb-input" value={whatYouLearn} onChange={(e) => setWhatYouLearn(e.target.value)} placeholder="e.g. React hooks, TypeScript basics, API integration" />
              </div>

              <div className="cb-info-row-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label className="cb-label">Category</label>
                  <select className="cb-input cb-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Data Science">Data Science</option>
                    <option value="DevOps">DevOps</option>
                    <option value="Business">Business</option>
                  </select>
                </div>
                
                <div>
                  <label className="cb-label">Difficulty</label>
                  <select className="cb-input cb-select" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="cb-label">Duration (Weeks)</label>
                  <input type="number" className="cb-input" value={durationWeeks} onChange={(e) => setDurationWeeks(Number(e.target.value))} min={1} />
                </div>

                <div>
                  <label className="cb-label">Language</label>
                  <input className="cb-input" value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="e.g. English" />
                </div>
              </div>

              <div className="cb-checkbox-row">
                <label className="cb-checkbox-label">
                  <input type="checkbox" checked={isFree} onChange={(e) => { setIsFree(e.target.checked); if (e.target.checked) setPrice(0); }} />
                  <span>Make this course free for students</span>
                </label>

                {!isFree && (
                  <div className="cb-price-row">
                    <span>Price ($)</span>
                    <input type="number" className="cb-input" style={{ width: '100px', padding: '0.35rem 0.5rem' }} value={price} onChange={(e) => setPrice(Number(e.target.value))} min={0} />
                  </div>
                )}
              </div>
            </div>

            <div className="cb-info-thumbnail">
              <div className="cb-section-label-row">
                <label className="cb-label"><Image size={15} /> Course Thumbnail</label>
                {(thumbnailUrl || thumbnailPreview) && (
                  <button className="cb-icon-btn danger" onClick={() => {
                    setThumbnailUrl(undefined);
                    setThumbnailPreview(undefined);
                  }}>
                    <X size={14} />
                  </button>
                )}
              </div>
              
              <div style={{ marginTop: '0.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {thumbnailPreview || thumbnailUrl ? (
                  <div className="cb-thumbnail-preview" style={{ maxWidth: '100%' }}>
                    <img src={thumbnailPreview || thumbnailUrl} alt="Thumbnail" />
                  </div>
                ) : (
                  <FileUpload category="course_content" acceptedTypes="image/png,image/jpeg,image/webp"
                    maxSizeMB={5} onUploadComplete={(p, file) => {
                      setThumbnailUrl(p);
                      if (file) setThumbnailPreview(URL.createObjectURL(file));
                    }} />
                )}
              </div>
            </div>
          </div>
        </Card>

      {/* Curriculum */}
      {!isNew && (
        <div className="cb-curriculum">
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 600 }}>
            Curriculum Builder
          </h3>
          
          {localSections.length === 0 && (
             <div className="cb-section-empty" style={{ padding: '4rem 2rem', border: '2px dashed var(--border)', borderRadius: '1rem', textAlign: 'center', background: 'var(--surface-well)' }}>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Your course is empty!</h4>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
                  Start by adding a module, then you can upload <strong>Videos, PDFs, Documents, and Links</strong>.
                </p>
                <Button variant="primary" size="lg" leftIcon={<Plus size={20} />} onClick={addSection}>
                  Add Your First Module
                </Button>
             </div>
          )}

          {localSections.map((section, sIdx) => {
            const isExpanded = expandedSection === section.id;
            const isDragOver = dragOverSectionId === section.id;
            return (
              <Card
                key={section.id}
                className={`cb-section-card${isDragOver ? ' drag-over' : ''}`}
                draggable
                onDragStart={(e) => handleSectionDragStart(e, sIdx)}
                onDragOver={(e) => handleSectionDragOver(e, section.id)}
                onDragEnd={handleSectionDragEnd}
                onDrop={(e) => handleSectionDrop(e, sIdx)}
              >
                <div className="cb-section-header">
                  <div className="cb-section-left">
                    <GripVertical size={20} className="cb-grip" style={{ cursor: 'grab' }} />
                    <input className="cb-section-title-input" value={section.title}
                      onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()} />
                    <span className="cb-count-badge">{section.lectures.length} lessons</span>
                  </div>
                  <div className="cb-section-right">
                    <button
                      className="cb-icon-btn"
                      onClick={(e) => { e.stopPropagation(); moveSection(sIdx, 'up'); }}
                      disabled={sIdx === 0}
                      title="Move Module Up"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      className="cb-icon-btn"
                      onClick={(e) => { e.stopPropagation(); moveSection(sIdx, 'down'); }}
                      disabled={sIdx === localSections.length - 1}
                      title="Move Module Down"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button className="cb-icon-btn danger" onClick={() => deleteSection(section.id)}><Trash2 size={15} /></button>
                    <button className="cb-icon-btn" onClick={() => setExpandedSection(isExpanded ? null : section.id)}>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div
                    className="cb-lectures"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleLecturesContainerDrop(e, section.id)}
                  >
                    {section.lectures.length === 0 && (
                      <div className="cb-section-empty">
                        <Upload size={22} style={{ opacity: 0.4 }} />
                        <p>No lessons yet — click <strong>Add Lesson</strong> below to upload a video, PDF, document, or write a text lesson.</p>
                      </div>
                    )}
                    {section.lectures.map((lec, lIdx) => {
                      const isEditing = editingLectureId === lec.id;
                      const meta = LECTURE_TYPE_META[lec.type];
                      const status = getLectureStatus(lec);
                      const badge = STATUS_BADGE[status];
                      const isLecDragOver = dragOverLectureId === lec.id;
                      return (
                        <div
                          key={lec.id}
                          className={`cb-lecture-wrapper${isLecDragOver ? ' drag-over' : ''}`}
                          draggable
                          onDragStart={(e) => handleLectureDragStart(e, section.id, lIdx)}
                          onDragOver={(e) => handleLectureDragOver(e, lec.id)}
                          onDragEnd={handleLectureDragEnd}
                          onDrop={(e) => handleLectureDrop(e, section.id, lIdx)}
                        >
                          <div
                            className={`cb-lecture-row${isEditing ? ' active' : ''}`}
                            onClick={() => setEditingLectureId(isEditing ? null : lec.id)}
                            title={isEditing ? 'Click to collapse' : 'Click to edit & upload content'}
                          >
                            <div className="cb-lecture-left">
                              <GripVertical size={16} className="cb-grip-sm" style={{ cursor: 'grab' }} />
                              <span className="cb-lec-type-icon" style={{ color: meta.color }}>{meta.icon}</span>
                              <span className="cb-lecture-title">{lec.title}</span>
                            </div>
                            <div className="cb-lecture-right">
                              <span className="cb-status-badge" style={{ color: badge.color }}>{badge.label}</span>
                              {lec.is_free_preview && <span className="cb-free-badge"><Eye size={11} /> Free</span>}
                              
                              <button
                                className="cb-icon-btn"
                                onClick={(e) => { e.stopPropagation(); moveLecture(section.id, lIdx, 'up'); }}
                                disabled={lIdx === 0}
                                title="Move Lesson Up"
                              >
                                <ChevronUp size={14} />
                              </button>
                              <button
                                className="cb-icon-btn"
                                onClick={(e) => { e.stopPropagation(); moveLecture(section.id, lIdx, 'down'); }}
                                disabled={lIdx === section.lectures.length - 1}
                                title="Move Lesson Down"
                              >
                                <ChevronDown size={14} />
                              </button>

                              {!isEditing && status === 'empty' && (
                                <span className="cb-edit-hint" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '2px 8px', borderRadius: '12px', fontWeight: 600, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Upload size={12} /> Upload Content
                                </span>
                              )}
                              <button className="cb-icon-btn danger"
                                onClick={(e) => { e.stopPropagation(); deleteLecture(section.id, lec.id); }}>
                                <Trash2 size={14} />
                              </button>
                              {isEditing ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </div>
                          {isEditing && (
                            <LectureEditPanel lecture={lec} sectionId={section.id}
                              onChange={(updated) => updateLecture(section.id, updated)} />
                          )}
                        </div>
                      );
                    })}
                    <Button variant="ghost" leftIcon={<Plus size={16} />}
                      style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}
                      onClick={() => setTypePickerFor({ sectionId: section.id })}>
                      Add Lesson
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
          
          {localSections.length > 0 && (
            <Button variant="outline" size="lg" leftIcon={<Plus size={20} />}
              style={{ marginTop: '0.5rem' }} onClick={addSection}>
              Add Module
            </Button>
          )}
        </div>
      )}

      {typePickerFor && (
        <TypePickerModal
          onPick={(type) => addLecture(typePickerFor.sectionId, type)}
          onClose={() => setTypePickerFor(null)}
        />
      )}

      {/* Pre-Publish Checklist Modal */}
      <Modal isOpen={isPublishModalOpen} onClose={() => setIsPublishModalOpen(false)} title="Course Publish Checklist">
        <div className="cb-publish-modal">
          <p className="cb-publish-modal-desc">
            We are checking if the course is ready to be published. Students will gain access to these modules and lessons once published.
          </p>

          {/* Errors List */}
          {pubErrors.length > 0 && (
            <div className="cb-checklist-group errors">
              <h4>🔴 Critical Issues ({pubErrors.length})</h4>
              <ul className="cb-checklist">
                {pubErrors.map((err, idx) => (
                  <li key={idx} className="cb-checklist-item error">
                    <AlertCircle size={16} />
                    <span>{err}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings List */}
          {pubWarnings.length > 0 && (
            <div className="cb-checklist-group warnings">
              <h4>🟡 Optimization Suggestions ({pubWarnings.length})</h4>
              <ul className="cb-checklist">
                {pubWarnings.map((warn, idx) => (
                  <li key={idx} className="cb-checklist-item warning">
                    <AlertCircle size={16} />
                    <span>{warn}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Success State */}
          {pubErrors.length === 0 && pubWarnings.length === 0 && (
            <div className="cb-checklist-success">
              <Check size={48} color="#22c55e" style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '0.75rem', borderRadius: '50%', marginBottom: '1rem', display: 'inline-flex' }} />
              <h4>Your course is ready!</h4>
              <p>All core settings are complete and all curriculum lessons have content uploaded.</p>
            </div>
          )}

          <div className="cb-publish-modal-actions">
            <Button variant="outline" onClick={() => setIsPublishModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={hasErrors || publishMutation.isPending}
              onClick={() => {
                setIsPublishModalOpen(false);
                publishMutation.mutate();
              }}
            >
              {publishMutation.isPending ? 'Publishing...' : 'Confirm Publish'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
