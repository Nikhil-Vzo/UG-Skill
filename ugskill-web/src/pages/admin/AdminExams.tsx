import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Plus, Edit2, Trash2, Users, Clock, AlertCircle, Eye, Monitor, FileText, RefreshCw } from 'lucide-react';
import api from '../../lib/api';

interface Exam {
  id: string;
  title: string;
  status: string;
  durationMinutes: number;
  isProctored: boolean;
  scheduledAt: string;
  attemptCount?: number;
}

const fetchExams = async (): Promise<Exam[]> => {
  const { data } = await api.get('/exams');
  // Handle both { data: [...] } and { data: { data: [...] } }
  const raw = data.data;
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object' && Array.isArray((raw as any).data)) {
    return (raw as any).data;
  }
  return [];
};

const deleteExamAPI = async (id: string) => {
  await api.delete(`/exams/${id}`);
};

export const AdminExams: React.FC = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: exams, isPending } = useQuery<Exam[]>({
    queryKey: ['admin-exams'],
    queryFn: fetchExams,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExamAPI,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-exams'] });
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const columns = [
    {
      key: 'title',
      header: 'Title',
      render: (e: Exam) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-high)' }}>{e.title}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-low)' }}>
            {e.isProctored ? 'Proctored' : 'Unproctored'} • {e.durationMinutes} mins
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (e: Exam) => (
        <Badge variant={e.status === 'published' ? 'success' : 'secondary'} size="sm">
          {e.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'attempts',
      header: 'Attempts',
      render: (e: Exam) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={14} style={{ color: 'var(--text-low)' }} />
          <span>{e.attemptCount || 0}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (e: Exam) => (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button 
            variant="outline" 
            size="sm" 
            title="Edit Exam"
            onClick={() => navigate(`/app/admin/exams/${e.id}/builder`)}
          >
            <Edit2 size={16} />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            title="Manage Access / Batches"
            onClick={() => navigate(`/app/admin/exams/${e.id}/builder?tab=2`)}
          >
            <Users size={16} style={{ marginRight: '4px' }} /> Access
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            title="Delete Exam"
            onClick={() => handleDelete(e.id)}
            style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
          >
            <Trash2 size={16} />
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            title="Preview / Enter Exam"
            onClick={() => navigate(`/app/exams/${e.id}/pre-flight?admin=true`)}
          >
            <Eye size={16} style={{ marginRight: '4px' }} /> Enter
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            title="Monitor Live Session"
            onClick={() => navigate(`/app/admin/exams/ops?examId=${e.id}`)}
          >
            <Monitor size={16} style={{ marginRight: '4px' }} /> Monitor
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--surface-highest)', paddingBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ padding: '0.5rem', background: 'var(--primary-muted)', borderRadius: '0.5rem', color: 'var(--primary)' }}>
              <FileText size={24} />
            </div>
            <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.875rem', fontWeight: 700 }}>Exam Management</h1>
          </div>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Configure assessments, manage student access, and monitor real-time performance.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'right', marginRight: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Assessments</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-high)' }}>{exams?.length || 0}</div>
          </div>
          <Button 
            variant="outline" 
            leftIcon={<RefreshCw size={18} className={isPending ? 'cb-spin' : ''} />} 
            onClick={() => qc.invalidateQueries({ queryKey: ['admin-exams'] })}
            title="Refresh Data"
          >
            Refresh
          </Button>
          <Button 
            variant="primary" 
            leftIcon={<Plus size={18} />} 
            onClick={() => navigate('/app/admin/exams/builder')}
            style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem' }}
          >
            Create New Exam
          </Button>
        </div>
      </header>

      <Card>
        {isPending ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-low)' }}>Loading exams...</div>
        ) : exams?.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-low)' }}>
            <AlertCircle size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p>No exams found. Create your first exam to get started.</p>
          </div>
        ) : (
          <DataTable data={exams || []} columns={columns} />
        )}
      </Card>
    </div>
  );
};
