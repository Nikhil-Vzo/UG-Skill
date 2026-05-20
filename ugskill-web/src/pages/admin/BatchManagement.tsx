import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FolderPlus, Users, AlertCircle } from 'lucide-react';
import api from '../../lib/api';

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

/* ---------- component ---------- */
export const BatchManagement: React.FC = () => {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedBatchForMembers, setSelectedBatchForMembers] = useState<Batch | null>(null);
  const [form, setForm] = useState({ name: '', description: '', startDate: '' });

  const { data: batches, isPending, isError } = useQuery<Batch[]>({
    queryKey: ['admin-batches'],
    queryFn: fetchBatches,
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: createBatch,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-batches'] });
      setShowCreate(false);
      setForm({ name: '', description: '', startDate: '' });
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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = `/admin/batches/${row.id}/access`}
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
              onClick={() => createMutation.mutate(form)}
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
    </div>
  );
};
