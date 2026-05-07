import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);
import { Users, CreditCard, BookOpen, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../lib/api';

/* ---------- types ---------- */
interface AdminStats {
  activeUsers: number;
  mrr: number;
  totalEnrollments: number;
  activeExams: number;
  growthTrend: { name: string; users: number; revenue: number; enrollments: number }[];
}

/* ---------- fetcher ---------- */
const fetchAdminStats = async (): Promise<AdminStats> => {
  try {
    const { data } = await api.get('/admin/stats');
    return data.data;
  } catch {
    // Endpoint not yet implemented — return safe defaults
    return { activeUsers: 0, mrr: 0, totalEnrollments: 0, activeExams: 0, growthTrend: [] };
  }
};

/* ---------- helpers ---------- */
const fmt = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n);

const KpiSkeleton = () => (
  <Card>
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ width: 56, height: 56, borderRadius: 8, background: 'var(--border)', animation: 'pulse 1.5s ease infinite' }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 12, width: '60%', borderRadius: 4, background: 'var(--border)', marginBottom: 8, animation: 'pulse 1.5s ease infinite' }} />
        <div style={{ height: 24, width: '40%', borderRadius: 4, background: 'var(--border)', animation: 'pulse 1.5s ease infinite' }} />
      </div>
    </div>
  </Card>
);

/* ---------- component ---------- */
export const AdminDashboard: React.FC = () => {
  const { data: stats, isPending, isError, refetch } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: fetchAdminStats,
    staleTime: 60_000,
  });

  const kpis = stats
    ? [
        {
          label: 'Active Users',
          value: fmt(stats.activeUsers),
          icon: <Users size={24} />,
          bg: 'var(--primary-transparent)',
          color: 'var(--primary)',
        },
        {
          label: 'MRR',
          value: `$${fmt(stats.mrr)}`,
          icon: <CreditCard size={24} />,
          bg: 'rgba(16,185,129,0.1)',
          color: '#10B981',
        },
        {
          label: 'Total Enrollments',
          value: fmt(stats.totalEnrollments),
          icon: <BookOpen size={24} />,
          bg: 'rgba(59,130,246,0.1)',
          color: '#3b82f6',
        },
        {
          label: 'Active Exams',
          value: String(stats.activeExams),
          icon: <TrendingUp size={24} />,
          bg: 'rgba(245,158,11,0.1)',
          color: '#f59e0b',
        },
      ]
    : [];

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '2rem' }}>Admin KPI Dashboard</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Global platform metrics and health indicators.</p>
        </div>
        {!isPending && (
          <button
            onClick={() => refetch()}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '0.5rem 1rem', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        )}
      </header>

      {/* Error state */}
      {isError && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--error)' }}>
            <AlertCircle size={20} />
            <span>Failed to load stats. <button onClick={() => refetch()} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}>Retry</button></span>
          </div>
        </Card>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        {isPending
          ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
          : kpis.map((k) => (
              <Card key={k.label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '1rem', background: k.bg, borderRadius: 8, color: k.color }}>
                    {k.icon}
                  </div>
                  <div>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{k.label}</p>
                    <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 700 }}>
                      {k.value}
                    </h2>
                  </div>
                </div>
              </Card>
            ))}
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
        
        {/* Revenue Line Chart */}
        <Card title="Revenue Growth" style={{ minHeight: '350px' }}>
          {isPending ? (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : (stats?.growthTrend ?? []).length === 0 ? (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No trend data available.
            </div>
          ) : (
            <div style={{ width: '100%', height: 300, marginTop: '1rem' }}>
              <Line 
                data={{
                  labels: stats?.growthTrend.map(d => d.name) || [],
                  datasets: [
                    {
                      label: 'Revenue ($)',
                      data: stats?.growthTrend.map(d => d.revenue) || [],
                      borderColor: '#10B981',
                      backgroundColor: 'rgba(16,185,129,0.1)',
                      fill: true,
                      tension: 0.4
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' } }, x: { grid: { display: false } } }
                }}
              />
            </div>
          )}
        </Card>

        {/* Users vs Enrollments Bar Chart */}
        <Card title="Engagement Trends" style={{ minHeight: '350px' }}>
          {isPending ? (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : (stats?.growthTrend ?? []).length === 0 ? (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No trend data available.
            </div>
          ) : (
            <div style={{ width: '100%', height: 300, marginTop: '1rem' }}>
              <Bar 
                data={{
                  labels: stats?.growthTrend.map(d => d.name) || [],
                  datasets: [
                    {
                      label: 'Users',
                      data: stats?.growthTrend.map(d => d.users) || [],
                      backgroundColor: 'var(--primary)',
                      borderRadius: 4,
                    },
                    {
                      label: 'Enrollments',
                      data: stats?.growthTrend.map(d => d.enrollments) || [],
                      backgroundColor: '#3b82f6',
                      borderRadius: 4,
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: { y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' } }, x: { grid: { display: false } } }
                }}
              />
            </div>
          )}
        </Card>

        {/* Distribution Doughnut Chart */}
        <Card title="Platform Distribution" style={{ minHeight: '350px' }}>
          {isPending ? (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : !stats ? (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No data available.
            </div>
          ) : (
            <div style={{ width: '100%', height: 300, marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '80%' }}>
                <Doughnut 
                  data={{
                    labels: ['Active Users', 'Total Enrollments', 'Active Exams'],
                    datasets: [
                      {
                        data: [stats.activeUsers, stats.totalEnrollments, stats.activeExams],
                        backgroundColor: ['var(--primary)', '#3b82f6', '#f59e0b'],
                        borderWidth: 0,
                        hoverOffset: 4
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                      legend: { position: 'bottom', labels: { color: 'var(--text-secondary)' } }
                    }
                  }}
                />
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
