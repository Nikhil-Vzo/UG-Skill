import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/loaders/Skeleton';
import { AlertCircle, TrendingUp, AlertTriangle, Info, Brain, Code, UserCheck, Target, Award, ArrowUpRight } from 'lucide-react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from 'chart.js';
import { Radar, Line, Bar } from 'react-chartjs-2';
import { motion } from 'framer-motion';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

const MOCK_DATA = {
  overallScore: 78,
  percentile: 85,
  skills: [
    { subject: 'Data Structures', score: 85, fullMark: 100 },
    { subject: 'System Design', score: 65, fullMark: 100 },
    { subject: 'Frontend', score: 90, fullMark: 100 },
    { subject: 'Backend', score: 75, fullMark: 100 },
    { subject: 'Aptitude', score: 80, fullMark: 100 },
    { subject: 'Communication', score: 88, fullMark: 100 },
  ],
  trends: {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
    coding: [50, 55, 65, 70, 85],
    aptitude: [60, 65, 75, 75, 80],
    mock: [40, 50, 60, 80, 88],
  },
  insights: [
    { type: 'strength', title: 'Frontend Mastery', body: 'You are performing in the top 10% for Frontend tasks.' },
    { type: 'improvement', title: 'System Design', body: 'Focus on distributed systems concepts to improve your score.' },
    { type: 'info', title: 'Consistency', body: 'You have maintained a 5-week streak of improvement.' }
  ]
};

const MetricCard = ({ title, value, icon: Icon, color, trend }: { title: string, value: string | number, icon: any, color: string, trend?: string }) => (
  <motion.div 
    whileHover={{ y: -5, scale: 1.02 }}
    transition={{ type: 'spring', stiffness: 300 }}
    style={{
      background: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '24px',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      position: 'relative',
      overflow: 'hidden'
    }}
  >
    <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: `radial-gradient(circle at 50% 50%, ${color}15, transparent 70%)`, pointerEvents: 'none' }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
      <span style={{ color: 'var(--text-low)', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{title}</span>
      <div style={{ background: `${color}20`, padding: '0.5rem', borderRadius: '12px', color }}>
        <Icon size={20} />
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', zIndex: 1 }}>
      <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-highest)', lineHeight: 1 }}>{value}</span>
      {trend && (
        <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
          <ArrowUpRight size={16} /> {trend}
        </span>
      )}
    </div>
  </motion.div>
);

export const ReadinessAnalytics: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <Skeleton variant="rectangular" height={100} style={{ borderRadius: '24px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {[1,2,3,4].map(i => <Skeleton key={i} variant="rectangular" height={150} style={{ borderRadius: '24px' }} />)}
        </div>
        <Skeleton variant="rectangular" height={400} style={{ borderRadius: '24px' }} />
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1400px', margin: '0 auto', color: 'var(--text-high)' }}
    >
      <motion.header variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem', fontWeight: 800, background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Readiness Analytics
          </h1>
          <p style={{ margin: 0, color: 'var(--text-low)', fontSize: '1.1rem' }}>Your path to placement success, visualized.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '0.75rem 1.5rem', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#818cf8', fontWeight: 600 }}>
            <Target size={20} /> Overall Score: {MOCK_DATA.overallScore}%
          </div>
        </div>
      </motion.header>

      <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <MetricCard title="Percentile" value={`${MOCK_DATA.percentile}th`} icon={Award} color="#f59e0b" trend="+5 this week" />
        <MetricCard title="Coding Round" value="85%" icon={Code} color="#3b82f6" trend="+15%" />
        <MetricCard title="Aptitude Test" value="80%" icon={Brain} color="#8b5cf6" trend="+5%" />
        <MetricCard title="Mock Interview" value="88%" icon={UserCheck} color="#10b981" trend="+8%" />
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
        <motion.div variants={itemVariants} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '24px', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', color: 'var(--text-high)' }}>
            <TrendingUp size={20} color="#818cf8" /> Performance Trends
          </h3>
          <div style={{ height: '300px' }}>
            <Line 
              data={{
                labels: MOCK_DATA.trends.labels,
                datasets: [
                  { label: 'Coding', data: MOCK_DATA.trends.coding, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, tension: 0.4 },
                  { label: 'Aptitude', data: MOCK_DATA.trends.aptitude, borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)', fill: true, tension: 0.4 },
                  { label: 'Mock Interview', data: MOCK_DATA.trends.mock, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, tension: 0.4 },
                ]
              }}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: 'rgba(255,255,255,0.7)' } } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } } } }}
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '24px', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', color: 'var(--text-high)' }}>
            <Target size={20} color="#f472b6" /> Skill Radar
          </h3>
          <div style={{ height: '300px' }}>
            <Radar
              data={{
                labels: MOCK_DATA.skills.map(s => s.subject),
                datasets: [{
                  label: 'Proficiency',
                  data: MOCK_DATA.skills.map(s => s.score),
                  backgroundColor: 'rgba(244, 114, 182, 0.3)',
                  borderColor: 'rgba(244, 114, 182, 1)',
                  pointBackgroundColor: '#fff',
                }]
              }}
              options={{ responsive: true, maintainAspectRatio: false, scales: { r: { angleLines: { color: 'rgba(255, 255, 255, 0.1)' }, grid: { color: 'rgba(255, 255, 255, 0.1)' }, pointLabels: { color: 'rgba(255, 255, 255, 0.7)', font: { size: 12 } }, ticks: { backdropColor: 'transparent', color: 'rgba(255, 255, 255, 0.3)' } } }, plugins: { legend: { display: false } } }}
            />
          </div>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '24px', padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem' }}>AI Actionable Insights</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {MOCK_DATA.insights.map((insight, idx) => {
            const colors: Record<string, string> = { strength: '#10b981', improvement: '#f59e0b', info: '#3b82f6' };
            const Icons: Record<string, any> = { strength: TrendingUp, improvement: AlertTriangle, info: Info };
            const Icon = Icons[insight.type as string];
            const color = colors[insight.type as string];

            return (
              <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.25rem', borderRadius: '16px', borderLeft: `4px solid ${color}` }}>
                <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color }}>
                  <Icon size={18} /> {insight.title}
                </h4>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  {insight.body}
                </p>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};
