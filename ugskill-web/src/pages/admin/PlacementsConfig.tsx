import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Plus, Building, Calendar, Settings, AlertCircle, Users } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';
import { FileUpload } from '../../components/ui/FileUpload';

/* ---------- types ---------- */
interface Drive {
  id: string;
  companyName: string;
  name: string;
  targetRoles: string[];
  scheduledAt: string;
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
  jdUrl?: string;
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
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    companyId: '',
    name: '',
    targetRoles: '',        // comma-separated, split on submit
    scheduledAt: '',
    registrationDeadline: '',
    cgpaCutoff: '6.0',
    jdUrl: '',
  });

  const { data: drives, isPending, isError } = useQuery<Drive[]>({
    queryKey: ['admin-drives'],
    queryFn: fetchDrives,
    staleTime: 60_000,
  });

  // Fetch companies for the dropdown
  const { data: companies = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['companies'],
    queryFn: () => api.get('/placements/companies').then(r => r.data.data || []),
  });

  const resetForm = () => setForm({
    companyId: '', name: '', targetRoles: '', scheduledAt: '',
    registrationDeadline: '', cgpaCutoff: '6.0', jdUrl: '',
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const payload: any = {
        companyId: form.companyId,
        name: form.name,
        targetRoles: form.targetRoles.split(',').map(r => r.trim()).filter(Boolean),
        eligibility: { cgpaCutoff: parseFloat(form.cgpaCutoff) },
        // One default HR round — required by schema
        flowSpec: [{ roundNumber: 1, roundType: 'hr_interview', description: 'Initial HR Screening' }],
      };
      if (form.scheduledAt) payload.scheduledAt = new Date(form.scheduledAt).toISOString();
      if (form.registrationDeadline) payload.registrationDeadline = new Date(form.registrationDeadline).toISOString();
      return api.post('/placements/drives', payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-drives'] });
      setShowCreate(false);
      resetForm();
    },
  });

  const [showAddCompany, setShowAddCompany] = useState(false);
  const [companyForm, setCompanyForm] = useState({ name: '', industry: '', websiteUrl: '' });

  const addCompanyMutation = useMutation({
    mutationFn: () => {
      const url = companyForm.websiteUrl.trim();
      // Auto-prepend https:// so Zod's URL validator doesn't reject bare domains
      const safeUrl = url
        ? url.startsWith('http://') || url.startsWith('https://')
          ? url
          : `https://${url}`
        : undefined;

      const payload: Record<string, unknown> = { name: companyForm.name.trim() };
      if (companyForm.industry.trim()) payload.industry = companyForm.industry.trim();
      if (safeUrl) payload.websiteUrl = safeUrl;

      return api.post('/placements/companies', payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      setShowAddCompany(false);
      setCompanyForm({ name: '', industry: '', websiteUrl: '' });
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
    { 
      key: 'name', 
      header: 'Drive Name',
      render: (row: Drive) => <span style={{ fontWeight: 600 }}>{row.name}</span>
    },
    { 
      key: 'targetRoles', 
      header: 'Roles',
      render: (row: Drive) => row.targetRoles?.join(', ') || 'N/A'
    },
    { 
      key: 'scheduledAt', 
      header: 'Drive Date',
      render: (row: Drive) => row.scheduledAt ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <Calendar size={16} /> {new Date(row.scheduledAt).toLocaleDateString()}
        </div>
      ) : 'TBD'
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
          onClick={() => navigate(`/app/admin/placements/${row.id}`)}
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

  const { user } = useAuthStore();
  const isAdmin = user?.roles?.some(r => ['admin', 'super_admin'].includes(r));

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '2rem' }}>Placements Configuration</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            {drives ? `${drives.length} drives total` : 'Manage recruitment drives and monitor applicants.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {isAdmin && (
            <Button variant="outline" leftIcon={<Building size={16} />} onClick={() => setShowAddCompany(true)}>
              Add Company
            </Button>
          )}
          <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setShowCreate(true)}>
            Create Drive
          </Button>
        </div>
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

      {isAdmin && (
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
      )}
      {/* Companies Section — Admin only */}
      {isAdmin && (
        <Card title="Partner Companies">
          {companies.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Building size={32} style={{ opacity: 0.3, marginBottom: '0.75rem', display: 'block', margin: '0 auto 0.75rem' }} />
              <p style={{ margin: '0 0 1rem' }}>No companies yet. Add your first partner company to start creating drives.</p>
              <Button variant="outline" leftIcon={<Plus size={14} />} onClick={() => setShowAddCompany(true)}>Add First Company</Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.5rem' }}>
              {companies.map((c) => (
                <div key={c.id} style={{ padding: '0.5rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  <Building size={14} color="var(--primary)" /> {c.name}
                </div>
              ))}
              <button onClick={() => setShowAddCompany(true)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px dashed var(--border)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.875rem' }}>
                + Add Another
              </button>
            </div>
          )}
        </Card>
      )}

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

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: 6, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Company *</label>
              <select
                style={{ ...inputStyle, appearance: 'auto' }}
                value={form.companyId}
                onChange={(e) => setForm((f) => ({ ...f, companyId: e.target.value }))}
              >
                <option value="">— Select a company —</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {companies.length === 0 && (
                <p style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: 4 }}>
                  No companies found. Please add a company first via the Company Directory.
                </p>
              )}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: 6, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Drive Name *</label>
              <input
                style={inputStyle}
                placeholder="Google SDE Campus Drive 2025"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: 6, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Target Roles * <span style={{ fontWeight: 400 }}>(comma-separated)</span></label>
              <input
                style={inputStyle}
                placeholder="SDE-I, SDE-II, Backend Engineer"
                value={form.targetRoles}
                onChange={(e) => setForm((f) => ({ ...f, targetRoles: e.target.value }))}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Drive Date</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={form.scheduledAt}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Registration Deadline</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={form.registrationDeadline}
                  onChange={(e) => setForm((f) => ({ ...f, registrationDeadline: e.target.value }))}
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
                  value={form.cgpaCutoff}
                  onChange={(e) => setForm((f) => ({ ...f, cgpaCutoff: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: 6, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Job Description / Brochure (PDF)</label>
              {form.jdUrl ? (
                <div style={{ padding: '0.75rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: 8, color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  JD successfully attached
                </div>
              ) : (
                <FileUpload 
                  category="placement_drive"
                  acceptedTypes="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  maxSizeMB={10}
                  onUploadComplete={(path) => setForm(f => ({ ...f, jdUrl: path }))}
                />
              )}
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
                disabled={!form.companyId || !form.name || !form.targetRoles || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? 'Creating…' : 'Create Drive'}
              </Button>
            </div>
          </Card>
        </div>
      )}
      {/* Add Company Modal */}
      {showAddCompany && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowAddCompany(false)}
        >
          <Card
            style={{ width: '100%', maxWidth: 460, padding: '2rem' }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building size={20} /> Add Partner Company
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Company Name *</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. Google, Infosys, TCS"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm(f => ({ ...f, name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Industry</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. Technology, Finance, Consulting"
                  value={companyForm.industry}
                  onChange={(e) => setCompanyForm(f => ({ ...f, industry: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Website URL</label>
                <input
                  style={inputStyle}
                  placeholder="https://company.com"
                  value={companyForm.websiteUrl}
                  onChange={(e) => setCompanyForm(f => ({ ...f, websiteUrl: e.target.value }))}
                />
              </div>
            </div>

            {addCompanyMutation.isError && (
              <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Failed to add company — please try again.
              </p>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setShowAddCompany(false)}>Cancel</Button>
              <Button
                variant="primary"
                disabled={!companyForm.name.trim() || addCompanyMutation.isPending}
                onClick={() => addCompanyMutation.mutate()}
              >
                {addCompanyMutation.isPending ? 'Adding…' : 'Add Company'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
