import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../../store/auth.store';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import api from '../../../lib/api';
import './ResumeDropzone.css';

interface ResumeDropzoneProps {
  onUploadSuccess?: (url: string) => void;
  className?: string;
}

export const ResumeDropzone: React.FC<ResumeDropzoneProps> = ({ onUploadSuccess, className = '' }) => {
  const { user, checkAuth } = useAuthStore();
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCoords = useRef({ x: 0, y: 0 });
  const animationFrameId = useRef<number | null>(null);

  // Parse user resume URL to get file name
  const existingResumeUrl = (user as any)?.resumeUrl || '';
  const existingResumeName = existingResumeUrl 
    ? decodeURIComponent(existingResumeUrl.substring(existingResumeUrl.lastIndexOf('/') + 1)).split('?')[0] 
    : null;

  // Drag handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropzoneRef.current && !dropzoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragActive(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropzoneRef.current) {
      const rect = dropzoneRef.current.getBoundingClientRect();
      dragCoords.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const processFile = async (file: File) => {
    if (!file) return;
    const isPDFOrDoc = file.type === 'application/pdf' || 
                       file.type === 'application/msword' || 
                       file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                       file.name.endsWith('.pdf') ||
                       file.name.endsWith('.doc') ||
                       file.name.endsWith('.docx');

    if (!isPDFOrDoc) {
      setError('Please upload a PDF, DOC, or DOCX document.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB.');
      return;
    }

    setError(null);
    setSuccess(false);
    setUploading(true);
    setFileName(file.name);

    try {
      // 1. Get presigned URL from backend
      const response = await api.post('/upload/presigned', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        category: 'placement_resume'
      });

      const { signedUrl, publicUrl } = response.data.data;
      if (!signedUrl || !publicUrl) throw new Error('No URL returned from upload server');

      // 2. Upload directly to Supabase Storage
      await axios.put(signedUrl, file, {
        headers: {
          'Content-Type': file.type
        }
      });

      // 3. Update profile
      await api.put('/users/me', { resumeUrl: publicUrl });
      // Sync auth state
      await checkAuth();
      setSuccess(true);
      if (onUploadSuccess) {
        onUploadSuccess(publicUrl);
      }
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        err.message ||
        'Failed to upload resume. Please try again.';
      setError(message);
      setFileName(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Magnetic Grid Particles Canvas Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    // Particle class for the grid
    class Dot {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      color: string;
      size: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.baseX = x;
        this.baseY = y;
        this.color = 'rgba(99, 102, 241, 0.15)';
        this.size = 1.2;
      }

      update(mx: number, my: number, active: boolean) {
        if (!active) {
          // Spring back to base position
          this.x += (this.baseX - this.x) * 0.1;
          this.y += (this.baseY - this.y) * 0.1;
          this.color = 'rgba(99, 102, 241, 0.15)';
          this.size = 1.2;
          return;
        }

        const dx = mx - this.x;
        const dy = my - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 95;

        if (dist < maxDist) {
          // Magnetic pull: pull dots slightly towards cursor
          const force = (maxDist - dist) / maxDist;
          this.x += dx * force * 0.18;
          this.y += dy * force * 0.18;
          
          // Glow effects
          const ratio = (maxDist - dist) / maxDist;
          this.color = `rgba(99, 102, 241, ${0.15 + ratio * 0.75})`;
          this.size = 1.2 + ratio * 2.2;
        } else {
          // Spring back
          this.x += (this.baseX - this.x) * 0.15;
          this.y += (this.baseY - this.y) * 0.15;
          this.color = 'rgba(99, 102, 241, 0.15)';
          this.size = 1.2;
        }
      }

      draw(c: CanvasRenderingContext2D) {
        c.fillStyle = this.color;
        c.beginPath();
        c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        c.fill();
      }
    }

    // Generate grid dots
    const dots: Dot[] = [];
    const spacing = 18;
    const generateDots = (w: number, h: number) => {
      dots.length = 0;
      for (let x = spacing / 2; x < w; x += spacing) {
        for (let y = spacing / 2; y < h; y += spacing) {
          dots.push(new Dot(x, y));
        }
      }
    };
    generateDots(width, height);

    const resizeObserver = new ResizeObserver(() => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      generateDots(width, height);
    });
    resizeObserver.observe(canvas);

    // Active cursor glow particles
    interface GlowParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
    }
    const glowParticles: GlowParticle[] = [];

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Render & update grid dots
      dots.forEach(dot => {
        dot.update(dragCoords.current.x, dragCoords.current.y, isDragActive);
        dot.draw(ctx);
      });

      // Render drag cursor effects if active
      if (isDragActive) {
        // Spawn active trail particles
        if (Math.random() < 0.45) {
          glowParticles.push({
            x: dragCoords.current.x + (Math.random() - 0.5) * 15,
            y: dragCoords.current.y + (Math.random() - 0.5) * 15,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            life: 0,
            maxLife: 30 + Math.random() * 20,
            size: 1.5 + Math.random() * 2
          });
        }

        // Draw cursor connection web (magnetic lines)
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)';
        ctx.lineWidth = 1;
        dots.forEach(dot => {
          const dx = dragCoords.current.x - dot.x;
          const dy = dragCoords.current.y - dot.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 75) {
            ctx.beginPath();
            ctx.moveTo(dragCoords.current.x, dragCoords.current.y);
            ctx.lineTo(dot.x, dot.y);
            ctx.stroke();
          }
        });
      }

      // Render glowing trail particles
      for (let i = glowParticles.length - 1; i >= 0; i--) {
        const p = glowParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const alpha = 1 - p.life / p.maxLife;
        ctx.fillStyle = `rgba(165, 180, 252, ${alpha * 0.7})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        if (p.life >= p.maxLife) {
          glowParticles.splice(i, 1);
        }
      }

      animationFrameId.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      resizeObserver.disconnect();
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isDragActive]);

  return (
    <div className={`resume-dropzone-container ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        disabled={uploading}
      />
      
      <div
        ref={dropzoneRef}
        className={`resume-dropzone ${isDragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
      >
        <canvas ref={canvasRef} className="resume-dropzone-canvas" />

        <div className="resume-dropzone-content">
          {uploading ? (
            <div className="resume-dropzone-state animate-pulse">
              <Loader2 className="resume-dropzone-icon spinner" />
              <div className="resume-dropzone-label">Uploading Resume</div>
              <div className="resume-dropzone-sub">{fileName || 'Syncing credentials...'}</div>
            </div>
          ) : success ? (
            <div className="resume-dropzone-state success">
              <CheckCircle className="resume-dropzone-icon icon-success" />
              <div className="resume-dropzone-label font-serif font-bold text-lg">Resume Uploaded!</div>
              <div className="resume-dropzone-sub">Your credentials are updated.</div>
            </div>
          ) : (
            <div className="resume-dropzone-state">
              <Upload className="resume-dropzone-icon" />
              <div className="resume-dropzone-label">
                {isDragActive ? 'Drop your file here' : 'Drag & Drop Resume'}
              </div>
              <p className="resume-dropzone-description">
                or click to browse from device
              </p>
              <div className="resume-dropzone-formats">
                PDF, DOCX, DOC • Max 10MB
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="resume-dropzone-error">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {existingResumeUrl && !uploading && !success && (
        <div className="existing-resume-pill">
          <FileText size={14} className="text-indigo-400" />
          <span className="existing-resume-name">{existingResumeName || 'Linked Resume'}</span>
          <a href={existingResumeUrl} target="_blank" rel="noreferrer" className="existing-resume-link">
            View / Verify
          </a>
        </div>
      )}
    </div>
  );
};
