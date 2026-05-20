import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Plus, PenTool, Trash2, BookOpen, Users, Globe, Lock,
  AlertTriangle, X, Search, Filter, MoreVertical, Eye,
  Layers, GraduationCap, BarChart2, RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { TextInput } from '../../components/ui/TextInput';
import { Select } from '../../components/ui/Select';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import './AdminCourses.css';


interface CatalogCourse {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  level?: string;
  difficulty?: string;
  status?: string;
  price?: number;
  is_free?: boolean;
  thumbnail_url?: string;
  sections?: any[];
  enrolledCount?: number;
}

/* ── helpers ── */
const statusColor = (s?: string) =>
  s === 'published' ? { bg: 'rgba(34,197,94,0.12)', color: '#22c55e' }
  : s === 'archived' ? { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' }
  : { bg: 'rgba(234,179,8,0.12)', color: '#eab308' };

const CATEGORY_EMOJI: Record<string, string> = {
  Engineering: '⚙️', Design: '🎨', 'Data Science': '📊',
  DevOps: '🚀', Business: '💼',
};

/* ── DeleteConfirm dialog ── */
const DeleteDialog: React.FC<{
  course: CatalogCourse;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}> = ({ course, onConfirm, onCancel, isLoading }) => (
  <Modal isOpen={true} onClose={onCancel} title="Delete Course?">
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        Are you sure you want to delete <strong>"{course.title}"</strong>? This will permanently delete all its
        sections, lectures, and enrolled student data. This action cannot be undone.
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant="primary" style={{ backgroundColor: 'var(--error)', borderColor: 'var(--error)' }} onClick={onConfirm} disabled={isLoading}>
          {isLoading ? 'Deleting…' : 'Yes, Delete Course'}
        </Button>
      </div>
    </div>
  </Modal>
);

/* ── Course Card ── */
const CourseCard: React.FC<{
  course: CatalogCourse;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}> = ({ course, onEdit, onDelete, onView }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const sc = statusColor(course.status);
  const sectionCount = course.sections?.length ?? 0;
  const lectureCount = course.sections?.reduce((a: number, s: any) => a + (s.lectures?.length ?? 0), 0) ?? 0;
  const emoji = CATEGORY_EMOJI[course.category ?? ''] ?? '📚';

  return (
    <div className="ac-card">
      {/* Thumbnail */}
      <div className="ac-card-thumb">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} />
        ) : (
          <div className="ac-card-thumb-placeholder">
            <span className="ac-thumb-emoji">{emoji}</span>
          </div>
        )}
        {/* Status badge */}
        <span className="ac-status-pill" style={{ background: sc.bg, color: sc.color }}>
          {course.status === 'published' ? <Globe size={10} /> : <Lock size={10} />}
          {course.status ?? 'draft'}
        </span>
        {/* Price badge */}
        <span className="ac-price-pill">
          {course.is_free ? 'Free' : `$${course.price ?? 0}`}
        </span>
      </div>

      {/* Body */}
      <div className="ac-card-body">
        <div className="ac-card-meta">
          <span className="ac-category-tag">{course.category ?? 'Uncategorized'}</span>
          <span className="ac-level-tag" style={{ textTransform: 'capitalize' }}>
            {course.level ?? course.difficulty ?? 'All levels'}
          </span>
        </div>
        <h3 className="ac-card-title">{course.title}</h3>
        {course.description && (
          <p className="ac-card-desc">{course.description}</p>
        )}
        <div className="ac-card-stats">
          <span><Layers size={13} /> {sectionCount} modules</span>
          <span><BookOpen size={13} /> {lectureCount} lessons</span>
          {course.enrolledCount ? (
            <span><Users size={13} /> {course.enrolledCount} enrolled</span>
          ) : null}
        </div>
      </div>

      {/* Actions */}
      <div className="ac-card-footer">
        <button className="ac-action-btn primary" onClick={onEdit}>
          <PenTool size={14} /> Open Builder
        </button>
        <button className="ac-action-btn danger-outline" onClick={onDelete} title="Delete Course">
          <Trash2 size={14} />
        </button>
        <div className="ac-card-menu-wrap">
          <button
            className="ac-action-btn icon"
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div className="ac-dropdown" onMouseLeave={() => setMenuOpen(false)}>
              <button className="ac-dd-item" onClick={() => { setMenuOpen(false); onView(); }}>
                <Eye size={14} /> View as Student
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Main Component ── */
export const AdminCourses: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toDelete, setToDelete] = useState<CatalogCourse | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [formData, setFormData] = useState({
    title: '', description: '', category: 'Engineering',
    level: 'beginner', is_free: false, price: 0,
  });

  const { data: courses = [], isLoading } = useQuery<CatalogCourse[]>({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      try {
        console.log('Fetching courses for admin...');
        const res = await api.get('/lms/courses?limit=100&status=all');
        console.log('Admin Courses API Response:', {
          status: res.status,
          data: res.data,
          dataType: typeof res.data.data,
          isArray: Array.isArray(res.data.data)
        });
        const raw = res.data.data;
        if (Array.isArray(raw)) return raw;
        if (raw && typeof raw === 'object' && Array.isArray(raw.courses)) return raw.courses;
        if (raw && typeof raw === 'object' && Array.isArray(raw.data)) return raw.data;
        return [];
      } catch (err) {
        console.error('Failed to fetch courses:', err);
        throw err;
      }
    }
  });

  const createMut = useMutation({
    mutationFn: (payload: any) => api.post('/lms/courses', payload),
    onSuccess: (res) => {
      toast.success('Course created! Opening builder…');
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      const id = res.data.data?.id || res.data.data?._id;
      if (id) navigate(`/app/admin/courses/${id}/builder`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create course'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/lms/courses/${id}`),
    onSuccess: () => {
      toast.success('Course deleted');
      setToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) { toast.error('Title is required'); return; }
    createMut.mutate(formData);
  };

  const filtered = courses.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || (c.status ?? 'draft') === filterStatus;
    return matchSearch && matchStatus;
  });

  const published = courses.filter((c) => c.status === 'published').length;
  const drafts = courses.filter((c) => !c.status || c.status === 'draft').length;

  return (
    <div className="ac-root">
      {/* Header */}
      <header className="ac-header">
        <div>
          <h1 className="ac-heading">
            <GraduationCap size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Course Management
          </h1>
          <p className="ac-subheading">Create, edit, and publish your course catalog</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Button
            variant="outline"
            leftIcon={<RefreshCw size={18} className={isLoading ? 'cb-spin' : ''} />}
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-courses'] })}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            leftIcon={<Plus size={18} />}
            onClick={() => setIsCreateOpen(true)}
          >
            Create Course
          </Button>
        </div>
      </header>

      {/* Stats Row */}
      <div className="ac-stats-row">
        <div className="ac-stat-card">
          <BookOpen size={20} style={{ color: '#6366f1' }} />
          <div>
            <div className="ac-stat-value">{courses.length}</div>
            <div className="ac-stat-label">Total Courses</div>
          </div>
        </div>
        <div className="ac-stat-card">
          <Globe size={20} style={{ color: '#22c55e' }} />
          <div>
            <div className="ac-stat-value">{published}</div>
            <div className="ac-stat-label">Published</div>
          </div>
        </div>
        <div className="ac-stat-card">
          <Lock size={20} style={{ color: '#eab308' }} />
          <div>
            <div className="ac-stat-value">{drafts}</div>
            <div className="ac-stat-label">Drafts</div>
          </div>
        </div>
        <div className="ac-stat-card">
          <BarChart2 size={20} style={{ color: '#06b6d4' }} />
          <div>
            <div className="ac-stat-value">
              {courses.reduce((a, c) => a + (c.sections?.reduce((x: number, s: any) => x + (s.lectures?.length ?? 0), 0) ?? 0), 0)}
            </div>
            <div className="ac-stat-label">Total Lessons</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="ac-filter-bar">
        <div className="ac-search-wrap">
          <Search size={16} className="ac-search-icon" />
          <input
            className="ac-search-input"
            placeholder="Search courses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ac-filter-tabs">
          {['all', 'published', 'draft'].map((s) => (
            <button
              key={s}
              className={`ac-filter-tab${filterStatus === s ? ' active' : ''}`}
              onClick={() => setFilterStatus(s)}
            >
              <Filter size={12} />
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="ac-loading">
          {[1, 2, 3].map((i) => <div key={i} className="ac-skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="ac-empty">
          <div className="ac-empty-icon">📚</div>
          <h3>{search ? 'No courses match your search' : 'No courses yet'}</h3>
          <p>{search ? 'Try a different search term.' : 'Click "Create Course" to build your first course.'}</p>
          {!search && (
            <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setIsCreateOpen(true)}>
              Create Your First Course
            </Button>
          )}
        </div>
      ) : (
        <div className="ac-grid">
          {filtered.map((course) => (
            <CourseCard
              key={course._id}
              course={course}
              onEdit={() => navigate(`/app/admin/courses/${course._id}/builder`)}
              onDelete={() => setToDelete(course)}
              onView={() => navigate(`/app/courses/${course._id}`)}
            />
          ))}
          {/* Add new card */}
          <button className="ac-new-card" onClick={() => setIsCreateOpen(true)}>
            <Plus size={32} />
            <span>New Course</span>
          </button>
        </div>
      )}

      {/* Delete Confirm */}
      {toDelete && (
        <DeleteDialog
          course={toDelete}
          onConfirm={() => deleteMut.mutate(toDelete._id)}
          onCancel={() => setToDelete(null)}
          isLoading={deleteMut.isPending}
        />
      )}

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Course">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <TextInput
            label="Course Title *"
            placeholder="e.g. Advanced System Design"
            value={formData.title}
            onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
            required
          />
          <TextInput
            label="Short Description"
            placeholder="A compelling overview of what students will learn"
            value={formData.description}
            onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Select
              label="Category"
              options={[
                { label: '⚙️ Engineering', value: 'Engineering' },
                { label: '🎨 Design', value: 'Design' },
                { label: '📊 Data Science', value: 'Data Science' },
                { label: '🚀 DevOps', value: 'DevOps' },
                { label: '💼 Business', value: 'Business' },
              ]}
              value={formData.category}
              onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
            />
            <Select
              label="Difficulty"
              options={[
                { label: 'Beginner', value: 'beginner' },
                { label: 'Intermediate', value: 'intermediate' },
                { label: 'Advanced', value: 'advanced' },
              ]}
              value={formData.level}
              onChange={(e) => setFormData((p) => ({ ...p, level: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-primary)', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={formData.is_free}
                onChange={(e) => setFormData((p) => ({ ...p, is_free: e.target.checked, price: e.target.checked ? 0 : p.price }))}
                style={{ width: 16, height: 16, accentColor: '#6366f1' }}
              />
              Free course
            </label>
            {!formData.is_free && (
              <TextInput
                type="number"
                placeholder="Price ($)"
                value={formData.price}
                onChange={(e) => setFormData((p) => ({ ...p, price: Number(e.target.value) }))}
                style={{ width: '120px' }}
              />
            )}
          </div>
          <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
            💡 After creating, you'll be taken straight to the <strong style={{ color: 'var(--text-primary)' }}>Course Builder</strong> to add modules, upload videos, PDFs, and write lessons.
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
              <X size={16} /> Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={createMut.isPending}>
              Create & Open Builder →
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
