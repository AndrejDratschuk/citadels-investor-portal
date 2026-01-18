/**
 * Email Queue Configuration
 * BullMQ queue for scheduling delayed prospect emails
 */

import { Queue, QueueEvents } from 'bullmq';
import { getRedisConnectionOptions } from '../redis/connection';

// Queue name constant
export const EMAIL_QUEUE_NAME = 'prospect-emails';

// Prospect email job types (Stage 01)
export type ProspectEmailJobType =
  | 'kyc_reminder_1'
  | 'kyc_reminder_2'
  | 'kyc_reminder_3'
  | 'kyc_not_eligible'
  | 'meeting_reminder_24hr'
  | 'meeting_reminder_15min'
  | 'meeting_noshow'
  | 'post_meeting_proceed'
  | 'post_meeting_considering'
  | 'post_meeting_not_fit'
  | 'nurture_day15'
  | 'nurture_day23'
  | 'nurture_day30'
  | 'dormant_closeout';

// Investor email job types (Stage 02)
export type InvestorEmailJobType =
  | 'onboarding_reminder_1'
  | 'onboarding_reminder_2'
  | 'onboarding_reminder_3'
  | 'signature_reminder_1'
  | 'signature_reminder_2';

// Combined email job type
export type EmailJobType = ProspectEmailJobType | InvestorEmailJobType;

// Job data structure for prospects
export interface ProspectEmailJobData {
  type: ProspectEmailJobType;
  prospectId: string;
  fundId: string;
  scheduledAt: string; // ISO timestamp when job was scheduled
  metadata?: Record<string, unknown>;
}

// Job data structure for investors
export interface InvestorEmailJobData {
  type: InvestorEmailJobType;
  investorId: string;
  fundId: string;
  scheduledAt: string; // ISO timestamp when job was scheduled
  metadata?: Record<string, unknown>;
}

// Union type for all email job data
export type EmailJobData = ProspectEmailJobData | InvestorEmailJobData;

// Singleton queue instance
let emailQueue: Queue<ProspectEmailJobData, unknown, string> | null = null;

export function getEmailQueue(): Queue<ProspectEmailJobData, unknown, string> {
  if (!emailQueue) {
    emailQueue = new Queue<ProspectEmailJobData, unknown, string>(EMAIL_QUEUE_NAME, {
      connection: getRedisConnectionOptions(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000, // 1 minute initial delay
        },
        removeOnComplete: {
          age: 7 * 24 * 60 * 60, // Keep completed jobs for 7 days
          count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: {
          age: 30 * 24 * 60 * 60, // Keep failed jobs for 30 days
        },
      },
    });
  }
  return emailQueue;
}

// Queue events for monitoring (optional)
let queueEvents: QueueEvents | null = null;

export function getQueueEvents(): QueueEvents {
  if (!queueEvents) {
    queueEvents = new QueueEvents(EMAIL_QUEUE_NAME, {
      connection: getRedisConnectionOptions(),
    });
  }
  return queueEvents;
}

/**
 * Generate a unique job ID for deduplication and cancellation
 * Format: {type}:{prospectId}
 */
export function generateJobId(type: ProspectEmailJobType, prospectId: string): string {
  return `${type}:${prospectId}`;
}

/**
 * Schedule a prospect email job with delay
 */
export async function scheduleProspectEmail(
  data: ProspectEmailJobData,
  delayMs: number
): Promise<string> {
  const queue = getEmailQueue();
  const jobId = generateJobId(data.type, data.prospectId);

  const job = await queue.add(data.type, data, {
    jobId,
    delay: delayMs,
  });

  console.log(
    `[EmailQueue] Scheduled ${data.type} for prospect ${data.prospectId} ` +
      `in ${Math.round(delayMs / 1000 / 60)} minutes, jobId: ${job.id}`
  );

  return job.id ?? jobId;
}

/**
 * Cancel a scheduled email job
 */
export async function cancelProspectEmail(
  type: ProspectEmailJobType,
  prospectId: string
): Promise<boolean> {
  const queue = getEmailQueue();
  const jobId = generateJobId(type, prospectId);

  const job = await queue.getJob(jobId);
  if (job) {
    await job.remove();
    console.log(`[EmailQueue] Cancelled ${type} for prospect ${prospectId}`);
    return true;
  }

  return false;
}

/**
 * Cancel multiple email jobs by type pattern
 */
export async function cancelProspectEmailsByPattern(
  types: ProspectEmailJobType[],
  prospectId: string
): Promise<number> {
  let cancelled = 0;
  for (const type of types) {
    const success = await cancelProspectEmail(type, prospectId);
    if (success) cancelled++;
  }
  return cancelled;
}

// ============================================================
// Investor Email Functions (Stage 02)
// ============================================================

/**
 * Generate a unique job ID for investor emails
 * Format: {type}:investor:{investorId}
 */
export function generateInvestorJobId(type: InvestorEmailJobType, investorId: string): string {
  return `${type}:investor:${investorId}`;
}

/**
 * Schedule an investor email job with delay
 */
export async function scheduleInvestorEmail(
  data: InvestorEmailJobData,
  delayMs: number
): Promise<string> {
  const queue = getEmailQueue();
  const jobId = generateInvestorJobId(data.type, data.investorId);

  const job = await queue.add(data.type, data as unknown as ProspectEmailJobData, {
    jobId,
    delay: delayMs,
  });

  console.log(
    `[EmailQueue] Scheduled ${data.type} for investor ${data.investorId} ` +
      `in ${Math.round(delayMs / 1000 / 60)} minutes, jobId: ${job.id}`
  );

  return job.id ?? jobId;
}

/**
 * Cancel a scheduled investor email job
 */
export async function cancelInvestorEmail(
  type: InvestorEmailJobType,
  investorId: string
): Promise<boolean> {
  const queue = getEmailQueue();
  const jobId = generateInvestorJobId(type, investorId);

  const job = await queue.getJob(jobId);
  if (job) {
    await job.remove();
    console.log(`[EmailQueue] Cancelled ${type} for investor ${investorId}`);
    return true;
  }

  return false;
}

/**
 * Cancel multiple investor email jobs by type pattern
 */
export async function cancelInvestorEmailsByPattern(
  types: InvestorEmailJobType[],
  investorId: string
): Promise<number> {
  let cancelled = 0;
  for (const type of types) {
    const success = await cancelInvestorEmail(type, investorId);
    if (success) cancelled++;
  }
  return cancelled;
}

/**
 * Check if Redis is available for queue operations
 */
export function isRedisAvailable(): boolean {
  return !!process.env.REDIS_URL;
}

/**
 * Graceful shutdown
 */
export async function closeEmailQueue(): Promise<void> {
  if (emailQueue) {
    await emailQueue.close();
    emailQueue = null;
  }
  if (queueEvents) {
    await queueEvents.close();
    queueEvents = null;
  }
}

