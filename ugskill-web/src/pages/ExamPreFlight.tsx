import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Checkbox } from '../components/ui/Checkbox';
import { Camera, Mic, AlertTriangle, CheckCircle2, XCircle, Sun, UserCheck, Loader2, Smartphone } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Skeleton } from '../components/loaders/Skeleton';
import { ProctoringEngine, type ProctoringEngineStatus } from '../lib/proctoring/ProctoringEngine';
import './ExamPreFlight.css';

type FaceCheckStatus = 'idle' | 'checking' | 'detected' | 'no-face' | 'poor-lighting';

export const ExamPreFlight: React.FC = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAdmin = searchParams.get('admin') === 'true';
  const [agreed, setAgreed] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  
  // Real-time local proctoring states
  const [faceStatus, setFaceStatus] = useState<FaceCheckStatus>('idle');
  const [phonePresent, setPhonePresent] = useState(false);
  const [engineStatus, setEngineStatus] = useState<ProctoringEngineStatus>({
    state: 'idle',
    fps: 2,
    faceReady: false,
    objectReady: false,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const proctoringEngineRef = useRef<ProctoringEngine | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
      streamRef.current = stream;
      
      setCameraActive(stream.getVideoTracks().length > 0);
      setMicActive(stream.getAudioTracks().length > 0);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video element metadata to load before starting proctoring
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current?.play();
            startRealProctoring();
          } catch (e) {
            console.error('Play video failed', e);
          }
        };
      }
    } catch (err) {
      console.error('Permission denied or hardware error', err);
    }
  };

  const startRealProctoring = async () => {
    if (!videoRef.current) return;

    // Clean up old instance if exists
    if (proctoringEngineRef.current) {
      proctoringEngineRef.current.stop();
    }

    const engine = new ProctoringEngine({
      video: videoRef.current,
      onIncident: (incident) => {
        // Log incidents to preflight console for diagnostic visibility
        console.log('Preflight Proctoring Incident:', incident);
      },
      onStatusChange: (status) => {
        setEngineStatus(status);
        
        // Map presence status
        if (status.facePresent !== undefined) {
          setFaceStatus(status.facePresent ? 'detected' : 'no-face');
        } else {
          setFaceStatus(status.state === 'loading' ? 'checking' : 'idle');
        }

        if (status.phonePresent !== undefined) {
          setPhonePresent(status.phonePresent);
        }
      },
    });

    proctoringEngineRef.current = engine;
    try {
      await engine.initialize();
      engine.start();
    } catch (err) {
      console.error('Failed to initialize local proctoring engine', err);
    }
  };

  const handleStartExam = () => {
    if (isAdmin) {
      navigate(`/app/exams/${examId}?admin=true`);
      return;
    }
    if (agreed && cameraActive && micActive) {
      navigate(`/app/exams/${examId}`);
    }
  };

  // request permissions on load, cleanup on unmount
  useEffect(() => {
    requestPermissions();

    return () => {
      if (proctoringEngineRef.current) {
        proctoringEngineRef.current.stop();
        proctoringEngineRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="preflight-page">
      <header className="preflight-hero ugs-hero">
        <div className="preflight-hero-content">
          {isLoading ? (
            <Skeleton variant="text" width="60%" height="2rem" style={{ margin: '0 auto' }} />
          ) : (
            <>
              <div className="ugs-hero-badge">Pre-Flight Check</div>
              <h1 className="ugs-hero-title">
                {examData?.title ? examData.title : 'Exam Setup'}
              </h1>
            </>
          )}
          <p className="ugs-hero-subtitle">Ensure your camera, mic, and proctoring checks pass before you begin.</p>
        </div>
      </header>

      <Card title="Hardware & AI Verification Diagnostics">
        <div className="preflight-layout">
          {/* Live Video Preview Box */}
          <div className="preview-column">
            <div className="preview-container">
              {cameraActive ? (
                <video ref={videoRef} autoPlay playsInline muted className="preview-video" />
              ) : (
                <div className="preview-placeholder">
                  <Camera size={48} className="placeholder-icon animate-pulse" />
                  <p className="placeholder-text">Camera stream inactive</p>
                </div>
              )}
              {cameraActive && (
                <div className="preview-overlay">
                  <span className="live-badge">LIVE</span>
                </div>
              )}
            </div>
            {!cameraActive && (
              <Button onClick={requestPermissions} size="sm" style={{ marginTop: '1rem', width: '100%' }}>
                Request Device Permissions
              </Button>
            )}
          </div>

          {/* Simple Diagnostics Checklist Column */}
          <div className="checklist-column">
            {/* Camera Access Card */}
            <div className={`diagnostic-card ${cameraActive ? 'status-success' : 'status-waiting'}`}>
              <div className="card-header-row">
                <div className="icon-wrapper">
                  <Camera size={20} />
                </div>
                <div className="card-info">
                  <h3 className="card-title">Video Feed Integrity</h3>
                  <p className="card-desc">Webcam authorization checks</p>
                </div>
                <div className="card-status">
                  {cameraActive ? (
                    <span className="status-text success">
                      <CheckCircle2 size={16} /> ACTIVE
                    </span>
                  ) : (
                    <span className="status-text waiting animate-pulse">AWAITING LINK</span>
                  )}
                </div>
              </div>
            </div>

            {/* Microphone Access Card */}
            <div className={`diagnostic-card ${micActive ? 'status-success' : 'status-waiting'}`}>
              <div className="card-header-row">
                <div className="icon-wrapper">
                  <Mic size={20} />
                </div>
                <div className="card-info">
                  <h3 className="card-title">Acoustic Input Status</h3>
                  <p className="card-desc">Microphone input detection checks</p>
                </div>
                <div className="card-status">
                  {micActive ? (
                    <span className="status-text success">
                      <CheckCircle2 size={16} /> ACTIVE
                    </span>
                  ) : (
                    <span className="status-text waiting animate-pulse">AWAITING LINK</span>
                  )}
                </div>
              </div>
            </div>

            {/* AI Model Loading Progress Indicator */}
            <div className={`diagnostic-card ${
              engineStatus.state === 'running' || engineStatus.state === 'ready' ? 'status-success'
              : engineStatus.state === 'loading' ? 'status-warning'
              : engineStatus.state === 'error' ? 'status-error'
              : 'status-waiting'
            }`}>
              <div className="card-header-row">
                <div className="icon-wrapper">
                  <Loader2 size={20} className={engineStatus.state === 'loading' ? 'animate-spin' : ''} />
                </div>
                <div className="card-info">
                  <h3 className="card-title">AI Proctoring Models</h3>
                  <p className="card-desc">
                    {engineStatus.state === 'loading'
                      ? `Loading: ${!engineStatus.faceReady ? 'Face' : 'Object'} Model...`
                      : 'Edge ML models cached in memory'}
                  </p>
                </div>
                <div className="card-status">
                  {engineStatus.state === 'running' || engineStatus.state === 'ready' ? (
                    <span className="status-text success">
                      <CheckCircle2 size={16} /> WARM & READY
                    </span>
                  ) : engineStatus.state === 'loading' ? (
                    <span className="status-text scanning">
                      <Loader2 size={16} className="animate-spin" /> LOADING...
                    </span>
                  ) : engineStatus.state === 'error' ? (
                    <span className="status-text error">
                      <XCircle size={16} /> LOAD ERROR
                    </span>
                  ) : (
                    <span className="status-text waiting">AWAITING FEED</span>
                  )}
                </div>
              </div>
            </div>

            {/* Real-time Biometric Face Lock */}
            {cameraActive && (engineStatus.state === 'running' || engineStatus.state === 'ready') && (
              <div className={`diagnostic-card ${faceStatus === 'detected' ? 'status-success' : 'status-error'}`}>
                <div className="card-header-row">
                  <div className="icon-wrapper">
                    <UserCheck size={20} />
                  </div>
                  <div className="card-info">
                    <h3 className="card-title">Live Biometric Lock</h3>
                    <p className="card-desc">AI facial presence detection</p>
                  </div>
                  <div className="card-status">
                    {faceStatus === 'detected' ? (
                      <span className="status-text success">
                        <CheckCircle2 size={16} /> FACE VERIFIED
                      </span>
                    ) : (
                      <span className="status-text error animate-pulse">
                        <XCircle size={16} /> NO FACE DETECTED
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Real-time Phone Environment Scan */}
            {cameraActive && (engineStatus.state === 'running' || engineStatus.state === 'ready') && (
              <div className={`diagnostic-card ${!phonePresent ? 'status-success' : 'status-error'}`}>
                <div className="card-header-row">
                  <div className="icon-wrapper">
                    {phonePresent ? <AlertTriangle size={20} /> : <Smartphone size={20} />}
                  </div>
                  <div className="card-info">
                    <h3 className="card-title">Desk Environment Scan</h3>
                    <p className="card-desc">Cell phone/device presence detection</p>
                  </div>
                  <div className="card-status">
                    {!phonePresent ? (
                      <span className="status-text success">
                        <CheckCircle2 size={16} /> NO PHONES DETECTED
                      </span>
                    ) : (
                      <span className="status-text error animate-pulse">
                        <XCircle size={16} /> CELL PHONE DETECTED!
                      </span>
                    )}
                  </div>
                </div>
              </div>
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
          className="preflight-begin-btn"
          size="lg"
          disabled={!isAdmin && (!agreed || !cameraActive || !micActive)}
          onClick={handleStartExam}
          leftIcon={<CheckCircle2 size={20} />}
          style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
        >
          {isAdmin ? 'Begin Admin Preview' : 'Begin Examination'}
        </Button>
        {isAdmin && (
           <p style={{ color: 'var(--accent)', fontSize: '0.8125rem', margin: 0 }}>
            Admin Bypass Active: Hardware checks skipped.
          </p>
        )}
        {!isAdmin && cameraActive && (engineStatus.state === 'running' || engineStatus.state === 'ready') && faceStatus !== 'detected' && (
          <p style={{ color: 'var(--warning)', fontSize: '0.8125rem', margin: 0, textAlign: 'center' }}>
            Note: If face verification is not locked, ensure you are well-lit and facing the camera directly.
          </p>
        )}
        {!isAdmin && cameraActive && phonePresent && (
          <p style={{ color: 'var(--error)', fontSize: '0.8125rem', margin: 0, textAlign: 'center', fontWeight: 'bold' }}>
            Warning: Please remove your cell phone from the camera range before beginning.
          </p>
        )}
      </div>
    </div>
  );
};
