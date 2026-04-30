import React, { useState, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Checkbox } from '../components/ui/Checkbox';
import { Camera, Mic, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Skeleton } from '../components/loaders/Skeleton';

export const ExamPreFlight: React.FC = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data: examData, isLoading } = useQuery({
    queryKey: ['exam', examId],
    queryFn: async () => {
      const res = await api.get(`/exams/${examId}`);
      return res.data.data ?? res.data;
    },
    enabled: !!examId,
  });

  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(stream.getVideoTracks().length > 0);
      setMicActive(stream.getAudioTracks().length > 0);
    } catch (err) {
      console.error('Permission denied', err);
      alert('Camera and microphone access is required to proceed with the exam.');
    }
  };

  const handleStartExam = () => {
    if (agreed && cameraActive && micActive) {
      navigate(`/exams/${examId}`); // Navigate to the actual exam interface
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ textAlign: 'center' }}>
        {isLoading ? (
          <Skeleton variant="text" width="50%" height="2.5rem" style={{ margin: '0 auto 0.5rem' }} />
        ) : (
          <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '2rem' }}>
            {examData?.title ? `${examData.title} - Pre-Flight Check` : 'Pre-Flight Check'}
          </h1>
        )}
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Ensure your hardware is working before entering the proctored environment.</p>
      </header>

      <Card title="Hardware Verification">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'black', borderRadius: '8px', overflow: 'hidden', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {!cameraActive && <Camera size={48} color="var(--text-muted)" style={{ position: 'absolute' }} />}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', background: 'var(--surface-container-high)', borderRadius: '50%' }}>
                <Camera size={24} color={cameraActive ? 'var(--success)' : 'var(--text-muted)'} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>Webcam Check</h4>
                <p style={{ margin: 0, color: cameraActive ? 'var(--success)' : 'var(--warning)', fontSize: '0.875rem' }}>
                  {cameraActive ? 'Camera active' : 'Awaiting permission'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', background: 'var(--surface-container-high)', borderRadius: '50%' }}>
                <Mic size={24} color={micActive ? 'var(--success)' : 'var(--text-muted)'} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>Microphone Check</h4>
                <p style={{ margin: 0, color: micActive ? 'var(--success)' : 'var(--warning)', fontSize: '0.875rem' }}>
                  {micActive ? 'Audio active' : 'Awaiting permission'}
                </p>
              </div>
            </div>

            {!cameraActive && (
              <Button onClick={requestPermissions} style={{ alignSelf: 'flex-start' }}>
                Grant Permissions
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card title="Exam Policies & Behavior">
        <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <li>You must remain in the camera frame for the entire duration of the exam.</li>
          <li>No other person is allowed in the room.</li>
          <li>Do not switch browser tabs or open other applications. Doing so will flag a violation.</li>
          <li>Ensure a stable internet connection.</li>
        </ul>
        
        <div style={{ padding: '1rem', background: 'var(--surface-container-high)', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <AlertTriangle color="var(--warning)" size={24} style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>Proctoring is Active</h4>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Your video, audio, and screen activity will be recorded and analyzed by AI for suspicious behavior.</p>
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Checkbox 
            id="agree-rules" 
            checked={agreed} 
            onChange={(e) => setAgreed(e.target.checked)} 
          />
          <label htmlFor="agree-rules" style={{ color: 'var(--text-primary)', cursor: 'pointer' }}>
            I agree to the exam policies and confirm my hardware is working correctly.
          </label>
        </div>

        <Button 
          size="lg" 
          disabled={!agreed || !cameraActive || !micActive}
          onClick={handleStartExam}
          leftIcon={<CheckCircle2 size={20} />}
          style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
        >
          Begin Examination
        </Button>
      </div>
    </div>
  );
};
