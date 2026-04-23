import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/loaders/Skeleton';
import { AlertCircle, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);
import api from '../lib/api';

interface SkillData {
  subject: string;
  score: number;
  fullMark: number;
}

interface Insight {
  id?: string;
  type: 'strength' | 'improvement' | 'info';
  title: string;
  body: string;
}

const INSIGHT_COLORS: Record<string, string> = {
  strength: 'var(--success)',
  improvement: 'var(--warning)',
  info: 'var(--primary-glow)',
};

const INSIGHT_ICONS: Record<string, React.ReactNode> = {
  strength: <TrendingUp size={16} />,
  improvement: <AlertTriangle size={16} />,
  info: <Info size={16} />,
};

export const ReadinessAnalytics: React.FC = () => {
  const { data: readinessData, isLoading: loadingReadiness, error: readinessError } = useQuery<{ skills: SkillData[] }>({
    queryKey: ['readiness-me'],
    queryFn: async () => {
      const res = await api.get('/placements/readiness/me');
      return res.data.data ?? res.data;
    },
    retry: 1,
  });

  const { data: insightsData, isLoading: loadingInsights } = useQuery<{ insights: Insight[] }>({
    queryKey: ['readiness-insights'],
    queryFn: async () => {
      const res = await api.get('/placements/readiness/me/insights');
      return res.data.data ?? res.data;
    },
    retry: 1,
  });

  const radarData = readinessData?.skills?.map(s => ({
    subject: s.subject,
    A: s.score,
    fullMark: s.fullMark ?? 100,
  })) ?? [];

  const insights: Insight[] = insightsData?.insights ?? [];

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h1 style={{ margin: 0, color: 'var(--text-high)', fontSize: '1.875rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>Readiness Analytics</h1>
        <p style={{ margin: 0, color: 'var(--text-low)' }}>Visualizing your current skill proficiencies and areas for improvement.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Radar Chart */}
        <Card title="Skill Radar" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          {loadingReadiness ? (
            <Skeleton variant="rectangular" height={350} />
          ) : readinessError || radarData.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 350, gap: '0.75rem', color: 'var(--text-low)' }}>
              {readinessError ? (
                <>
                  <AlertCircle size={32} style={{ color: 'var(--error)', opacity: 0.6 }} />
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>Could not load readiness data.</p>
                </>
              ) : (
                <>
                  <TrendingUp size={32} style={{ opacity: 0.3 }} />
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>No readiness data yet. Start taking exams and mock interviews to generate your profile.</p>
                </>
              )}
            </div>
          ) : (
            <div style={{ flex: 1, minHeight: '350px', position: 'relative', padding: '1rem' }}>
              <Radar
                data={{
                  labels: radarData.map(d => d.subject),
                  datasets: [
                    {
                      label: 'Student Score',
                      data: radarData.map(d => d.A),
                      backgroundColor: 'rgba(99, 102, 241, 0.3)',
                      borderColor: 'rgba(99, 102, 241, 1)',
                      pointBackgroundColor: 'rgba(99, 102, 241, 1)',
                      pointBorderColor: '#fff',
                      pointHoverBackgroundColor: '#fff',
                      pointHoverBorderColor: 'rgba(99, 102, 241, 1)'
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    r: {
                      angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                      grid: { color: 'rgba(255, 255, 255, 0.1)' },
                      pointLabels: { color: 'var(--text-low)', font: { size: 13 } },
                      max: 100,
                      min: 0,
                      ticks: {
                        color: 'var(--text-lowest)',
                        backdropColor: 'transparent',
                        stepSize: 20,
                      }
                    }
                  },
                  plugins: {
                    legend: { display: false }
                  }
                }}
              />
            </div>
          )}
        </Card>

        {/* Insights */}
        <Card title="AI-Generated Insights">
          {loadingInsights ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[1, 2, 3].map(i => <Skeleton key={i} variant="rectangular" height={80} />)}
            </div>
          ) : insights.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-lowest)' }}>
              <Info size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
              <p style={{ margin: 0, fontSize: '0.875rem' }}>No insights yet. Complete assessments and mock interviews to generate personalized recommendations.</p>
            </div>
          ) : (
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem', listStyle: 'none', padding: 0, margin: 0 }}>
              {insights.map((insight, i) => (
                <li
                  key={insight.id ?? i}
                  style={{
                    padding: '1rem',
                    borderLeft: `4px solid ${INSIGHT_COLORS[insight.type] ?? 'var(--primary-glow)'}`,
                    background: 'var(--surface-well)',
                  }}
                >
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-high)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: INSIGHT_COLORS[insight.type] }}>{INSIGHT_ICONS[insight.type]}</span>
                    {insight.title}
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-low)', fontSize: '0.875rem' }}>{insight.body}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
};
