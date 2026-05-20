import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/TextInput';
import { Search, Plus, Trash2, BookOpen } from 'lucide-react';
import api from '../../lib/api';
import { useDebounce } from '../../lib/useDebounce';

interface BatchAccessModalProps {
  batchId: string;
  batchName: string;
  onClose: () => void;
}

export const BatchAccessModal: React.FC<BatchAccessModalProps> = ({ batchId, batchName, onClose }) => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  // Fetch Batch Details (includes current courses)
  const { data: batchDetails, isPending: isBatchPending } = useQuery({
    queryKey: ['admin-batch-details', batchId],
    queryFn: async () => {
      const { data } = await api.get(`/admin/batches/${batchId}`);
      return data.data;
    },
  });

  // Fetch Courses for Search
  const { data: searchResults, isPending: isSearchPending } = useQuery({
    queryKey: ['admin-courses-search', debouncedSearch],
    queryFn: async () => {
      const params: any = { limit: 20 };
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      const { data } = await api.get('/courses', { params });
      // If endpoint returns wrapped or array directly
      const courses = Array.isArray(data.data) ? data.data : (data.data?.courses || []);
      return { courses };
    },
  });

  const grantAccessMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const { data } = await api.post(`/admin/batches/${batchId}/course-access`, { courseId });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-batch-details', batchId] });
    },
  });

  const revokeAccessMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const { data } = await api.delete(`/admin/batches/${batchId}/course-access/${courseId}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-batch-details', batchId] });
    },
  });

  const currentCourses = batchDetails?.courses || [];
  const courseAccessIds = new Set(currentCourses.map((c: any) => c.courseId));

  return (
    <Modal isOpen={true} onClose={onClose} title={`Manage Course Access: ${batchName}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.25rem' }}>
        <div>
          <h3 style={{ margin: '0 0 0.25rem', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600 }}>Grant Course Access</h3>
          <p style={{ margin: '0 0 1rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>Search for courses to assign to this batch.</p>
          <TextInput
            placeholder="Search courses..."
            leftIcon={<Search size={18} />}
            value={search}
            onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
          />
          <div style={{ marginTop: '1rem', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            {isSearchPending ? (
              <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Loading courses...</div>
            ) : searchResults?.courses?.length > 0 ? (
              searchResults.courses.map((course: any) => (
                <div key={course.id || course._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{course.title}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{course.category} • {course.difficulty || course.level}</div>
                  </div>
                  {courseAccessIds.has(course.id || course._id) ? (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Granted</span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Plus size={16} />}
                      onClick={() => grantAccessMutation.mutate(course.id || course._id)}
                      disabled={grantAccessMutation.isPending}
                    >
                      Grant Access
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>No courses found.</div>
            )}
          </div>
        </div>

        <div>
          <h3 style={{ margin: '0 0 1rem', color: 'var(--text-primary)', fontSize: '1.125rem' }}>Currently Assigned Courses ({currentCourses.length})</h3>
          {isBatchPending ? (
            <div style={{ color: 'var(--text-muted)' }}>Loading courses...</div>
          ) : currentCourses.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {currentCourses.map((access: any) => (
                <div key={access.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--surface-well)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <BookOpen size={18} style={{ color: 'var(--brand-primary)' }} />
                    <div>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{access.courseTitle || 'Unknown Course'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Granted on {new Date(access.grantedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    style={{ color: 'var(--error)' }}
                    onClick={() => {
                      if (confirm(`Revoke access to "${access.courseTitle || 'this course'}" for this batch?`)) {
                        revokeAccessMutation.mutate(access.courseId);
                      }
                    }}
                    disabled={revokeAccessMutation.isPending}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)' }}>No courses assigned to this batch yet.</div>
          )}
        </div>
      </div>
    </Modal>
  );
};
