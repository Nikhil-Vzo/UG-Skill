import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, PenTool, LayoutDashboard } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { TextInput } from '../../components/ui/TextInput';
import { Select } from '../../components/ui/Select';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface CatalogCourse {
  _id: string;
  title: string;
  category?: string;
  level?: string;
  status?: string;
  price?: number;
  is_free?: boolean;
}

export const AdminCourses: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Engineering',
    level: 'beginner',
    is_free: false,
    price: 0
  });

  const { data: courses = [], isLoading } = useQuery<CatalogCourse[]>({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      // For MVP, we fetch a large limit. In production, add pagination.
      const res = await api.get('/lms/courses?limit=100');
      return res.data.data?.courses ?? res.data.data ?? res.data ?? [];
    }
  });

  const createMut = useMutation({
    mutationFn: (payload: any) => api.post('/lms/courses', payload),
    onSuccess: (res) => {
      toast.success('Course created successfully!');
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      // Navigate to the curriculum builder with the new ID
      const newCourseId = res.data.data?.id || res.data.data?._id;
      if (newCourseId) {
        navigate(`/app/admin/courses/${newCourseId}/builder`);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create course');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error('Title is required');
      return;
    }
    createMut.mutate(formData);
  };

  const columns = [
    { key: 'title', header: 'Title' },
    { key: 'category', header: 'Category' },
    { key: 'level', header: 'Level', render: (row: CatalogCourse) => <span style={{ textTransform: 'capitalize' }}>{row.level || 'All Levels'}</span> },
    { key: 'status', header: 'Status', render: (row: CatalogCourse) => (
      <span style={{
        background: row.status === 'published' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
        color: row.status === 'published' ? 'var(--success)' : 'var(--warning)',
        padding: '0.25rem 0.5rem',
        borderRadius: '12px',
        fontSize: '0.75rem',
        textTransform: 'capitalize'
      }}>
        {row.status || 'draft'}
      </span>
    )},
    { key: 'price', header: 'Price', render: (row: CatalogCourse) => row.is_free ? 'Free' : `$${row.price || 0}` },
    { key: 'actions', header: 'Actions', render: (row: CatalogCourse) => (
      <Button 
        variant="outline" 
        size="sm" 
        leftIcon={<PenTool size={14} />}
        onClick={() => navigate(`/app/admin/courses/${row._id}/builder`)}
      >
        Builder
      </Button>
    )}
  ];

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '2rem' }}>Courses</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Manage all courses and curriculums</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
          Create Course
        </Button>
      </header>

      <Card>
        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading courses...</div>
        ) : (
          <DataTable data={courses} columns={columns} />
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Course">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <TextInput 
            label="Course Title" 
            placeholder="e.g. Advanced System Design"
            value={formData.title}
            onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
            required
          />
          <TextInput 
            label="Short Description" 
            placeholder="A brief overview of the course"
            value={formData.description}
            onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
          />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Select 
              label="Category"
              options={[
                { label: 'Engineering', value: 'Engineering' },
                { label: 'Design', value: 'Design' },
                { label: 'Data Science', value: 'Data Science' },
                { label: 'DevOps', value: 'DevOps' }
              ]}
              value={formData.category}
              onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
            />
            <Select 
              label="Level"
              options={[
                { label: 'Beginner', value: 'beginner' },
                { label: 'Intermediate', value: 'intermediate' },
                { label: 'Advanced', value: 'advanced' }
              ]}
              value={formData.level}
              onChange={(e) => setFormData(p => ({ ...p, level: e.target.value }))}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--on-surface)' }}>
              <input 
                type="checkbox" 
                checked={formData.is_free} 
                onChange={(e) => setFormData(p => ({ ...p, is_free: e.target.checked, price: e.target.checked ? 0 : p.price }))}
              />
              This course is free
            </label>
            
            {!formData.is_free && (
              <TextInput 
                type="number"
                placeholder="Price ($)"
                value={formData.price}
                onChange={(e) => setFormData(p => ({ ...p, price: Number(e.target.value) }))}
                style={{ width: '120px' }}
              />
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={createMut.isPending}>Create & Next</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
