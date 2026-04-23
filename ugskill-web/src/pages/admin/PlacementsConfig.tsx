import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Plus, Building, Calendar, Settings, AlertCircle } from 'lucide-react';
import api from '../../lib/api';

/* ---------- types ---------- */
interface Drive {
  id: string;
  companyName: string;
  role: string;
  driveDate: string;
  status: 'draft' | 'upcoming' | 'active' | 'closed';
  eligibleCount: number;
  applicationCount: number;
}

/* ---------- fetchers ---------- */
const fetchDrives = async (): Promise<Drive[]> => {
  const { data } = await api.get('/placements/drives', { params: { view: 'admin' } });
  return data.data;
};

const createDrive = async (payload: {
  companyName: string;
  role: string;
  driveDate: string;
  minCgpa: number;
  description: string;
}) => {
  const { data } = await api.post('/placements/drives', payload);
  return data;
};

/* ---------- helpers ---------- */
const statusVariant: Record<string, 'primary' | 'outline'> = {
  active: 'primary',
  upcoming: 'primary',
  draft: 'outline',
  closed: 'outline',
};

/* ---------- component ---------- */
export const PlacementsConfig: React.FC = () => {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    role: '',
    driveDate: '',
    minCgpa: '6.0',
    description: '',
  });

  const { data: drives, isPending, isError } = useQuery<Drive[]>({
    queryKey: ['admin-drives'],
    queryFn: fetchDrives,
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: createDrive,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-drives'] });
      setShowCreate(false);
      setForm({ companyName: '', role: '', driveDate: '', minCgpa: '6.0', description: '' });
    },
  });

  const columns = [
    {
      key: 'companyName',
      header: 'Company',
      render: (row: Drive) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, color: 'var(--text-primary)' }}>
          <Building size={16} color="var(--primary)" /> {row.companyName}
        </div>
      ),
    },
    { key: 'role', header: 'Role' },
    {
      key: 'driveDate',
      header: 'Drive Date',
      render: (row: Drive) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <Calendar size={16} /> {new Date(row.driveDate).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: 'eligibleCount',
      header: 'Eligible / Applied',
      render: (row: Drive) => (
        <span style={{ color: 'var(--text-secondary)' }}>
          {row.eligibleCount} / <span style={{ color: 'var(--primary)' }}>{row.applicationCount}</span>
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Drive) => (
        <Badge variant={statusVariant[row.status] ?? 'outline'}>{row.status}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Drive) => (
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Settings size={14} />}
          onClick={() => window.location.href = `/admin/placements/drives/${row.id}`}
        >
          Configure
        </Button>
      ),
    },
  ];

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '2rem' }}>Placements Configuration</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            {drives ? `${drives.length} drives total` : 'Manage recruitment drives, companies, and eligibility criteria.'}
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setShowCreate(true)}>
          Create Drive
        </Button>
      </header>

      {isError && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--error)' }}>
            <AlertCircle size={20} />
            <span>Failed to load drives.</span>
          </div>
        </Card>
      )}

      <Card title="All Drives">
        {isPending ? (
          <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>Loading drives…</p>
        ) : drives?.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>No drives found. Create your first drive.</p>
        ) : (
          <DataTable data={drives ?? []} columns={columns} page={1} totalPages={1} />
        )}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <Card title="Eligibility Rules">
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Configure global or drive-specific eligibility parameters based on CGPA, attendance, or past exams.
          </p>
          <Button variant="outline">Manage Rules</Button>
        </Card>
        <Card title="Company Directory">
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Manage the list of partnered companies, their profiles, and historical data.
          </p>
          <Button variant="outline">View Companies</Button>
        </Card>
      </div>

      {/* Create Drive Modal */}
      {showCreate && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowCreate(false)}
        >
          <Card
            style={{ width: '100%', maxWidth: 540, padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 1.5rem', color: 'var(--text-primary)' }}>New Placement Drive</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Company *</label>
                <input
                  style={inputStyle}
                  placeholder="Google"
                  value={form.companyName}
                  onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Role *</label>
                <input
                  style={inputStyle}
                  placeholder="SDE-I"
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Drive Date *</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={form.driveDate}
                  onChange={(e) => setForm((f) => ({ ...f, driveDate: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Min CGPA</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  style={inputStyle}
                  value={form.minCgpa}
                  onChange={(e) => setForm((f) => ({ ...f, minCgpa: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: 6, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Description</label>
              <textarea
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                placeholder="Write a brief drive description…"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            {createMutation.isError && (
              <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Failed to create drive — please try again.
              </p>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button
                variant="primary"
                disabled={!form.companyName || !form.role || !form.driveDate || createMutation.isPending}
                onClick={() =>
                  createMutation.mutate({ ...form, minCgpa: parseFloat(form.minCgpa) })
                }
              >
                {createMutation.isPending ? 'Creating…' : 'Create Drive'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
