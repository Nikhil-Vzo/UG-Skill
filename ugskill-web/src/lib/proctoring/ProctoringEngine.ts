import type { ObjectDetection } from '@tensorflow-models/coco-ssd';
import type { FaceLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision';

type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ProctoringViolationType =
  | 'gaze_away'
  | 'talking'
  | 'no_face'
  | 'multiple_faces'
  | 'phone_detected';

export interface ProctoringIncident {
  type: ProctoringViolationType;
  severity: Severity;
  message: string;
  confidence: number;
  timestamp: number;
  metadata: Record<string, unknown>;
}

export interface ProctoringEngineStatus {
  state: 'idle' | 'loading' | 'ready' | 'running' | 'degraded' | 'stopped' | 'error';
  fps: number;
  faceReady: boolean;
  objectReady: boolean;
  lastError?: string;
}

interface ProctoringEngineOptions {
  video: HTMLVideoElement;
  onIncident: (incident: ProctoringIncident) => void;
  onStatusChange?: (status: ProctoringEngineStatus) => void;
  normalFps?: number;
  suspiciousFps?: number;
  gazeAwayMs?: number;
  incidentCooldownMs?: number;
}

interface EyeMetrics {
  xRatio: number;
  yRatio: number;
}

interface FrameSignal {
  suspicious: boolean;
  incidents: ProctoringIncident[];
}

const VISION_WASM_ROOT = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const FACE_LANDMARKER_MODEL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task';

const NORMAL_FPS = 2;
const SUSPICIOUS_FPS = 10;
const GAZE_AWAY_MS = 2000;
const INCIDENT_COOLDOWN_MS = 5000;
const OBJECT_SCAN_EVERY_MS = 1000;
const MAR_TALK_THRESHOLD = 0.4;
const MAR_DELTA_THRESHOLD = 0.08;

const LEFT_IRIS = [468, 469, 470, 471, 472];
const RIGHT_IRIS = [473, 474, 475, 476, 477];
const LEFT_EYE = { outer: 33, inner: 133, top: 159, bottom: 145 };
const RIGHT_EYE = { outer: 362, inner: 263, top: 386, bottom: 374 };
const MOUTH = {
  left: 61,
  right: 291,
  verticalPairs: [
    [13, 14],
    [82, 87],
    [312, 317],
    [0, 17],
  ],
};

const distance = (a: NormalizedLandmark, b: NormalizedLandmark) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
};

const averagePoint = (landmarks: NormalizedLandmark[], indices: number[]) => {
  const points = indices.map((idx) => landmarks[idx]).filter(Boolean);
  if (!points.length) return null;
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const computeEyeRatio = (
  landmarks: NormalizedLandmark[],
  irisIndices: number[],
  eye: typeof LEFT_EYE,
): EyeMetrics | null => {
  const iris = averagePoint(landmarks, irisIndices);
  const edges = [landmarks[eye.outer], landmarks[eye.inner], landmarks[eye.top], landmarks[eye.bottom]];
  if (!iris || edges.some((point) => !point)) return null;

  const xMin = Math.min(landmarks[eye.outer].x, landmarks[eye.inner].x);
  const xMax = Math.max(landmarks[eye.outer].x, landmarks[eye.inner].x);
  const yMin = Math.min(landmarks[eye.top].y, landmarks[eye.bottom].y);
  const yMax = Math.max(landmarks[eye.top].y, landmarks[eye.bottom].y);

  const xSpan = Math.max(0.0001, xMax - xMin);
  const ySpan = Math.max(0.0001, yMax - yMin);

  return {
    xRatio: clamp01((iris.x - xMin) / xSpan),
    yRatio: clamp01((iris.y - yMin) / ySpan),
  };
};

export const computeMouthAspectRatio = (landmarks: NormalizedLandmark[]) => {
  const left = landmarks[MOUTH.left];
  const right = landmarks[MOUTH.right];
  if (!left || !right) return 0;

  const width = Math.max(0.0001, distance(left, right));
  const verticalMean =
    MOUTH.verticalPairs.reduce((sum, [upper, lower]) => {
      const upperPoint = landmarks[upper];
      const lowerPoint = landmarks[lower];
      return upperPoint && lowerPoint ? sum + distance(upperPoint, lowerPoint) : sum;
    }, 0) / MOUTH.verticalPairs.length;

  return verticalMean / width;
};

const gazeFromEyes = (left: EyeMetrics | null, right: EyeMetrics | null) => {
  if (!left || !right) return { away: false, direction: 'unknown', score: 0 };

  const x = (left.xRatio + right.xRatio) / 2;
  const y = (left.yRatio + right.yRatio) / 2;
  const horizontalAway = x < 0.28 || x > 0.72;
  const verticalAway = y < 0.24 || y > 0.76;
  const score = Math.max(Math.abs(x - 0.5) / 0.5, Math.abs(y - 0.5) / 0.5);

  let direction = 'center';
  if (x < 0.28) direction = 'left';
  if (x > 0.72) direction = 'right';
  if (y < 0.24) direction = 'up';
  if (y > 0.76) direction = 'down';

  return {
    away: horizontalAway || verticalAway,
    direction,
    score: Number(score.toFixed(3)),
  };
};

export class ProctoringEngine {
  private options: Required<Pick<ProctoringEngineOptions, 'normalFps' | 'suspiciousFps' | 'gazeAwayMs' | 'incidentCooldownMs'>> &
    Omit<ProctoringEngineOptions, 'normalFps' | 'suspiciousFps' | 'gazeAwayMs' | 'incidentCooldownMs'>;

  private faceLandmarker: FaceLandmarker | null = null;
  private objectDetector: ObjectDetection | null = null;
  private running = false;
  private rafId = 0;
  private nextFrameAt = 0;
  private lastVideoTime = -1;
  private lastObjectScanAt = 0;
  private currentFps = NORMAL_FPS;
  private gazeAwayStartedAt = 0;
  private mouthSamples: Array<{ t: number; mar: number }> = [];
  private incidentCooldowns = new Map<ProctoringViolationType, number>();
  private status: ProctoringEngineStatus = {
    state: 'idle',
    fps: NORMAL_FPS,
    faceReady: false,
    objectReady: false,
  };

  constructor(options: ProctoringEngineOptions) {
    this.options = {
      ...options,
      normalFps: options.normalFps ?? NORMAL_FPS,
      suspiciousFps: options.suspiciousFps ?? SUSPICIOUS_FPS,
      gazeAwayMs: options.gazeAwayMs ?? GAZE_AWAY_MS,
      incidentCooldownMs: options.incidentCooldownMs ?? INCIDENT_COOLDOWN_MS,
    };
    this.currentFps = this.options.normalFps;
  }

  async initialize() {
    this.updateStatus({ state: 'loading' });

    const faceLoaded = await this.loadFaceLandmarker();
    const objectLoaded = await this.loadObjectDetector();

    this.updateStatus({
      state: faceLoaded || objectLoaded ? 'ready' : 'degraded',
      faceReady: faceLoaded,
      objectReady: objectLoaded,
    });
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.updateStatus({ state: this.faceLandmarker || this.objectDetector ? 'running' : 'degraded' });
    this.rafId = window.requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    if (this.rafId) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    this.faceLandmarker?.close();
    this.faceLandmarker = null;
    this.objectDetector = null;
    this.updateStatus({ state: 'stopped', faceReady: false, objectReady: false });
  }

  getStatus() {
    return this.status;
  }

  private async loadFaceLandmarker() {
    try {
      const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
      const vision = await FilesetResolver.forVisionTasks(VISION_WASM_ROOT);
      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: FACE_LANDMARKER_MODEL,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 2,
        outputFaceBlendshapes: true,
      });
      return true;
    } catch (error) {
      this.updateStatus({
        state: 'degraded',
        lastError: error instanceof Error ? error.message : 'Unable to load FaceLandmarker',
      });
      return false;
    }
  }

  private async loadObjectDetector() {
    try {
      await import('@tensorflow/tfjs');
      const cocoSsd = await import('@tensorflow-models/coco-ssd');
      this.objectDetector = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
      return true;
    } catch (error) {
      this.updateStatus({
        state: 'degraded',
        lastError: error instanceof Error ? error.message : 'Unable to load COCO-SSD',
      });
      return false;
    }
  }

  private loop = async (now: number) => {
    if (!this.running) return;

    if (now >= this.nextFrameAt && this.options.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      const signal = await this.analyzeFrame(now);
      this.currentFps = signal.suspicious ? this.options.suspiciousFps : this.options.normalFps;
      this.updateStatus({ fps: this.currentFps });
      this.nextFrameAt = now + 1000 / this.currentFps;

      for (const incident of signal.incidents) {
        this.emitIncident(incident);
      }
    }

    this.rafId = window.requestAnimationFrame(this.loop);
  };

  private async analyzeFrame(now: number): Promise<FrameSignal> {
    const incidents: ProctoringIncident[] = [];
    const video = this.options.video;
    let suspicious = false;

    if (this.faceLandmarker && video.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = video.currentTime;
      const result = this.faceLandmarker.detectForVideo(video, now);
      const faces = result.faceLandmarks ?? [];

      if (faces.length === 0) {
        suspicious = true;
        this.gazeAwayStartedAt = 0;
        incidents.push(this.createIncident('no_face', 'HIGH', 'Face not detected. Please stay centered in the camera.', 0.95, {}));
      } else if (faces.length > 1) {
        suspicious = true;
        incidents.push(
          this.createIncident('multiple_faces', 'CRITICAL', 'Multiple people detected in the camera frame.', 0.98, {
            faceCount: faces.length,
          }),
        );
      } else {
        const face = faces[0];
        const gaze = gazeFromEyes(
          computeEyeRatio(face, LEFT_IRIS, LEFT_EYE),
          computeEyeRatio(face, RIGHT_IRIS, RIGHT_EYE),
        );

        if (gaze.away) {
          suspicious = true;
          this.gazeAwayStartedAt = this.gazeAwayStartedAt || now;
          const awayMs = now - this.gazeAwayStartedAt;
          if (awayMs >= this.options.gazeAwayMs) {
            incidents.push(
              this.createIncident('gaze_away', 'MEDIUM', 'Please keep your eyes on the exam screen.', Math.min(0.99, 0.65 + gaze.score * 0.3), {
                direction: gaze.direction,
                score: gaze.score,
                awayMs: Math.round(awayMs),
              }),
            );
          }
        } else {
          this.gazeAwayStartedAt = 0;
        }

        const talking = this.detectTalking(face, now);
        if (talking.talking) {
          suspicious = true;
          incidents.push(
            this.createIncident('talking', 'MEDIUM', 'Possible talking detected. Please remain silent during the exam.', talking.confidence, {
              mar: talking.mar,
              oscillation: talking.oscillation,
            }),
          );
        }
      }
    }

    if (this.objectDetector && now - this.lastObjectScanAt >= OBJECT_SCAN_EVERY_MS) {
      this.lastObjectScanAt = now;
      const predictions = await this.objectDetector.detect(video);
      const personCount = predictions.filter((p) => p.class === 'person' && p.score >= 0.55).length;
      const phone = predictions.find((p) => p.class === 'cell phone' && p.score >= 0.55);

      if (personCount > 1) {
        suspicious = true;
        incidents.push(
          this.createIncident('multiple_faces', 'CRITICAL', 'Multiple people detected near the exam area.', 0.95, {
            personCount,
          }),
        );
      }

      if (phone) {
        suspicious = true;
        incidents.push(
          this.createIncident('phone_detected', phone.score >= 0.75 ? 'CRITICAL' : 'HIGH', 'Phone detected in the camera frame.', phone.score, {
            bbox: phone.bbox,
            score: phone.score,
          }),
        );
      }
    }

    return { suspicious, incidents };
  }

  private detectTalking(landmarks: NormalizedLandmark[], now: number) {
    const mar = computeMouthAspectRatio(landmarks);
    this.mouthSamples = [...this.mouthSamples.filter((sample) => now - sample.t <= 1500), { t: now, mar }];

    const values = this.mouthSamples.map((sample) => sample.mar);
    const oscillation = values.length > 2 ? Math.max(...values) - Math.min(...values) : 0;
    const sustainedOpen = values.filter((value) => value >= MAR_TALK_THRESHOLD).length >= Math.min(3, values.length);
    const talking = sustainedOpen && oscillation >= MAR_DELTA_THRESHOLD;

    return {
      talking,
      mar: Number(mar.toFixed(3)),
      oscillation: Number(oscillation.toFixed(3)),
      confidence: Math.min(0.95, 0.55 + oscillation + Math.max(0, mar - MAR_TALK_THRESHOLD)),
    };
  }

  private createIncident(
    type: ProctoringViolationType,
    severity: Severity,
    message: string,
    confidence: number,
    metadata: Record<string, unknown>,
  ): ProctoringIncident {
    return {
      type,
      severity,
      message,
      confidence: Number(confidence.toFixed(3)),
      timestamp: Date.now(),
      metadata,
    };
  }

  private emitIncident(incident: ProctoringIncident) {
    const lastEmittedAt = this.incidentCooldowns.get(incident.type) ?? 0;
    if (Date.now() - lastEmittedAt < this.options.incidentCooldownMs) return;
    this.incidentCooldowns.set(incident.type, Date.now());
    this.options.onIncident(incident);
  }

  private updateStatus(next: Partial<ProctoringEngineStatus>) {
    this.status = {
      ...this.status,
      ...next,
    };
    this.options.onStatusChange?.(this.status);
  }
}
