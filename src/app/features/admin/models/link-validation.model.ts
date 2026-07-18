export type LinkValidationSource = 'MANUAL' | 'SCHEDULED';

export type LinkValidationRunStatus =
  | 'RUNNING'
  | 'COMPLETED'
  | 'COMPLETED_WITH_ERRORS'
  | 'FAILED';

export type LinkVerificationStatus =
  | 'WORKING'
  | 'BROKEN'
  | 'UNCERTAIN'
  | 'BLOCKED'
  | 'TECHNICAL_ERROR';

export type WorkerReachability = 'REACHABLE' | 'UNREACHABLE';

export interface LinkValidationRun {
  id: number;
  source: LinkValidationSource;
  status: LinkValidationRunStatus;
  startedAt: string;
  finishedAt: string | null;
  selectedCount: number;
  checkedCount: number;
  workingCount: number;
  brokenCount: number;
  uncertainCount: number;
  blockedCount: number;
  technicalErrorCount: number;
  lastError: string | null;
  triggeredBy: string | null;
}

export interface LinkValidationRunItem {
  id: number;
  linkId: number | null;
  productId: number | null;
  productNameSnapshot: string | null;
  originalUrl: string | null;
  normalizedUrl: string | null;
  finalUrl: string | null;
  verificationStatus: LinkVerificationStatus;
  reason: string | null;
  httpStatus: number | null;
  durationMs: number;
  checkedAt: string;
  technicalError: boolean;
  previousIsBroken: boolean | null;
  newIsBroken: boolean | null;
  previousNeedsReview: boolean | null;
  newNeedsReview: boolean | null;
}

export interface LinkValidationRunDetails {
  run: LinkValidationRun;
  items: LinkValidationRunItem[];
}

export interface LinkValidationStatus {
  workerStatus: WorkerReachability;
  workerHealthDurationMs: number;
  lastRun: LinkValidationRun | null;
  lastManualRun: LinkValidationRun | null;
  lastScheduledRun: LinkValidationRun | null;
  runningCount: number;
  latestError: string | null;
  lastCompletedRun: LinkValidationRun | null;
}
