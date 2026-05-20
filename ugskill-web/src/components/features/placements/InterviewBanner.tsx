import React from 'react';
import { Radio, Video, PlayCircle, ExternalLink } from 'lucide-react';
import './InterviewBanner.css';

export interface InterviewSession {
  id: string;
  companyName?: string;
  driveName?: string;
  companyLogo?: string;
  roundNumber?: number;
  status: 'scheduled' | 'in_progress' | 'completed';
  createdAt?: string;
  startedAt?: string;
}

interface InterviewBannerProps {
  sessions: InterviewSession[];
  onJoin: (id: string) => void;
}

export const InterviewBanner: React.FC<InterviewBannerProps> = ({ sessions, onJoin }) => {
  const live = sessions.filter(s => s.status === 'in_progress');
  const scheduled = sessions.filter(s => s.status === 'scheduled');
  const allActive = [...live, ...scheduled];

  if (allActive.length === 0) return null;

  return (
    <div className="interview-banner-container">
      {live.length > 0 && (
        <div className="interview-banner interview-banner--live">
          <div className="interview-banner__pulse-ring" />
          <div className="interview-banner__icon-wrap">
            <Radio size={20} className="interview-banner__icon" />
          </div>
          <div className="interview-banner__body">
            <div className="interview-banner__label">Interview is Live</div>
            <div className="interview-banner__sub">
              {live[0].companyName ?? 'Your interview'} · Round {live[0].roundNumber || 1}
              {live[0].driveName ? ` · ${live[0].driveName}` : ''}
            </div>
          </div>
          <button className="interview-banner__cta interview-banner__cta--live" onClick={() => onJoin(live[0].id)}>
            <PlayCircle size={16} /> Join Interview
          </button>
        </div>
      )}
      {scheduled.map(s => (
        <div key={s.id} className="interview-banner interview-banner--scheduled">
          <div className="interview-banner__icon-wrap interview-banner__icon-wrap--amber">
            <Video size={20} className="interview-banner__icon" />
          </div>
          <div className="interview-banner__body">
            <div className="interview-banner__label">Interview Room Ready</div>
            <div className="interview-banner__sub">
              {s.companyName ?? 'Interview'} · Round {s.roundNumber || 1}
              {s.driveName ? ` · ${s.driveName}` : ''}
            </div>
          </div>
          <button className="interview-banner__cta" onClick={() => onJoin(s.id)}>
            <ExternalLink size={16} /> Join Room
          </button>
        </div>
      ))}
    </div>
  );
};
