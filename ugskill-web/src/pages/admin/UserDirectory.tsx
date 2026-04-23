import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/TextInput';
import { Badge } from '../../components/ui/Badge';
import { Search, UserPlus, AlertCircle } from 'lucide-react';
import api from '../../lib/api';
import { useDebounce } from '../../lib/useDebounce';

/* ---------- types ---------- */
interface User {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
  status: 'active' | 'suspended';
  createdAt: string;
}

interface UsersResponse {
  users: User[];
  meta: { page: number; totalPages: number; total: number };
}

/* ---------- fetchers ---------- */
const fetchUsers = async (page: number, search: string): Promise<UsersResponse> => {
  const { data } = await api.get('/admin/users', { params: { page, limit: 20, search: search || undefined } });
  return data.data;
};

const patchUserRole = async ({ userId, role }: { userId: string; role: string }) => {
  const { data } = await api.patch(`/admin/users/${userId}/role`, { role });
  return data;
};

const patchUserStatus = async ({ userId, action }: { userId: string; action: 'suspend' | 'activate' }) => {
  const { data } = await api.patch(`/admin/users/${userId}/status`, { action });
  return data;
};

/* ---------- row skeleton ---------- */
const RowSkeleton = () => (
  <tr>
    {Array.from({ length: 6 }).map((_, i) => (
      <td key={i} style={{ padding: '1rem' }}>
        <div style={{ height: 14, borderRadius: 4, background: 'var(--border)', animation: 'pulse 1.5s ease infinite', width: i === 0 ? '80%' : '60%' }} />
      </td>
    ))}
  </tr>
);

/* ---------- component ---------- */
export const UserDirectory: React.FC = () => {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const { data, isPending, isError } = useQuery<UsersResponse>({
    queryKey: ['admin-users', page, debouncedSearch],
    queryFn: () => fetchUsers(page, debouncedSearch),
    staleTime: 30_000,
  });

  const roleMutation = useMutation({
    mutationFn: patchUserRole,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setEditingUser(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: patchUserStatus,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const columns = [
    {
      key: 'fullName',
      header: 'User Name',
      render: (row: User) => (
        <div>
          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{row.fullName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.email}</div>
        </div>
      ),
    },
    {
      key: 'roles',
      header: 'Role',
      render: (row: User) => (
        <Badge variant={row.roles.includes('institution_admin') ? 'primary' : 'outline'}>
          {row.roles[0] ?? 'student'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: User) => (
        <span style={{ color: row.status === 'active' ? 'var(--success)' : 'var(--error)', textTransform: 'capitalize', fontSize: '0.875rem' }}>
          ● {row.status}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (row: User) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: User) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setEditingUser(row); setNewRole(row.roles[0] ?? 'student'); }}
          >
            Edit Role
          </Button>
          <Button
            variant="outline"
            size="sm"
            style={{ color: row.status === 'suspended' ? 'var(--success)' : 'var(--error)' }}
            onClick={() =>
              statusMutation.mutate({ userId: row.id, action: row.status === 'suspended' ? 'activate' : 'suspend' })
            }
            disabled={statusMutation.isPending}
          >
            {row.status === 'suspended' ? 'Unban' : 'Ban'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '2rem' }}>User Directory</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            {data ? `${data?.meta?.total ?? 0} users` : 'Manage all platform users, roles, and access states.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <TextInput
            placeholder="Search by name or email…"
            leftIcon={<Search size={18} />}
            value={search}
            onChange={(e) => { setSearch((e.target as HTMLInputElement).value); setPage(1); }}
            style={{ minWidth: '260px' }}
          />
          <Button leftIcon={<UserPlus size={18} />}>Invite User</Button>
        </div>
      </header>

      {isError && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--error)' }}>
            <AlertCircle size={20} />
            <span>Failed to load users. Check your connection.</span>
          </div>
        </Card>
      )}

      <Card>
        {isPending ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>{Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} />)}</tbody>
          </table>
        ) : (
          <DataTable
            data={data?.users ?? []}
            columns={columns}
            page={page}
            totalPages={data?.meta?.totalPages ?? 1}
            onPageChange={setPage}
          />
        )}
      </Card>

      {/* Edit Role Modal */}
      {editingUser && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setEditingUser(null)}
        >
          <Card
            style={{ width: '100%', maxWidth: 440, padding: '2rem' }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 1.5rem', color: 'var(--text-primary)' }}>Edit Role — {editingUser.fullName}</h2>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              New Role
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', marginBottom: '1.5rem' }}
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="institution_admin">Institution Admin</option>
              <option value="company_admin">Company Admin</option>
              <option value="recruiter">Recruiter</option>
            </select>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={() => roleMutation.mutate({ userId: editingUser.id, role: newRole })}
                disabled={roleMutation.isPending}
              >
                {roleMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
