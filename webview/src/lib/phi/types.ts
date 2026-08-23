export type CampaignStatus = "EXCELLENT" | "GOOD" | "WARNING" | "CRITICAL" | "LEARNING";

export type Platform = "Google Ads" | "Meta Ads";

export type Priority = "P0" | "P1" | "P2";

export type TaskStatus = "Aberta" | "Em Execução" | "Concluída" | "Cancelada";

export type OptimizationResult = "Sucesso" | "Neutro" | "Insucesso";

export interface Campaign {
  id: string;
  name: string;
  client: string;
  platform: Platform;
  status: CampaignStatus;
  score: number; // 0-100
  investment: number;
  cpaTarget: number;
  cpaActual: number;
  conversions: number;
  ctr: number; // 0-1
  roas: number;
  lastUpdate: string; // ISO
  scoreHistory: ScorePoint[];
  deltas: {
    investment: number;
    cpaActual: number;
    conversions: number;
    ctr: number;
    roas: number;
  };
}

export interface ScorePoint {
  date: string; // ISO date
  score: number;
}

export interface Task {
  id: string;
  campaignId: string;
  title: string;
  priority: Priority;
  status: TaskStatus;
  affectedMetric: string;
  hypothesis: string;
  createdAt: string; // ISO
}

export interface OptimizationLog {
  id: string;
  campaignId: string;
  title: string;
  date: string; // ISO
  result: OptimizationResult;
  scoreImpact: number; // delta points
}

export interface AlertTimelinePoint {
  date: string; // ISO date (yyyy-mm-dd)
  EXCELLENT: number;
  GOOD: number;
  WARNING: number;
  CRITICAL: number;
  LEARNING: number;
}

export interface PhiSnapshot {
  campaigns: Campaign[];
  tasks: Task[];
  logs: OptimizationLog[];
  alertTimeline: AlertTimelinePoint[];
  generatedAt: string; // ISO
}

export const STATUS_ORDER: CampaignStatus[] = [
  "EXCELLENT",
  "GOOD",
  "LEARNING",
  "WARNING",
  "CRITICAL",
];

export const STATUS_LABEL: Record<CampaignStatus, string> = {
  EXCELLENT: "Excellent",
  GOOD: "Good",
  WARNING: "Warning",
  CRITICAL: "Critical",
  LEARNING: "Learning",
};

/** Tailwind class for the status color via design tokens. */
export const STATUS_TEXT_CLASS: Record<CampaignStatus, string> = {
  EXCELLENT: "text-status-excellent",
  GOOD: "text-status-good",
  WARNING: "text-status-warning",
  CRITICAL: "text-status-critical",
  LEARNING: "text-status-learning",
};

export const STATUS_BG_CLASS: Record<CampaignStatus, string> = {
  EXCELLENT: "bg-status-excellent",
  GOOD: "bg-status-good",
  WARNING: "bg-status-warning",
  CRITICAL: "bg-status-critical",
  LEARNING: "bg-status-learning",
};

/** CSS var reference — used by Recharts where we must pass a string color. */
export const STATUS_VAR: Record<CampaignStatus, string> = {
  EXCELLENT: "hsl(var(--status-excellent))",
  GOOD: "hsl(var(--status-good))",
  WARNING: "hsl(var(--status-warning))",
  CRITICAL: "hsl(var(--status-critical))",
  LEARNING: "hsl(var(--status-learning))",
};
