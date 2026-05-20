import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  ArrowLeft, AlertTriangle, Eye, User, Calendar,
  TrendingUp, BarChart3, Flag
} from 'lucide-react';
import api from '../../lib/api';

interface ProctoringEvent {
  type: string;
  severity: string;
  timestamp: string;
  aiConfidence: number;
}

interface StudentReport {
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  violationCount: number;
  riskScore: number;
  avgAiConfidence: number;
  flaggedEvents: ProctoringEvent[];
}

const fetchProctoringReport = async (examId: string): Promise<StudentReport[]> => {
  const { data } = await api.get(`/admin/exams/${examId}/proctoring-report`);
  return Array.isArray(data.data) ? data.data : [];
};

const severityColor = (sev: string) => {
  switch (sev?.toLowerCase()) {
    case 'critical': return 'var(--error)';
    case 'high': return '#f97316';
    case 'medium': return '#f59e0b';
    default: return 'var(--text-secondary)';
  }
};

const riskBadge = (score: number) => {
  if (score >= 80) return { variant: 'error' as const, label: 'CRITICAL' };
  if (score >= 50) return { variant: 'warning' as const, label: 'HIGH' };
  if (score >= 20) return { variant: 'primary' as const, label: 'MEDIUM' };
  return { variant: 'default' as const, label: 'LOW' };
};

export const ProctoringReport: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const { data: report, isPending } = useQuery<StudentReport[]>({
    queryKey: ['proctoring-report', examId],
    queryFn: () => fetchProctoringReport(examId!),
    enabled: !!examId,
  });

  const totalViolations = report?.reduce((s, r) => s + r.violationCount, 0) ?? 0;
  const avgRisk = report && report.length > 0
    ? Math.round(report.reduce((s, r) => s + r.riskScore, 0) / report.length)
    : 0;
  const criticalStudents = report?.filter(r => r.riskScore >= 80).length ?? 0;

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate('/app/admin/exams')}>
          Back
        </Button>
        <div>
          <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.75rem', color: 'var(--text-primary)' }}>Proctoring Report</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Post-exam AI proctoring summary &nbsp;•&nbsp; Exam ID: {examId?.slice(0, 8)}…
          </p>
        </div>
      </header>

      {isPending ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading report…</p>
      ) : !report || report.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <BarChart3 size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No proctoring data available for this exam.</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Summary Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '1rem', borderRadius: '0.5rem', background: 'var(--primary-transparent)', color: 'var(--primary)' }}>
                  <User size={24} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Students</p>
                  <h2 style={{ margin: 0 }}>{report.length}</h2>
                </div>
              </div>
            </Card>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '1rem', borderRadius: '0.5rem', background: 'rgba(239,68,68,0.1)', color: 'var(--error)' }}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Violations</p>
                  <h2 style={{ margin: 0 }}>{totalViolations}</h2>
                </div>
              </div>
            </Card>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '1rem', borderRadius: '0.5rem', background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Avg Risk Score</p>
                  <h2 style={{ margin: 0 }}>{avgRisk}</h2>
                </div>
              </div>
            </Card>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '1rem', borderRadius: '0.5rem', background: 'rgba(220,38,38,0.1)', color: '#dc2626' }}>
                  <Flag size={24} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Critical Students</p>
                  <h2 style={{ margin: 0 }}>{criticalStudents}</h2>
                </div>
              </div>
            </Card>
          </div>

          {/* Student Detail Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {report.map(student => {
              const risk = riskBadge(student.riskScore);
              return (
                <Card key={student.studentId}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                        <User size={20} />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
                          {student.studentName || `${student.studentId.slice(0, 8)}…`}
                        </p>
                        {student.studentEmail && (
                          <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {student.studentEmail}
                          </p>
                        )}
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {student.violationCount} violations &nbsp;•&nbsp; Avg confidence {(student.avgAiConfidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Risk Score</p>
                        <h3 style={{ margin: 0, color: student.riskScore >= 80 ? 'var(--error)' : 'var(--text-primary)' }}>{student.riskScore}</h3>
                      </div>
                      <Badge variant={risk.variant}>{risk.label}</Badge>
                    </div>
                  </div>

                  {student.flaggedEvents.length > 0 && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                        Flagged Events ({student.flaggedEvents.length})
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {student.flaggedEvents.map((evt, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '0.75rem 1rem',
                              borderRadius: 8,
                              background: 'var(--surface-well)',
                              border: '1px solid var(--surface-highest)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '0.5rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: severityColor(evt.severity) }} />
                              <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{evt.type}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />
                                {new Date(evt.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Badge variant={evt.severity === 'CRITICAL' ? 'error' : evt.severity === 'HIGH' ? 'warning' : 'default'}>
                                {evt.severity}
                              </Badge>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                AI {(evt.aiConfidence * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
