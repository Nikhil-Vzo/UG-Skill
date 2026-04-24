import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  ChevronLeft, 
  Settings, 
  Users, 
  Calendar, 
  Target, 
  ShieldCheck, 
  Clock,
  ArrowRight,
  FileText,
  BarChart3,
  Building2
} from 'lucide-react';
import api from '../../lib/api';

export const DriveConfig: React.FC = () => {
  const { driveId } = useParams();
  const navigate = useNavigate();

  const { data: drive, isLoading } = useQuery({
    queryKey: ['drive', driveId],
    queryFn: async () => {
      const res = await api.get(`/placements/drives/${driveId}`);
      return res.data.data;
    },
    enabled: !!driveId,
  });

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--surface-highest)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
      </div>
    );
  }

  if (!drive) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-primary)' }}>Drive not found</h2>
        <Button variant="outline" onClick={() => navigate('/app/admin/placements')}>Back to Placements</Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={() => navigate('/app/admin/placements')}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {drive.name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
            Drive ID: {driveId}
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
          <Button variant="outline" leftIcon={<FileText size={16} />}>Export Report</Button>
          <Button variant="primary" leftIcon={<Settings size={16} />}>Edit Drive</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <Card style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <Users size={16} /> Applicants
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{drive.applicationCount || 0}</div>
            </Card>
            <Card style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <ShieldCheck size={16} /> Eligible
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{drive.eligibleCount || 0}</div>
            </Card>
            <Card style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <BarChart3 size={16} /> Shortlisted
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22c55e' }}>0</div>
            </Card>
          </div>

          {/* Interview Rounds */}
          <Card title="Interview Rounds & Flow">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(drive.flow?.stages || drive.flow?.rounds || []).map((round: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-low)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                      {round.roundType.replace('_', ' ')}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {round.description || 'No description provided.'}
                    </div>
                  </div>
                  <Badge variant="outline">Scheduled</Badge>
                  <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <ArrowRight size={18} />
                  </button>
                </div>
              ))}
              <Button variant="outline" style={{ borderStyle: 'dashed', marginTop: '0.5rem' }}>+ Add Interview Round</Button>
            </div>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Company Card */}
          <Card title="Partner Company">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ width: 48, height: 48, background: 'var(--surface-well)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                <Building2 size={24} color="var(--primary)" />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{drive.companyName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Registered Partner</div>
              </div>
            </div>
            <Button variant="outline" size="sm" style={{ width: '100%' }} onClick={() => navigate(`/app/placements/${drive.id}`)}>View Public Listing</Button>
          </Card>

          {/* Drive Details */}
          <Card title="Drive Details">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Calendar size={18} color="var(--text-muted)" style={{ marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scheduled At</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {drive.scheduledAt ? new Date(drive.scheduledAt).toLocaleString() : 'TBD'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Clock size={18} color="var(--text-muted)" style={{ marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registration Deadline</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {drive.registrationDeadline ? new Date(drive.registrationDeadline).toLocaleString() : 'TBD'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Target size={18} color="var(--text-muted)" style={{ marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Roles</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {drive.targetRoles?.join(', ') || 'General'}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
