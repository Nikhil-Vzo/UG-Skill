import React from 'react';
import { Button } from '../components/ui/Button';
import { Calendar, Sparkles } from 'lucide-react';
import './InterviewPrep.css';

export const InterviewPrep: React.FC = () => {

  return (
    <div className="interview-prep-page">
      <header className="interview-prep-hero ugs-hero">
        <div className="interview-prep-hero-content">
          <div className="ugs-hero-badge"><Sparkles size={14} /> Interview Lab</div>
          <h1 className="ugs-hero-title">Interview Prep</h1>
          <p className="ugs-hero-subtitle">Practice with AI and prepare for interviews with industry experts.</p>
        </div>
      </header>

      <div className="interview-prep-actions">
        <div className="interview-prep-action-card interview-prep-action-card--mock">
          <div className="interview-prep-action-icon">
            <Calendar size={22} />
          </div>
          <h3 className="interview-prep-action-title">Mock Interviews</h3>
          <p className="interview-prep-action-desc">Practice 1-on-1 with industry experts across different tech stacks.</p>
          <Button
            variant="primary"
            leftIcon={<Calendar size={18} />}
            fullWidth
            onClick={() => window.location.href = "https://interviewer-flame-six.vercel.app/call/hritik's-organization-hr"}
          >
            Prepare for interview
          </Button>
        </div>
      </div>

    </div>
  );
};
