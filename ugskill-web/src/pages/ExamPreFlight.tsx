import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Checkbox } from '../components/ui/Checkbox';
import { Camera, Mic, AlertTriangle, CheckCircle2, XCircle, Sun } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Skeleton } from '../components/loaders/Skeleton';
import './ExamPreFlight.css';

type FaceCheckStatus = 'idle' | 'checking' | 'detected' | 'no-face' | 'poor-lighting';

export const ExamPreFlight: React.FC = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [faceStatus, setFaceStatus] = useState<FaceCheckStatus>('idle');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const faceCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      startFaceCheck();
    } catch (err) {
      console.error('Permission denied', err);
      alert('Camera and microphone access is required to proceed with the exam.');
    }
  };

  const startFaceCheck = () => {
    if (!canvasRef.current) {
      const c = document.createElement('canvas');
      c.width = 320;
      c.height = 240;
      canvasRef.current = c;
    }

    let noFaceCount = 0;

    const checkFace = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      setFaceStatus('checking');

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frame = canvas.toDataURL('image/jpeg', 0.6);

      try {
        const res = await api.post('/proctoring/analyze-frame', {
          attemptId: 'preflight',
          frame,
          capturedAt: new Date().toISOString(),
        });
        const result = res.data.data ?? res.data;

        if (result.facePresent) {
          noFaceCount = 0;
          if (result.confidence < 0.5) {
            setFaceStatus('poor-lighting');
          } else {
            setFaceStatus('detected');
          }
        } else {
          noFaceCount++;
          setFaceStatus('no-face');
        }
      } catch {
        setFaceStatus('idle');
      }
    };

    checkFace();
    faceCheckIntervalRef.current = setInterval(checkFace, 3000);

    return () => {
      if (faceCheckIntervalRef.current) {
        clearInterval(faceCheckIntervalRef.current);
        faceCheckIntervalRef.current = null;
      }
    };
  };

  const handleStartExam = () => {
    if (agreed && cameraActive && micActive && faceStatus === 'detected') {
      navigate(`/app/exams/${examId}`);
    }
  };

  // cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (faceCheckIntervalRef.current) {
        clearInterval(faceCheckIntervalRef.current);
      }
    };
  }, []);

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
        <div className="preflight-grid">
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

            {/* AI Face Detection Feedback */}
            {cameraActive && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 0.875rem', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 600,
                ...(faceStatus === 'detected'
                  ? { background: 'rgba(34,197,94,0.1)', color: '#22c55e' }
                  : faceStatus === 'no-face'
                  ? { background: 'rgba(239,68,68,0.1)', color: '#ef4444' }
                  : faceStatus === 'poor-lighting'
                  ? { background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }
                  : { background: 'var(--surface-container-high)', color: 'var(--text-secondary)' }),
              }}>
                {faceStatus === 'detected' && <CheckCircle2 size={16} />}
                {faceStatus === 'no-face' && <XCircle size={16} />}
                {faceStatus === 'poor-lighting' && <Sun size={16} />}
                {faceStatus === 'idle' || faceStatus === 'checking' ? (
                  <span>AI camera check starting...</span>
                ) : faceStatus === 'detected' ? (
                  <span>Face detected</span>
                ) : faceStatus === 'no-face' ? (
                  <span>No face — look directly at camera</span>
                ) : (
                  <span>Poor lighting detected</span>
                )}
              </div>
            )}

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
          disabled={!agreed || !cameraActive || !micActive || faceStatus !== 'detected'}
          onClick={handleStartExam}
          leftIcon={<CheckCircle2 size={20} />}
          style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
        >
          Begin Examination
        </Button>
        {cameraActive && faceStatus !== 'detected' && faceStatus !== 'idle' && faceStatus !== 'checking' && (
          <p style={{ color: 'var(--error)', fontSize: '0.8125rem', margin: 0 }}>
            Face verification required before starting.
          </p>
        )}
      </div>
    </div>
  );
};
