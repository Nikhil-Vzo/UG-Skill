import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Play, Pause, Monitor, ShieldAlert, AlertTriangle,
  AlertCircle, RefreshCw, Flag, XOctagon,
} from 'lucide-react';
import api from '../../lib/api';
import { connectSocket, disconnectSocket } from '../../lib/socket';

/* ---------- types ---------- */
interface LiveAttempt {
  id: string;
  name: string;
  activeUsers: number;
  totalWarnings: number;
  status: 'live' | 'paused' | 'ended';
  examId: string;
}

interface Incident {
  id: string;
  userId: string;
  userLabel: string;
  examName: string;
  type: string;
  occurredAt: string;
  severity: 'low' | 'medium' | 'high';
}

/* ---------- fetchers ---------- */
const fetchLiveExams = async (): Promise<LiveAttempt[]> => {
  const { data } = await api.get('/admin/exams/live');
  return Array.isArray(data.data) ? data.data : [];
};

const fetchRecentIncidents = async (): Promise<Incident[]> => {
  const { data } = await api.get('/admin/exams/incidents/recent');
  return Array.isArray(data.data) ? data.data : [];
};

const flagAttempt = async (attemptId: string) => {
  const { data } = await api.post(`/admin/exams/attempts/${attemptId}/flag`);
  return data;
};

const terminateAttempt = async (attemptId: string) => {
  const { data } = await api.post(`/admin/exams/attempts/${attemptId}/terminate`);
  return data;
};

/* ---------- severity badge colours ---------- */
const severityColor: Record<string, string> = {
  low: 'var(--warning)',
  medium: 'var(--warning)',
  high: 'var(--error)',
};

/* ---------- component ---------- */
export const ExamOps: React.FC = () => {
  const qc = useQueryClient();
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  const { data: liveExams, isPending: examsPending, isError: examsError, refetch: refetchExams } = useQuery<LiveAttempt[]>({
    queryKey: ['admin-live-exams'],
    queryFn: fetchLiveExams,
    refetchInterval: 15_000, // auto-refresh every 15 s
  });

  const { data: incidents, isPending: incidentsPending, refetch: refetchIncidents } = useQuery<Incident[]>({
    queryKey: ['admin-incidents', selectedExamId],
    queryFn: fetchRecentIncidents,
  });

  // Socket: Live proctoring alerts
  React.useEffect(() => {
    const trackingSocket = connectSocket('/tracking');
    trackingSocket.emit('join:admin-monitor');

    const onAlert = () => {
      qc.invalidateQueries({ queryKey: ['admin-incidents'] });
      // We could optionally just invalidate exams as well to update warning counts
      qc.invalidateQueries({ queryKey: ['admin-live-exams'] });
    };

    trackingSocket.on('flag:alert', onAlert);

    return () => {
      trackingSocket.off('flag:alert', onAlert);
      disconnectSocket('/tracking');
    };
  }, [qc]);

  const flagMutation = useMutation({
    mutationFn: flagAttempt,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-incidents'] }),
  });

  const terminateMutation = useMutation({
    mutationFn: terminateAttempt,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-live-exams'] });
      qc.invalidateQueries({ queryKey: ['admin-incidents'] });
    },
  });

  /* stats derived from live data */
  const totalWarnings = liveExams?.reduce((s, e) => s + e.totalWarnings, 0) ?? 0;
  const totalActive = liveExams?.reduce((s, e) => s + e.activeUsers, 0) ?? 0;
  const criticalIncidents = incidents?.filter((i) => i.severity === 'high').length ?? 0;

  const examColumns = [
    {
      key: 'name',
      header: 'Exam Name',
      render: (row: LiveAttempt) => (
        <button
          style={{ background: 'none', border: 'none', fontWeight: 500, color: 'var(--primary)', cursor: 'pointer', padding: 0, textAlign: 'left' }}
          onClick={() => setSelectedExamId(row.examId === selectedExamId ? null : row.examId)}
        >
          {row.name}
        </button>
      ),
    },
    { key: 'activeUsers', header: 'Active Users' },
    {
      key: 'totalWarnings',
      header: 'Warnings',
      render: (row: LiveAttempt) => (
        <span style={{ color: row.totalWarnings > 10 ? 'var(--error)' : 'var(--text-primary)', fontWeight: row.totalWarnings > 10 ? 700 : 400 }}>
          {row.totalWarnings}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: LiveAttempt) => (
        <Badge variant={row.status === 'live' ? 'primary' : 'outline'}>{row.status}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_row: LiveAttempt) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="outline" size="sm" leftIcon={<Pause size={14} />}>Pause</Button>
          <Button variant="outline" size="sm" leftIcon={<Monitor size={14} />}>Monitor</Button>
        </div>
      ),
    },
  ];

  const incidentColumns = [
    {
      key: 'occurredAt',
      header: 'Time',
      render: (row: Incident) => new Date(row.occurredAt).toLocaleTimeString(),
    },
    { key: 'userLabel', header: 'User' },
    { key: 'type', header: 'Incident Type' },
    {
      key: 'severity',
      header: 'Severity',
      render: (row: Incident) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: severityColor[row.severity] ?? 'var(--text-secondary)' }}>
          <AlertTriangle size={14} />
          <span style={{ textTransform: 'capitalize' }}>{row.severity}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Incident) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Flag size={14} />}
            onClick={() => flagMutation.mutate(row.id)}
            disabled={flagMutation.isPending}
          >
            Flag
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<XOctagon size={14} />}
            style={{ color: 'var(--error)' }}
            onClick={() => {
              if (window.confirm('Terminate this student\'s attempt?')) {
                terminateMutation.mutate(row.id);
              }
            }}
            disabled={terminateMutation.isPending}
          >
            Terminate
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '2rem' }}>Exam Operations</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Monitor live exams and handle proctoring incidents.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={() => { refetchExams(); refetchIncidents(); }}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '0.5rem 1rem', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <Button variant="primary" leftIcon={<Play size={18} />}>Launch Exam</Button>
        </div>
      </header>

      {examsError && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--error)' }}>
            <AlertCircle size={20} />
            <span>Failed to load live exam data.</span>
          </div>
        </Card>
      )}

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <Card style={{ backgroundColor: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '0.5rem', color: 'var(--error)' }}>
              <ShieldAlert size={24} />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Critical Incidents</p>
              <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.5rem' }}>{criticalIncidents}</h2>
            </div>
          </div>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--primary-transparent)', borderRadius: '0.5rem', color: 'var(--primary)' }}>
              <Monitor size={24} />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Active Test Takers</p>
              <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.5rem' }}>{totalActive}</h2>
            </div>
          </div>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: '0.5rem', color: '#f59e0b' }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Warnings</p>
              <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.5rem' }}>{totalWarnings}</h2>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Live Exams">
        {examsPending ? (
          <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>Loading live exams…</p>
        ) : (
          <DataTable data={liveExams ?? []} columns={examColumns} page={1} totalPages={1} />
        )}
      </Card>

      <Card title={selectedExamId ? 'Proctoring Incidents — Filtered' : 'Recent Proctoring Incidents'}>
        {selectedExamId && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
            Showing incidents for selected exam.{' '}
            <button onClick={() => setSelectedExamId(null)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0 }}>
              Clear filter
            </button>
          </p>
        )}
        {incidentsPending ? (
          <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>Loading incidents…</p>
        ) : incidents?.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>No incidents recorded.</p>
        ) : (
          <DataTable data={incidents ?? []} columns={incidentColumns} page={1} totalPages={1} />
        )}
      </Card>
    </div>
  );
};
