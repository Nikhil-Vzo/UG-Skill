import { Resend } from 'resend';
import { env } from './env';

// Initialize Resend client if API key is provided
export const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
