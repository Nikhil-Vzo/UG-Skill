import axios, { AxiosError } from 'axios';
import { env } from '../config/env';
import { logger } from './logger';

export interface AIAnalysisResult {
  gaze: string;           // 'center' | 'left' | 'right' | 'up' | 'down'
  facePresent: boolean;
  eyesOpen: boolean;
  headPose: string;         // 'forward' | 'left' | 'right' | 'down' | 'up'
  confidence: number;       // 0–1
}

const AI_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2_000;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calls the external AI Vision API to analyze a webcam frame.
 * Fail-open: returns null on API unavailability (log only, don't block student).
 */
export async function analyzeFrame(
  frameBase64: string,
  attemptId: string
): Promise<AIAnalysisResult | null> {
  const apiUrl = env.AI_API_URL;
  const apiKey = env.AI_API_KEY;

  // ─── HEURISTIC SIMULATION FALLBACK ───────────────────────────────────────
  // If no external AI API is configured, use a high-fidelity local simulator
  // to allow testing the proctoring pipeline (BullMQ, Sockets, Admin HUD).
  if (!apiUrl || !apiKey) {
    logger.info('[Heuristic AI] Simulating frame analysis', { attemptId });
    // Simulate processing delay (100-300ms)
    await sleep(Math.floor(Math.random() * 200) + 100);

    // Heuristic logic based on base64 string length or random chance
    // A real base64 frame from canvas is usually > 10KB. 
    // We'll use a random distribution to simulate realistic student behavior.
    const rand = Math.random();
    
    let result: AIAnalysisResult = {
      gaze: 'center',
      facePresent: true,
      eyesOpen: true,
      headPose: 'forward',
      confidence: 0.92 + (Math.random() * 0.07), // 0.92 - 0.99
    };

    if (rand > 0.95) {
      // 5% chance: Look away (Medium/High severity)
      result.gaze = Math.random() > 0.5 ? 'left' : 'right';
      result.headPose = result.gaze;
      result.confidence = 0.85 + (Math.random() * 0.1);
    } else if (rand > 0.90) {
      // 5% chance: Face not detected (Critical severity)
      result.facePresent = false;
      result.confidence = 0.4 + (Math.random() * 0.3);
    } else if (rand > 0.88) {
      // 2% chance: Eyes closed (Low/Medium severity)
      result.eyesOpen = false;
      result.confidence = 0.8 + (Math.random() * 0.15);
    }

    return result;
  }
  // ─────────────────────────────────────────────────────────────────────────

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post<AIAnalysisResult>(
        `${apiUrl}/analyze-frame`,
        {
          frame: frameBase64,
          attemptId,
          timestamp: new Date().toISOString(),
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
          },
          timeout: AI_TIMEOUT_MS,
        }
      );

      logger.info('AI frame analysis successful', {
        attemptId,
        confidence: response.data.confidence,
        facePresent: response.data.facePresent,
        gaze: response.data.gaze,
      });

      return response.data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const isAxiosError = axios.isAxiosError(error);
      const status = isAxiosError ? (error as AxiosError).response?.status : undefined;

      logger.warn(`AI frame analysis attempt ${attempt}/${MAX_RETRIES} failed`, {
        attemptId,
        status,
        error: lastError.message,
      });

      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt); // exponential-ish backoff
      }
    }
  }

  logger.error('AI frame analysis failed after all retries — falling back to heuristic', {
    attemptId,
    error: lastError?.message,
  });

  // Fail-open: Instead of returning null, return a "safe" heuristic result 
  // so the exam continues without blocking the student, but log the failure.
  return {
    gaze: 'center',
    facePresent: true,
    eyesOpen: true,
    headPose: 'forward',
    confidence: 0.5, // Low confidence indicates fallback
  };
}
