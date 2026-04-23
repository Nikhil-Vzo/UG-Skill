import React, { useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, UploadCloud, FileText, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/loaders/Skeleton';
import api from '../lib/api';

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  id: string;
}

export const AssignmentSubmit: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const fileRefs = useRef<File[]>([]);

  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [fileErrors, setFileErrors] = useState<string[]>([]);

  // Fetch assignment details
  const { data: ASSIGNMENT, isLoading: loadingAssignment } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      const res = await api.get(`/lms/assignments/${assignmentId}`);
      return res.data.data ?? res.data;
    },
    enabled: !!assignmentId,
    // Fallback shape while loading
    placeholderData: {
      title: 'Loading...',
      course: '',
      dueDate: '',
      maxFiles: 3,
      allowedTypes: ['.zip', '.pdf', '.tsx', '.jsx'],
      description: '',
    },
  });

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  };

  const addFiles = useCallback((newFiles: File[]) => {
    const allowed: string[] = ASSIGNMENT?.allowedTypes ?? [];
    const MAX_BYTES = 50 * 1024 * 1024; // 50 MB
    const errors: string[] = [];
    const valid: File[] = [];

    newFiles.forEach((f) => {
      // Extension check (allowedTypes are like '.pdf', '.zip')
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      if (allowed.length && !allowed.includes(ext)) {
        errors.push(`"${f.name}" — unsupported type (allowed: ${allowed.join(', ')})`);
        return;
      }
      if (f.size > MAX_BYTES) {
        errors.push(`"${f.name}" — file exceeds 50 MB limit (${(f.size / 1048576).toFixed(1)} MB)`);
        return;
      }
      valid.push(f);
    });

    setFileErrors(errors);

    const next = [...fileRefs.current, ...valid].slice(0, ASSIGNMENT?.maxFiles ?? 3);
    fileRefs.current = next;
    setFiles(next.map(f => ({ name: f.name, size: f.size, type: f.type, id: `${f.name}-${f.size}` })));
  }, [ASSIGNMENT?.allowedTypes, ASSIGNMENT?.maxFiles]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    addFiles(dropped);
  }, [addFiles]);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    fileRefs.current = fileRefs.current.filter(f => `${f.name}-${f.size}` !== id);
    setFileErrors([]);
  };

  const handleSubmit = async () => {
    if (fileRefs.current.length === 0) return;
    setStatus('submitting');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      fileRefs.current.forEach(f => formData.append('files', f));
      if (comment.trim()) formData.append('note', comment.trim());

      // Simulate progress bar during upload
      const progressInterval = setInterval(() => {
        setUploadProgress(p => Math.min(p + 15, 90));
      }, 200);

      const res = await api.put(`/lms/assignments/${assignmentId}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      setSubmissionId(res.data.data?.submissionId ?? res.data?.submissionId ?? null);
      setStatus('success');
    } catch {
      setStatus('error');
      setUploadProgress(0);
    }
  };

  if (loadingAssignment) {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Skeleton variant="text" width="40%" height="32px" />
        <Skeleton variant="rectangular" height={150} />
        <Skeleton variant="rectangular" height={180} />
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%', padding: '4rem 2rem' }}>
        <div className="glass-panel" style={{ maxWidth: 480, width: '100%', padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '2px solid var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={36} color="var(--success)" />
          </div>
          <div>
            <h2 style={{ color: 'var(--text-high)', fontSize: '1.5rem', fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>Submission Received</h2>
            <p style={{ color: 'var(--text-low)', fontSize: '0.9375rem' }}>Your work has been transmitted to the assessment system. The instructor will review and respond within 48 hours.</p>
          </div>
          <div className="surface-well" style={{ padding: '0.75rem 1.25rem', width: '100%', textAlign: 'left' }}>
            <p style={{ color: 'var(--text-low)', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>Submission ID</p>
          <p style={{ color: 'var(--primary-glow)', fontFamily: 'monospace', fontWeight: 700 }}>
            {submissionId ?? `SUB-2026-${Math.floor(Math.random() * 90000) + 10000}`}
          </p>
          </div>
          <Button variant="primary" onClick={() => navigate(-1)} fullWidth>Return to Course</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-low)', display: 'flex' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ color: 'var(--text-high)', fontFamily: 'var(--font-display)', fontSize: '1.5rem', margin: 0 }}>Assignment Submission</h1>
          <p style={{ color: 'var(--text-low)', fontSize: '0.875rem', margin: 0 }}>{ASSIGNMENT.course}</p>
        </div>
      </div>

      {/* Assignment Details */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary-glow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ color: 'var(--text-high)', fontSize: '1.125rem', margin: 0 }}>{ASSIGNMENT.title}</h2>
          <Badge variant="warning" size="sm">Due {ASSIGNMENT.dueDate}</Badge>
        </div>
        <p style={{ color: 'var(--text-medium)', fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>{ASSIGNMENT.description}</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-low)' }}>
            <FileText size={13} />
            <span>Max {ASSIGNMENT.maxFiles} files</span>
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-low)' }}>
            Accepted: {ASSIGNMENT.allowedTypes.join(', ')}
          </div>
        </div>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => document.getElementById('file-input')?.click()}
        style={{
          border: `2px dashed ${isDragging ? 'var(--primary-glow)' : 'var(--surface-highest)'}`,
          background: isDragging ? 'var(--primary-low)' : 'var(--surface-container)',
          padding: '3rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          cursor: files.length >= (ASSIGNMENT?.maxFiles ?? 3) ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          position: 'relative',
          pointerEvents: files.length >= (ASSIGNMENT?.maxFiles ?? 3) ? 'none' : 'auto',
        }}
      >
        <input
          id="file-input"
          type="file"
          multiple
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
          onChange={onFileInput}
          accept={(ASSIGNMENT?.allowedTypes ?? []).join(',')}
        />
        <div style={{ width: 56, height: 56, background: isDragging ? 'var(--primary-glow)' : 'var(--surface-highest)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <UploadCloud size={26} color={isDragging ? 'white' : 'var(--text-low)'} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-high)', margin: 0, fontWeight: 600 }}>
            {isDragging ? 'Drop to upload' : 'Drag & drop your files here'}
          </p>
          <p style={{ color: 'var(--text-low)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            or click to browse your filesystem
          </p>
        </div>
        {files.length >= (ASSIGNMENT?.maxFiles ?? 3) && (
          <Badge variant="warning" size="sm">Max files reached ({ASSIGNMENT?.maxFiles ?? 3})</Badge>
        )}
      </div>

      {/* File Validation Errors */}
      {fileErrors.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {fileErrors.map((err, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.8125rem', color: 'var(--error)' }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              {err}
            </div>
          ))}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h3 style={{ color: 'var(--text-low)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 0.5rem' }}>Queued Files</h3>
          {files.map(f => (
            <div key={f.id} className="surface-well" style={{ padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FileText size={18} color="var(--primary-glow)" />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, color: 'var(--text-high)', fontWeight: 500, fontSize: '0.9375rem' }}>{f.name}</p>
                <p style={{ margin: 0, color: 'var(--text-low)', fontSize: '0.75rem' }}>{formatBytes(f.size)}</p>
              </div>
              <button
                onClick={() => removeFile(f.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-low)', display: 'flex', padding: '0.25rem' }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Comment */}
      <div>
        <label style={{ display: 'block', color: 'var(--text-low)', fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
          Submission Note (optional)
        </label>
        <textarea
          placeholder="Describe your approach, mention any known issues, or add context for the instructor..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          style={{ width: '100%', minHeight: 100, background: 'var(--surface-well)', border: '1px solid var(--surface-highest)', color: 'var(--text-high)', padding: '0.875rem', fontSize: '0.9375rem', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }}
        />
      </div>

      {/* Progress Bar */}
      {status === 'submitting' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-low)' }}>
            <span>Transmitting to S3...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div style={{ width: '100%', height: 4, background: 'var(--surface-highest)' }}>
            <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--primary-glow)', transition: 'width 0.15s ease' }} />
          </div>
        </div>
      )}

      {/* Submit */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          isLoading={status === 'submitting'}
          disabled={files.length === 0 || status === 'submitting'}
          leftIcon={<UploadCloud size={18} />}
        >
          Submit Assignment
        </Button>
        <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
        {files.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--warning)' }}>
            <AlertTriangle size={14} /> At least one file is required.
          </div>
        )}
        {status === 'error' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--error)' }}>
            <AlertTriangle size={14} /> Submission failed. Please try again or contact support.
          </div>
        )}
      </div>
    </div>
  );
};
