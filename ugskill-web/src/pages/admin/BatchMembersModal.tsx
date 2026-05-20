import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/TextInput';
import { Search, UserPlus, Trash2 } from 'lucide-react';
import api from '../../lib/api';
import { useDebounce } from '../../lib/useDebounce';

interface BatchMembersModalProps {
  batchId: string;
  batchName: string;
  onClose: () => void;
}

export const BatchMembersModal: React.FC<BatchMembersModalProps> = ({ batchId, batchName, onClose }) => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  // Fetch Batch Details (includes members)
  const { data: batchDetails, isPending: isBatchPending } = useQuery({
    queryKey: ['admin-batch-details', batchId],
    queryFn: async () => {
      const { data } = await api.get(`/admin/batches/${batchId}`);
      return data.data;
    },
  });

  // Fetch Users for Search
  const { data: searchResults, isPending: isSearchPending } = useQuery({
    queryKey: ['admin-users-search', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch) return { users: [] };
      const { data } = await api.get('/admin/users', { params: { search: debouncedSearch, limit: 10 } });
      return data.data;
    },
    enabled: !!debouncedSearch,
  });

  const addMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.post(`/admin/batches/${batchId}/members`, { userIds: [userId] });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-batch-details', batchId] });
      qc.invalidateQueries({ queryKey: ['admin-batches'] }); // update count
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.delete(`/admin/batches/${batchId}/members/${userId}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-batch-details', batchId] });
      qc.invalidateQueries({ queryKey: ['admin-batches'] }); // update count
    },
  });

  const members = batchDetails?.members || [];
  const memberIds = new Set(members.map((m: any) => m.userId));

  return (
    <Modal isOpen={true} onClose={onClose} title={`Members: ${batchName}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.25rem' }}>
        <div>
          <TextInput
            placeholder="Search users to add..."
            leftIcon={<Search size={18} />}
            value={search}
            onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
          />
          {debouncedSearch && (
            <div style={{ marginTop: '1rem', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              {isSearchPending ? (
                <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Searching...</div>
              ) : searchResults?.users?.length > 0 ? (
                searchResults.users.map((user: any) => (
                  <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{user.fullName}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{user.email}</div>
                    </div>
                    {memberIds.has(user.id) ? (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Added</span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<UserPlus size={16} />}
                        onClick={() => addMemberMutation.mutate(user.id)}
                        disabled={addMemberMutation.isPending}
                      >
                        Add
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>No users found.</div>
              )}
            </div>
          )}
        </div>

        <div>
          <h3 style={{ margin: '0 0 1rem', color: 'var(--text-primary)', fontSize: '1.125rem' }}>Current Members ({members.length})</h3>
          {isBatchPending ? (
            <div style={{ color: 'var(--text-muted)' }}>Loading members...</div>
          ) : members.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {members.map((member: any) => (
                <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--surface-well)', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{member.userName}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{member.userEmail}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    style={{ color: 'var(--error)' }}
                    onClick={() => {
                      if (confirm(`Remove ${member.userName} from this batch?`)) {
                        removeMemberMutation.mutate(member.userId);
                      }
                    }}
                    disabled={removeMemberMutation.isPending}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)' }}>No members in this batch.</div>
          )}
        </div>
      </div>
    </Modal>
  );
};
