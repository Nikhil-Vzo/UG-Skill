import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Users, Plus, Search, X, ChevronRight, Shield, Globe, Lock
} from 'lucide-react';
import api from '../lib/api';
import { useDebounce } from '../lib/useDebounce';

/* ---------- types ---------- */
interface PeerGroup {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  maxMembers: number;
  isPrivate: boolean;
  memberCount?: number;
  createdAt: string;
}

interface PeerGroupDetail extends PeerGroup {
  members: { userId: string; joinedAt: string }[];
}

/* ---------- fetchers ---------- */
const fetchPeerGroups = async (search: string): Promise<PeerGroup[]> => {
  const { data } = await api.get('/placements/peer-groups', { params: { search: search || undefined } });
  return Array.isArray(data.data) ? data.data : [];
};

const fetchPeerGroup = async (id: string): Promise<PeerGroupDetail> => {
  const { data } = await api.get(`/placements/peer-groups/${id}`);
  return data.data;
};

const createPeerGroup = async (payload: { name: string; description: string; maxMembers: number; isPrivate: boolean }) => {
  const { data } = await api.post('/placements/peer-groups', payload);
  return data.data;
};

const joinPeerGroup = async (groupId: string) => {
  const { data } = await api.post(`/placements/peer-groups/${groupId}/members`, { groupId });
  return data.data;
};

/* ---------- component ---------- */
export const PeerGroups: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    maxMembers: 10,
    isPrivate: false,
  });

  const { data: groups, isPending } = useQuery<PeerGroup[]>({
    queryKey: ['peer-groups', debouncedSearch],
    queryFn: () => fetchPeerGroups(debouncedSearch),
    staleTime: 30_000,
  });

  const { data: selectedGroup, isPending: detailPending } = useQuery<PeerGroupDetail>({
    queryKey: ['peer-group', selectedGroupId],
    queryFn: () => fetchPeerGroup(selectedGroupId!),
    enabled: !!selectedGroupId,
  });

  const createMutation = useMutation({
    mutationFn: createPeerGroup,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['peer-groups'] });
      setShowCreate(false);
      setNewGroup({ name: '', description: '', maxMembers: 10, isPrivate: false });
    },
  });

  const joinMutation = useMutation({
    mutationFn: joinPeerGroup,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['peer-group', selectedGroupId] });
      qc.invalidateQueries({ queryKey: ['peer-groups'] });
    },
  });

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)', fontSize: '2rem' }}>Peer Groups</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Join study circles, mock-interview pods, and skill-sharing groups.</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setShowCreate(true)}>
          Create Group
        </Button>
      </header>

      {/* Search */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid var(--surface-highest)', background: 'var(--surface-well)' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search groups…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', flex: 1, fontSize: '0.875rem' }}
          />
        </div>
      </div>

      {/* Group Grid */}
      {isPending ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} style={{ height: 160, animation: 'pulse 1.5s ease infinite' }} />
          ))}
        </div>
      ) : groups && groups.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {groups.map(group => (
            <Card key={group.id} style={{ cursor: 'pointer', transition: 'box-shadow 0.2s' }} onClick={() => setSelectedGroupId(group.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--text-primary)' }}>{group.name}</h3>
                {group.isPrivate ? <Lock size={16} color="var(--text-muted)" /> : <Globe size={16} color="var(--success)" />}
              </div>
              <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)', minHeight: 40 }}>
                {group.description || 'No description'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <Users size={14} />
                  <span>{group.memberCount ?? 0} / {group.maxMembers}</span>
                </div>
                <Button variant="ghost" size="sm" rightIcon={<ChevronRight size={14} />}>
                  View
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Users size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No peer groups found. Be the first to create one!</p>
          </div>
        </Card>
      )}

      {/* Create Group Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowCreate(false)}>
          <Card style={{ width: '100%', maxWidth: 480, padding: '2rem' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 1.5rem', color: 'var(--text-primary)' }}>Create Peer Group</h2>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Name</label>
            <input
              value={newGroup.name}
              onChange={(e) => setNewGroup(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. DSA Study Circle"
              style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', marginBottom: '1rem' }}
            />
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Description</label>
            <textarea
              value={newGroup.description}
              onChange={(e) => setNewGroup(p => ({ ...p, description: e.target.value }))}
              placeholder="What is this group about?"
              rows={3}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', marginBottom: '1rem', resize: 'vertical' }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Max Members</label>
                <input
                  type="number"
                  value={newGroup.maxMembers}
                  onChange={(e) => setNewGroup(p => ({ ...p, maxMembers: Number(e.target.value) }))}
                  min={2}
                  max={50}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Privacy</label>
                <select
                  value={newGroup.isPrivate ? 'private' : 'public'}
                  onChange={(e) => setNewGroup(p => ({ ...p, isPrivate: e.target.value === 'private' }))}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)' }}
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
            {createMutation.isError && (
              <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginBottom: '1rem' }}>Failed to create group. Please try again.</p>
            )}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={() => createMutation.mutate(newGroup)}
                disabled={createMutation.isPending || !newGroup.name}
              >
                {createMutation.isPending ? 'Creating…' : 'Create'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Group Detail Drawer */}
      {selectedGroupId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setSelectedGroupId(null)}>
          <div style={{ width: 420, maxWidth: '90vw', height: '100%', background: 'var(--surface-well)', borderLeft: '1px solid var(--surface-highest)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Group Details</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setSelectedGroupId(null)}>
                <X size={20} />
              </button>
            </div>

            {detailPending || !selectedGroup ? (
              <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
            ) : (
              <>
                <div>
                  <h2 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>{selectedGroup.name}</h2>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{selectedGroup.description || 'No description'}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Card>
                    <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Members</p>
                    <h2 style={{ margin: 0 }}>{selectedGroup.members?.length ?? 0} / {selectedGroup.maxMembers}</h2>
                  </Card>
                  <Card>
                    <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Privacy</p>
                    <h2 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {selectedGroup.isPrivate ? <><Lock size={16} /> Private</> : <><Globe size={16} /> Public</>}
                    </h2>
                  </Card>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Members</h4>
                  {(!selectedGroup.members || selectedGroup.members.length === 0) ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No members yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {selectedGroup.members.map((m, i) => (
                        <div key={i} style={{ padding: '0.75rem', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--surface-highest)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                            <Users size={16} />
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>{m.userId.slice(0, 12)}…</p>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Joined {new Date(m.joinedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 'auto' }}>
                  <Button
                    variant="primary"
                    fullWidth
                    leftIcon={<Shield size={16} />}
                    onClick={() => joinMutation.mutate(selectedGroup.id)}
                    disabled={joinMutation.isPending || (selectedGroup.members?.length ?? 0) >= selectedGroup.maxMembers}
                  >
                    {joinMutation.isPending ? 'Joining…' : 'Join Group'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
