/**
 * Email Worker
 * BullMQ worker that processes scheduled prospect email jobs
 */

import { Worker, Job } from 'bullmq';
import { EMAIL_QUEUE_NAME, ProspectEmailJobData, ProspectEmailJobType, InvestorEmailJobData, InvestorEmailJobType, EmailJobType } from './emailQueue';
import { getRedisConnectionOptions } from '../redis/connection';

// Import will be done lazily to avoid circular dependencies
let prospectEmailTriggers: typeof import('../../modules/prospects/prospectEmailTriggers').prospectEmailTriggers | null = null;
let investorEmailTriggers: typeof import('../../modules/investors/investorEmailTriggers').investorEmailTriggers | null = null;

async function getProspectEmailTriggers() {
  if (!prospectEmailTriggers) {
    const module = await import('../../modules/prospects/prospectEmailTriggers');
    prospectEmailTriggers = module.prospectEmailTriggers;
  }
  return prospectEmailTriggers;
}

async function getInvestorEmailTriggers() {
  if (!investorEmailTriggers) {
    const module = await import('../../modules/investors/investorEmailTriggers');
    investorEmailTriggers = module.investorEmailTriggers;
  }
  return investorEmailTriggers;
}

// Worker instance
let emailWorker: Worker<ProspectEmailJobData | InvestorEmailJobData> | null = null;

/**
 * Structured log entry for email job processing
 */
interface EmailJobLogEntry {
  timestamp: string;
  jobId: string | undefined;
  jobType: EmailJobType;
  prospectId?: string;
  investorId?: string;
  fundId: string;
  status: 'started' | 'completed' | 'failed' | 'skipped';
  durationMs?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, unknown>;
}

// Helper to check if job is an investor job
function isInvestorJob(type: string): type is InvestorEmailJobType {
  return type.startsWith('onboarding_reminder_') || type.startsWith('signature_reminder_');
}

/**
 * Log email job event with structured data
 */
function logJobEvent(entry: EmailJobLogEntry): void {
  const logData = {
    ...entry,
    component: 'EmailWorker',
  };

  if (entry.status === 'failed') {
    console.error(JSON.stringify(logData));
  } else {
    console.log(JSON.stringify(logData));
  }
}

/**
 * Process a prospect email job
 */
async function processProspectEmailJob(
  job: Job<ProspectEmailJobData>,
  startTime: number
): Promise<void> {
  const { type, prospectId, fundId, metadata } = job.data;
  const triggers = await getProspectEmailTriggers();

  // Dispatch to the appropriate handler
  switch (type) {
    case 'kyc_reminder_1':
      await triggers.sendScheduledKYCReminder(prospectId, fundId, 1);
      break;
    case 'kyc_reminder_2':
      await triggers.sendScheduledKYCReminder(prospectId, fundId, 2);
      break;
    case 'kyc_reminder_3':
      await triggers.sendScheduledKYCReminder(prospectId, fundId, 3);
      break;
    case 'kyc_not_eligible':
      await triggers.sendKYCNotEligible(prospectId, fundId);
      break;
    case 'meeting_reminder_24hr':
      await triggers.sendMeetingReminder24hr(prospectId, fundId);
      break;
    case 'meeting_reminder_15min':
      await triggers.sendMeetingReminder15min(prospectId, fundId);
      break;
    case 'meeting_noshow':
      await triggers.sendMeetingNoShow(prospectId, fundId);
      break;
    case 'post_meeting_proceed':
      await triggers.sendPostMeetingProceed(prospectId, fundId, metadata as { meetingRecap?: string });
      break;
    case 'post_meeting_considering':
      await triggers.sendPostMeetingConsidering(prospectId, fundId, metadata as { meetingRecapBullets?: string });
      break;
    case 'post_meeting_not_fit':
      await triggers.sendPostMeetingNotFit(prospectId, fundId);
      break;
    case 'nurture_day15':
      await triggers.sendNurtureDay15(prospectId, fundId);
      break;
    case 'nurture_day23':
      await triggers.sendNurtureDay23(prospectId, fundId);
      break;
    case 'nurture_day30':
      await triggers.sendNurtureDay30(prospectId, fundId);
      break;
    case 'dormant_closeout':
      await triggers.sendDormantCloseout(prospectId, fundId);
      break;
    default:
      logJobEvent({
        timestamp: new Date().toISOString(),
        jobId: job.id,
        jobType: type,
        prospectId,
        fundId,
        status: 'skipped',
        durationMs: Date.now() - startTime,
        metadata: { reason: 'Unknown prospect job type' },
      });
      return;
  }
}

/**
 * Process an investor email job
 */
async function processInvestorEmailJob(
  job: Job<InvestorEmailJobData>,
  startTime: number
): Promise<void> {
  const { type, investorId, fundId } = job.data;
  const triggers = await getInvestorEmailTriggers();

  // Dispatch to the appropriate handler
  switch (type) {
    case 'onboarding_reminder_1':
      await triggers.sendScheduledOnboardingReminder(investorId, fundId, 1);
      break;
    case 'onboarding_reminder_2':
      await triggers.sendScheduledOnboardingReminder(investorId, fundId, 2);
      break;
    case 'onboarding_reminder_3':
      await triggers.sendScheduledOnboardingReminder(investorId, fundId, 3);
      break;
    case 'signature_reminder_1':
      await triggers.sendScheduledSignatureReminder(investorId, fundId, 1);
      break;
    case 'signature_reminder_2':
      await triggers.sendScheduledSignatureReminder(investorId, fundId, 2);
      break;
    default:
      logJobEvent({
        timestamp: new Date().toISOString(),
        jobId: job.id,
        jobType: type,
        investorId,
        fundId,
        status: 'skipped',
        durationMs: Date.now() - startTime,
        metadata: { reason: 'Unknown investor job type' },
      });
      return;
  }
}

/**
 * Process an email job (prospect or investor)
 */
async function processEmailJob(job: Job<ProspectEmailJobData | InvestorEmailJobData>): Promise<void> {
  const { type, fundId } = job.data;
  const startTime = Date.now();
  const isInvestor = isInvestorJob(type);

  // Get the entity ID based on job type
  const entityId = isInvestor 
    ? (job.data as InvestorEmailJobData).investorId 
    : (job.data as ProspectEmailJobData).prospectId;

  logJobEvent({
    timestamp: new Date().toISOString(),
    jobId: job.id,
    jobType: type as EmailJobType,
    ...(isInvestor ? { investorId: entityId } : { prospectId: entityId }),
    fundId,
    status: 'started',
  });

  try {
    if (isInvestor) {
      await processInvestorEmailJob(job as Job<InvestorEmailJobData>, startTime);
    } else {
      await processProspectEmailJob(job as Job<ProspectEmailJobData>, startTime);
    }

    logJobEvent({
      timestamp: new Date().toISOString(),
      jobId: job.id,
      jobType: type as EmailJobType,
      ...(isInvestor ? { investorId: entityId } : { prospectId: entityId }),
      fundId,
      status: 'completed',
      durationMs: Date.now() - startTime,
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));

    logJobEvent({
      timestamp: new Date().toISOString(),
      jobId: job.id,
      jobType: type as EmailJobType,
      ...(isInvestor ? { investorId: entityId } : { prospectId: entityId }),
      fundId,
      status: 'failed',
      durationMs: Date.now() - startTime,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    });

    // Re-throw to let BullMQ handle retry logic
    throw error;
  }
}

/**
 * Start the email worker
 */
export function startEmailWorker(): Worker<ProspectEmailJobData | InvestorEmailJobData> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn('[EmailWorker] REDIS_URL not set - worker not started');
    throw new Error('REDIS_URL environment variable is not set');
  }

  if (emailWorker) {
    return emailWorker;
  }

  emailWorker = new Worker<ProspectEmailJobData | InvestorEmailJobData>(
    EMAIL_QUEUE_NAME,
    processEmailJob,
    {
      connection: getRedisConnectionOptions(),
      concurrency: 5, // Process up to 5 jobs in parallel
    }
  );

  // Event handlers - structured logging for worker-level events
  emailWorker.on('completed', (job) => {
    // Job-level logging is handled in processEmailJob
    // This is only for worker lifecycle events
  });

  emailWorker.on('failed', (job, err) => {
    // Only log if this is a final failure (after all retries)
    // The actual error is already logged in processEmailJob
    if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
      const isInvestor = isInvestorJob(job.data.type);
      const entityId = isInvestor
        ? (job.data as InvestorEmailJobData).investorId
        : (job.data as ProspectEmailJobData).prospectId;

      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        component: 'EmailWorker',
        event: 'job_exhausted_retries',
        jobId: job.id,
        jobType: job.data.type,
        ...(isInvestor ? { investorId: entityId } : { prospectId: entityId }),
        fundId: job.data.fundId,
        attempts: job.attemptsMade,
        error: err.message,
      }));
    }
  });

  emailWorker.on('error', (err) => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      component: 'EmailWorker',
      event: 'worker_error',
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
      },
    }));
  });

  console.log('[EmailWorker] Started');

  return emailWorker;
}

/**
 * Stop the email worker gracefully
 */
export async function stopEmailWorker(): Promise<void> {
  if (emailWorker) {
    await emailWorker.close();
    emailWorker = null;
    console.log('[EmailWorker] Stopped');
  }
}

/**
 * Check if worker is running
 */
export function isWorkerRunning(): boolean {
  return emailWorker !== null && !emailWorker.closing;
}

