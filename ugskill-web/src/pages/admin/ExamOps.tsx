import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Play, Pause, Monitor, ShieldAlert, AlertTriangle,
  AlertCircle, RefreshCw, Flag, XOctagon, Eye, FileBarChart,
  ChevronRight, X, Skull, Activity
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
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface StudentProctor {
  attemptId: string;
  studentId: string;
  riskScore: number;
  violationCount: number;
  avgAiConfidence: number;
  flaggedEvents: { type: string; severity: string; timestamp: string; aiConfidence: number }[];
}

interface AlertToast {
  id: string;
  attemptId: string;
  severity: string;
  type: string;
  message: string;
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

const fetchProctoringReport = async (examId: string): Promise<StudentProctor[]> => {
  const { data } = await api.get(`/admin/exams/${examId}/proctoring-report`);
  return Array.isArray(data.data) ? data.data : [];
};

const terminateAttempt = async (attemptId: string) => {
  const { data } = await api.post(`/exams/dummy/attempts/${attemptId}/terminate`);
  return data;
};

const overrideEvent = async ({ attemptId, eventId, reason }: { attemptId: string; eventId: string; reason: string }) => {
  const { data } = await api.post(`/proctoring/attempts/${attemptId}/override`, { eventId, reason });
  return data;
};

/* ---------- severity helpers ---------- */
const severityColor: Record<string, string> = {
  low: '#f59e0b',
  medium: '#f97316',
  high: '#ef4444',
  critical: '#dc2626',
};

const riskBadge = (score: number) => {
  if (score >= 80) return { variant: 'error' as const, label: 'CRITICAL' };
  if (score >= 50) return { variant: 'warning' as const, label: 'HIGH' };
  if (score >= 20) return { variant: 'primary' as const, label: 'MEDIUM' };
  return { variant: 'default' as const, label: 'LOW' };
};

/* ---------- component ---------- */
export const ExamOps: React.FC = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentProctor | null>(null);
  const [liveAlerts, setLiveAlerts] = useState<AlertToast[]>([]);

  const { data: liveExams, isPending: examsPending, isError: examsError, refetch: refetchExams } = useQuery<LiveAttempt[]>({
    queryKey: ['admin-live-exams'],
    queryFn: fetchLiveExams,
    refetchInterval: 15_000,
  });

  const { data: incidents, isPending: incidentsPending, refetch: refetchIncidents } = useQuery<Incident[]>({
    queryKey: ['admin-incidents'],
    queryFn: fetchRecentIncidents,
  });

  const { data: proctorReport, isPending: reportPending } = useQuery<StudentProctor[]>({
    queryKey: ['admin-proctor-report', selectedExamId],
    queryFn: () => fetchProctoringReport(selectedExamId!),
    enabled: !!selectedExamId,
  });

  // Socket: Live proctoring alerts + AI events
  React.useEffect(() => {
    const trackingSocket = connectSocket('/tracking');
    trackingSocket.emit('join:admin-monitor');

    const onAlert = () => {
      qc.invalidateQueries({ queryKey: ['admin-incidents'] });
      qc.invalidateQueries({ queryKey: ['admin-live-exams'] });
      if (selectedExamId) {
        qc.invalidateQueries({ queryKey: ['admin-proctor-report', selectedExamId] });
      }
    };

    const onAIAlert = (payload: any) => {
      onAlert();
      const toast: AlertToast = {
        id: `${Date.now()}-${Math.random()}`,
        attemptId: payload.attemptId,
        severity: payload.severity,
        type: payload.type,
        message: `AI Alert: ${payload.type} (${payload.severity}) — Risk ${payload.riskScore}`,
      };
      setLiveAlerts(prev => [toast, ...prev].slice(0, 5));
      setTimeout(() => {
        setLiveAlerts(prev => prev.filter(a => a.id !== toast.id));
      }, 8000);
    };

    trackingSocket.on('flag:alert', onAlert);
    trackingSocket.on('proctoring:ai-alert', onAIAlert);
    trackingSocket.on('proctoring:warning', onAlert);
    trackingSocket.on('proctoring:terminated', onAlert);

    return () => {
      trackingSocket.off('flag:alert', onAlert);
      trackingSocket.off('proctoring:ai-alert', onAIAlert);
      trackingSocket.off('proctoring:warning', onAlert);
      trackingSocket.off('proctoring:terminated', onAlert);
      disconnectSocket('/tracking');
    };
  }, [qc, selectedExamId]);

  const terminateMutation = useMutation({
    mutationFn: terminateAttempt,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-live-exams'] });
      qc.invalidateQueries({ queryKey: ['admin-incidents'] });
      qc.invalidateQueries({ queryKey: ['admin-proctor-report', selectedExamId] });
    },
  });

  const overrideMutation = useMutation({
    mutationFn: overrideEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-proctor-report', selectedExamId] });
    },
  });

  /* stats */
  const totalWarnings = liveExams?.reduce((s, e) => s + (e.totalWarnings || 0), 0) ?? 0;
  const totalActive = liveExams?.reduce((s, e) => s + (e.activeUsers || 0), 0) ?? 0;
  const criticalIncidents = incidents?.filter((i) => i.severity === 'high' || i.severity === 'critical').length ?? 0;

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
        <span style={{ color: (row.totalWarnings || 0) > 10 ? 'var(--error)' : 'var(--text-primary)', fontWeight: (row.totalWarnings || 0) > 10 ? 700 : 400 }}>
          {row.totalWarnings || 0}
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
      render: (row: LiveAttempt) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="outline" size="sm" leftIcon={<Pause size={14} />}>Pause</Button>
          <Button variant="outline" size="sm" leftIcon={<Monitor size={14} />} onClick={() => setSelectedExamId(row.examId)}>Monitor</Button>
          <Button variant="ghost" size="sm" leftIcon={<FileBarChart size={14} />} onClick={() => navigate(`/app/admin/proctoring-report/${row.examId}`)}>Report</Button>
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
  ];

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Live Alert Toasts */}
      {liveAlerts.length > 0 && (
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 400 }}>
          {liveAlerts.map(alert => (
            <div key={alert.id} style={{ padding: '1rem', borderRadius: 8, background: severityColor[alert.severity] ? `${severityColor[alert.severity]}15` : 'var(--surface-well)', border: `1px solid ${severityColor[alert.severity] || 'var(--border)'}`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ShieldAlert size={18} color={severityColor[alert.severity] || 'var(--error)'} />
              <span style={{ fontSize: '0.875rem', flex: 1 }}>{alert.message}</span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setLiveAlerts(prev => prev.filter(a => a.id !== alert.id))}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '2rem' }}>Exam Operations</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Monitor live exams, view AI proctoring risk scores, and handle incidents in real time.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={() => { refetchExams(); refetchIncidents(); }}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '0.5rem 1rem', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <Button variant="primary" leftIcon={<Play size={18} />} onClick={() => navigate('/app/admin/exams/builder')}>Create New Exam</Button>
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

      {/* Risk Score Grid */}
      {selectedExamId && (
        <Card title={`Proctoring Risk Grid — ${liveExams?.find(e => e.examId === selectedExamId)?.name || ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Real-time risk scores per student. Click a row to view event timeline.
            </p>
            <button onClick={() => setSelectedExamId(null)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.875rem' }}>
              Close Grid
            </button>
          </div>
          {reportPending ? (
            <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>Loading risk scores…</p>
          ) : !proctorReport || proctorReport.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>No proctoring data for this exam.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '1rem' }}>
              {proctorReport.map(student => {
                const risk = riskBadge(student.riskScore);
                return (
                  <div
                    key={student.studentId}
                    onClick={() => setSelectedStudent(student)}
                    style={{
                      padding: '1rem',
                      borderRadius: 12,
                      border: '1px solid var(--surface-highest)',
                      background: 'var(--surface-well)',
                      cursor: 'pointer',
                      transition: 'box-shadow 0.2s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{student.studentId.slice(0, 8)}…</span>
                      <Badge variant={risk.variant}>{risk.label}</Badge>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <div>Risk: <strong style={{ color: 'var(--text-primary)' }}>{student.riskScore}</strong></div>
                      <div>Violations: <strong style={{ color: 'var(--text-primary)' }}>{student.violationCount}</strong></div>
                      <div>Confidence: <strong style={{ color: 'var(--text-primary)' }}>{student.avgAiConfidence}</strong></div>
                      <div>Flags: <strong style={{ color: 'var(--text-primary)' }}>{student.flaggedEvents.length}</strong></div>
                    </div>
                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        fullWidth
                        leftIcon={<Eye size={14} />}
                        onClick={(e) => { e.stopPropagation(); setSelectedStudent(student); }}
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        fullWidth
                        style={{ color: 'var(--error)' }}
                        leftIcon={<XOctagon size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Terminate this student\'s attempt?')) {
                            terminateMutation.mutate(student.attemptId);
                          }
                        }}
                        disabled={terminateMutation.isPending}
                      >
                        Terminate
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Per-Student Drawer */}
      {selectedStudent && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000,
          display: 'flex', justifyContent: 'flex-end', transition: 'all 0.3s ease'
        }} onClick={() => setSelectedStudent(null)}>
          <div className="glass-panel" style={{
            width: 440, maxWidth: '90vw', height: '100%',
            background: 'rgba(15, 17, 26, 0.95)', borderLeft: '1px solid var(--surface-highest)',
            padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.75rem',
            overflowY: 'auto', boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-display)', color: 'var(--text-high)' }}>Student Details</h3>
              <button style={{ background: 'var(--surface-well)', border: '1px solid var(--surface-highest)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.2s' }} onClick={() => setSelectedStudent(null)} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-high)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary-transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <Activity size={24} />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>{selectedStudent.studentId.slice(0, 16)}…</p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Attempt {selectedStudent.attemptId.slice(0, 8)}…</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Card>
                <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Risk Score</p>
                <h2 style={{ margin: 0, color: selectedStudent.riskScore >= 80 ? 'var(--error)' : 'var(--text-primary)' }}>{selectedStudent.riskScore}</h2>
              </Card>
              <Card>
                <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Violations</p>
                <h2 style={{ margin: 0 }}>{selectedStudent.violationCount}</h2>
              </Card>
            </div>

            <div>
              <h4 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Flagged Events</h4>
              {selectedStudent.flaggedEvents.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No flagged events.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedStudent.flaggedEvents.map((evt, idx) => (
                    <div key={idx} style={{ padding: '0.75rem', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--surface-highest)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>{evt.type}</p>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(evt.timestamp).toLocaleString()}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Badge variant={evt.severity === 'CRITICAL' ? 'error' : evt.severity === 'HIGH' ? 'warning' : 'default'}>{evt.severity}</Badge>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI: {(evt.aiConfidence * 100).toFixed(0)}%</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Flag size={14} />}
                          onClick={() => {
                            const reason = window.prompt('Override reason?');
                            if (reason) overrideMutation.mutate({ attemptId: selectedStudent.attemptId, eventId: String(idx), reason });
                          }}
                        >
                          Override
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem' }}>
              <Button
                variant="outline"
                fullWidth
                leftIcon={<Skull size={16} />}
                style={{ color: 'var(--error)', borderColor: 'var(--error)' }}
                onClick={() => {
                  if (window.confirm('Terminate this student\'s attempt?')) {
                    terminateMutation.mutate(selectedStudent.attemptId);
                  }
                }}
                disabled={terminateMutation.isPending}
              >
                Terminate Attempt
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card title={selectedExamId ? 'Recent Proctoring Incidents — Context' : 'Recent Proctoring Incidents'}>
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
