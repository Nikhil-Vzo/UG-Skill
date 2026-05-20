import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FolderPlus, Users, AlertCircle, Search, UserPlus, X, Trash2, BookOpen } from 'lucide-react';
import api from '../../lib/api';
import { useDebounce } from '../../lib/useDebounce';

/* ---------- types ---------- */
interface Batch {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  status: 'active' | 'completed' | 'archived';
  startDate: string;
}

/* ---------- fetchers ---------- */
const fetchBatches = async (): Promise<Batch[]> => {
  const { data } = await api.get('/admin/batches');
  return data.data;
};

const createBatch = async (payload: { name: string; description: string; startDate: string }) => {
  const { data } = await api.post('/admin/batches', payload);
  return data;
};

/* ---------- skeleton ---------- */
const RowSkeleton = () => (
  <tr>
    {Array.from({ length: 5 }).map((_, i) => (
      <td key={i} style={{ padding: '1rem' }}>
        <div style={{ height: 14, borderRadius: 4, background: 'var(--border)', animation: 'pulse 1.5s ease infinite', width: i === 0 ? '70%' : '50%' }} />
      </td>
    ))}
  </tr>
);

import { Modal } from '../../components/ui/Modal';
import { BatchMembersModal } from './BatchMembersModal';
import { BatchAccessModal } from './BatchAccessModal';

/* ---------- component ---------- */
export const BatchManagement: React.FC = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedBatchForMembers, setSelectedBatchForMembers] = useState<Batch | null>(null);
  const [selectedBatchForAccess, setSelectedBatchForAccess] = useState<Batch | null>(null);
  const [form, setForm] = useState({ name: '', description: '', startDate: '' });

  // Student search and selection states for batch creation
  const [userSearch, setUserSearch] = useState('');
  const debouncedUserSearch = useDebounce(userSearch, 400);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedUsersInfo, setSelectedUsersInfo] = useState<{ id: string; fullName: string; email: string }[]>([]);

  const { data: searchResults, isPending: isSearchPending } = useQuery({
    queryKey: ['admin-users-search-batch-create', debouncedUserSearch],
    queryFn: async () => {
      if (!debouncedUserSearch) return { users: [] };
      const { data } = await api.get('/admin/users', { params: { search: debouncedUserSearch, limit: 10 } });
      return { users: data.data };
    },
    enabled: !!debouncedUserSearch,
  });

  const { data: batches, isPending, isError } = useQuery<Batch[]>({
    queryKey: ['admin-batches'],
    queryFn: fetchBatches,
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; description: string; startDate: string; userIds: string[] }) => {
      const { name, description, startDate, userIds } = payload;
      const { data: createData } = await api.post('/admin/batches', { name, description, startDate });
      const batchId = createData.data.id;
      if (userIds.length > 0) {
        await api.post(`/admin/batches/${batchId}/members`, { userIds });
      }
      return createData;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-batches'] });
      setShowCreate(false);
      setForm({ name: '', description: '', startDate: '' });
      setSelectedUserIds([]);
      setSelectedUsersInfo([]);
      setUserSearch('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (batchId: string) => {
      const { data } = await api.delete(`/admin/batches/${batchId}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-batches'] });
    },
  });

  const createCourseForBatchMutation = useMutation({
    mutationFn: async (batch: Batch) => {
      // 1. Create course with batch details
      const courseRes = await api.post('/lms/courses', {
        title: batch.name,
        description: `LMS Course for batch ${batch.name}`,
        category: 'Engineering',
        level: 'beginner',
        is_free: true,
        price: 0,
      });

      const courseId = courseRes.data.data?.id || courseRes.data.data?._id;
      if (!courseId) {
        throw new Error('Failed to create course');
      }

      // 2. Grant course access to batch (which triggers backend auto-enrollment of batch members)
      await api.post(`/admin/batches/${batch.id}/course-access`, {
        courseId,
      });

      return { courseId };
    },
    onSuccess: (data) => {
      toast.success('Course created & batch members enrolled! Opening builder...');
      navigate(`/app/admin/courses/${data.courseId}/builder`);
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create course and enroll batch');
    },
  });

  const columns = [
    {
      key: 'name',
      header: 'Batch Name',
      render: (row: Batch) => (
        <div>
          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{row.name}</div>
          {row.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.description}</div>}
        </div>
      ),
    },
    {
      key: 'memberCount',
      header: 'Students',
      render: (row: Batch) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <Users size={16} /> {row.memberCount}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Batch) => (
        <Badge variant={row.status === 'active' ? 'primary' : 'outline'}>{row.status}</Badge>
      ),
    },
    {
      key: 'startDate',
      header: 'Start Date',
      render: (row: Batch) => new Date(row.startDate).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Batch) => (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedBatchForAccess(row)}
          >
            Manage Access
          </Button>
           <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedBatchForMembers(row)}
          >
            Members
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => createCourseForBatchMutation.mutate(row)}
            disabled={createCourseForBatchMutation.isPending}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <BookOpen size={14} />
            Create Course
          </Button>
          <Button
            variant="ghost"
            size="sm"
            style={{ color: 'var(--error)' }}
            disabled={deleteMutation.isPending}
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete batch "${row.name}"?`)) {
                deleteMutation.mutate(row.id);
              }
            }}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '2rem' }}>Batch Management</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            {batches ? `${batches.length} batches` : 'Organize students into batches and manage course access.'}
          </p>
        </div>
        <Button leftIcon={<FolderPlus size={18} />} onClick={() => setShowCreate(true)}>
          Create Batch
        </Button>
      </header>

      {isError && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--error)' }}>
            <AlertCircle size={20} />
            <span>Failed to load batches.</span>
          </div>
        </Card>
      )}

      <Card>
        {isPending ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>{Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)}</tbody>
          </table>
        ) : (
          <DataTable data={batches ?? []} columns={columns} page={1} totalPages={1} />
        )}
      </Card>

      {/* Create Batch Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Batch">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {[
            { label: 'Batch Name *', key: 'name', type: 'text', placeholder: 'e.g. Winter 2026 CS Core' },
            { label: 'Description', key: 'description', type: 'text', placeholder: 'Optional description' },
            { label: 'Start Date *', key: 'startDate', type: 'date', placeholder: '' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                value={(form as any)[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
              />
            </div>
          ))}

          {/* Members search-and-select area */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Add Members (Optional)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.25rem',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  boxSizing: 'border-box'
                }}
              />
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>

            {debouncedUserSearch && (
              <div style={{ marginTop: '0.75rem', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'var(--surface-well)' }}>
                {isSearchPending ? (
                  <div style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Searching...</div>
                ) : searchResults && searchResults.users && searchResults.users.length > 0 ? (
                  searchResults.users.map((user: any) => {
                    const isAdded = selectedUserIds.includes(user.id);
                    return (
                      <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{user.fullName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
                        </div>
                        {isAdded ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Selected</span>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<UserPlus size={14} />}
                            onClick={() => {
                              setSelectedUserIds((ids) => [...ids, user.id]);
                              setSelectedUsersInfo((infos) => [...infos, { id: user.id, fullName: user.fullName, email: user.email }]);
                            }}
                          >
                            Add
                          </Button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No users found.</div>
                )}
              </div>
            )}
          </div>

          {/* Selected users tags */}
          {selectedUsersInfo.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>
                Selected Members ({selectedUsersInfo.length})
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '120px', overflowY: 'auto' }}>
                {selectedUsersInfo.map((u) => (
                  <div
                    key={u.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.25rem 0.5rem',
                      background: 'var(--surface-highest)',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <span>{u.fullName}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUserIds((ids) => ids.filter((id) => id !== u.id));
                        setSelectedUsersInfo((infos) => infos.filter((info) => info.id !== u.id));
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {createMutation.isError && (
            <p style={{ color: 'var(--error)', fontSize: '0.875rem', margin: 0 }}>
              Failed to create batch — please try again.
            </p>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!form.name || !form.startDate || createMutation.isPending}
              onClick={() => createMutation.mutate({ ...form, userIds: selectedUserIds })}
            >
              {createMutation.isPending ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {selectedBatchForMembers && (
        <BatchMembersModal
          batchId={selectedBatchForMembers.id}
          batchName={selectedBatchForMembers.name}
          onClose={() => setSelectedBatchForMembers(null)}
        />
      )}

      {selectedBatchForAccess && (
        <BatchAccessModal
          batchId={selectedBatchForAccess.id}
          batchName={selectedBatchForAccess.name}
          onClose={() => setSelectedBatchForAccess(null)}
        />
      )}
    </div>
  );
};
