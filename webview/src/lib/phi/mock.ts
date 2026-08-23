import type {
  AlertTimelinePoint,
  Campaign,
  CampaignStatus,
  OptimizationLog,
  OptimizationResult,
  PhiSnapshot,
  Platform,
  Priority,
  ScorePoint,
  Task,
  TaskStatus,
} from "./types";

/* -------------------------------------------------------------------------- */
/*  Deterministic PRNG (mulberry32)                                           */
/* -------------------------------------------------------------------------- */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20251022);

const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const randFloat = (min: number, max: number) => rand() * (max - min) + min;

/* -------------------------------------------------------------------------- */
/*  Reference data                                                            */
/* -------------------------------------------------------------------------- */

const CLIENTS = [
  "Aurora Cosméticos",
  "Helix Fitness",
  "Nimbus SaaS",
  "Verdant Foods",
  "Orbit Travel",
  "Forge Tools",
];

const PRODUCT_TAGS = [
  "Black Friday",
  "Lançamento",
  "Remarketing",
  "Awareness",
  "Conversão",
  "Pesquisa Marca",
  "Lookalike 1%",
  "Performance Max",
  "Catálogo Dinâmico",
  "Vídeo View",
];

const TASK_TEMPLATES: { title: string; metric: string; hypothesis: string }[] = [
  {
    title: "Reescrever copy do anúncio principal",
    metric: "CTR",
    hypothesis:
      "O CTR caiu 22% em 7 dias enquanto o CPM se manteve estável. Indica fadiga criativa — refresh de copy deve recuperar engajamento.",
  },
  {
    title: "Pausar palavras-chave com CPA > 2x alvo",
    metric: "CPA",
    hypothesis:
      "5 termos respondem por 38% do gasto e zero conversões nos últimos 14 dias. Pausa libera budget para termos performantes.",
  },
  {
    title: "Reduzir lance em 15% em horário noturno",
    metric: "ROAS",
    hypothesis:
      "Heatmap mostra ROAS abaixo de 1.5 entre 23h–6h. Ajuste de bid schedule deve melhorar eficiência sem perder volume.",
  },
  {
    title: "Subir budget diário em +20%",
    metric: "Conversões",
    hypothesis:
      "Campanha está limitada por orçamento (lost IS budget = 41%). Score saudável permite escalar com risco controlado.",
  },
  {
    title: "Trocar criativo de vídeo (hook nos 3s)",
    metric: "Hook Rate",
    hypothesis:
      "Hook rate caiu para 18%, abaixo do benchmark de 30%. Novo abertura focada em problema deve recuperar atenção.",
  },
  {
    title: "Revisar segmentação de público lookalike",
    metric: "CPM",
    hypothesis:
      "CPM subiu 35% — público pode estar saturado. Testar LAL 2-3% para expandir alcance e diluir frequência.",
  },
  {
    title: "Adicionar exclusões de placement",
    metric: "Quality Score",
    hypothesis:
      "Audience Network respondendo por 28% do gasto com CTR de 0.4%. Exclusão deve concentrar verba em feed.",
  },
  {
    title: "Testar nova landing page (variante B)",
    metric: "Conversion Rate",
    hypothesis:
      "Taxa de conversão pós-clique abaixo de 1.2%. LP atual tem 3 dobras — versão enxuta deve melhorar conversão.",
  },
];

const OPTIMIZATION_TEMPLATES = [
  "Pausa de palavras-chave com CPA elevado",
  "Refresh de criativos (3 novos vídeos)",
  "Ajuste de lance manual em campanha de pesquisa",
  "Ativação de Performance Max com sinais",
  "Expansão de público lookalike 1% → 3%",
  "Revisão de copy do CTA principal",
  "Inclusão de extensões de site link",
  "Correção de tracking via GTM",
  "Aumento de budget em +20%",
  "Migração de campanha para CBO",
];

/* -------------------------------------------------------------------------- */
/*  Status-aware metric generator                                             */
/* -------------------------------------------------------------------------- */

const STATUS_DISTRIBUTION: CampaignStatus[] = [
  // 24 campanhas — distribuídas para mostrar bem o donut
  "EXCELLENT", "EXCELLENT", "EXCELLENT", "EXCELLENT", "EXCELLENT",
  "GOOD", "GOOD", "GOOD", "GOOD", "GOOD", "GOOD", "GOOD",
  "WARNING", "WARNING", "WARNING", "WARNING",
  "CRITICAL", "CRITICAL", "CRITICAL",
  "LEARNING", "LEARNING", "LEARNING", "LEARNING", "LEARNING",
];

function scoreForStatus(status: CampaignStatus): number {
  switch (status) {
    case "EXCELLENT":
      return randInt(82, 96);
    case "GOOD":
      return randInt(65, 80);
    case "WARNING":
      return randInt(45, 59);
    case "CRITICAL":
      return randInt(18, 39);
    case "LEARNING":
      return randInt(50, 72);
  }
}

function metricsForStatus(status: CampaignStatus, cpaTarget: number) {
  // ratio cpaActual / cpaTarget driven by status
  const ratio =
    status === "EXCELLENT" ? randFloat(0.6, 0.85)
    : status === "GOOD" ? randFloat(0.85, 1.05)
    : status === "WARNING" ? randFloat(1.1, 1.4)
    : status === "CRITICAL" ? randFloat(1.5, 2.4)
    : randFloat(0.9, 1.3); // LEARNING

  const cpaActual = +(cpaTarget * ratio).toFixed(2);
  const investment = randInt(2_500, 45_000);
  const conversions = Math.max(1, Math.round(investment / cpaActual));

  const ctr =
    status === "EXCELLENT" ? randFloat(0.035, 0.062)
    : status === "GOOD" ? randFloat(0.022, 0.038)
    : status === "WARNING" ? randFloat(0.012, 0.022)
    : status === "CRITICAL" ? randFloat(0.004, 0.012)
    : randFloat(0.018, 0.034);

  const roas =
    status === "EXCELLENT" ? randFloat(4.2, 7.8)
    : status === "GOOD" ? randFloat(2.4, 4.0)
    : status === "WARNING" ? randFloat(1.2, 2.2)
    : status === "CRITICAL" ? randFloat(0.4, 1.1)
    : randFloat(1.6, 3.0);

  return {
    investment,
    cpaActual,
    conversions,
    ctr: +ctr.toFixed(4),
    roas: +roas.toFixed(2),
  };
}

/* -------------------------------------------------------------------------- */
/*  Score history (30 days, smoothed walk biased toward final score)          */
/* -------------------------------------------------------------------------- */

function buildScoreHistory(finalScore: number, days = 30): ScorePoint[] {
  const points: ScorePoint[] = [];
  // Start somewhere plausible
  let score = clamp(finalScore + randInt(-15, 15), 10, 95);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    if (i === 0) {
      score = finalScore;
    } else {
      // Pull toward final score with noise
      const pull = (finalScore - score) * 0.08;
      const noise = randFloat(-4, 4);
      score = clamp(score + pull + noise, 5, 99);
    }

    points.push({ date: toISODate(date), score: Math.round(score) });
  }
  return points;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/* -------------------------------------------------------------------------- */
/*  Builders                                                                  */
/* -------------------------------------------------------------------------- */

function buildCampaign(index: number, status: CampaignStatus): Campaign {
  const client = pick(CLIENTS);
  const platform: Platform = rand() > 0.45 ? "Meta Ads" : "Google Ads";
  const tag = pick(PRODUCT_TAGS);
  const score = scoreForStatus(status);
  const cpaTarget = randInt(35, 220);
  const m = metricsForStatus(status, cpaTarget);

  const hoursAgo = randInt(0, 6);
  const lastUpdate = new Date(Date.now() - hoursAgo * 3600_000).toISOString();

  return {
    id: `camp-${(index + 1).toString().padStart(3, "0")}`,
    name: `${client.split(" ")[0]} · ${tag} ${platform === "Meta Ads" ? "FB/IG" : "GAds"}`,
    client,
    platform,
    status,
    score,
    cpaTarget,
    ...m,
    lastUpdate,
    scoreHistory: buildScoreHistory(score),
    deltas: {
      investment: +randFloat(-18, 28).toFixed(1),
      cpaActual: +randFloat(-22, 35).toFixed(1),
      conversions: +randFloat(-25, 40).toFixed(1),
      ctr: +randFloat(-30, 25).toFixed(1),
      roas: +randFloat(-28, 32).toFixed(1),
    },
  };
}

function buildTasksForCampaign(campaign: Campaign): Task[] {
  // More tasks for worse status
  const count =
    campaign.status === "CRITICAL" ? randInt(3, 5)
    : campaign.status === "WARNING" ? randInt(2, 3)
    : campaign.status === "LEARNING" ? randInt(1, 2)
    : campaign.status === "GOOD" ? randInt(0, 1)
    : randInt(0, 1);

  const out: Task[] = [];
  for (let i = 0; i < count; i++) {
    const tpl = pick(TASK_TEMPLATES);
    const priority: Priority =
      campaign.status === "CRITICAL" ? (rand() > 0.4 ? "P0" : "P1")
      : campaign.status === "WARNING" ? (rand() > 0.5 ? "P1" : "P2")
      : pick<Priority>(["P1", "P2", "P2"]);
    const status: TaskStatus = rand() > 0.75 ? "Em Execução" : "Aberta";
    const daysAgo = randInt(0, 10);
    out.push({
      id: `task-${campaign.id}-${i}`,
      campaignId: campaign.id,
      title: tpl.title,
      priority,
      status,
      affectedMetric: tpl.metric,
      hypothesis: tpl.hypothesis,
      createdAt: new Date(Date.now() - daysAgo * 86400_000).toISOString(),
    });
  }
  return out;
}

function buildLogsForCampaign(campaign: Campaign): OptimizationLog[] {
  const count = randInt(2, 6);
  const out: OptimizationLog[] = [];
  for (let i = 0; i < count; i++) {
    const daysAgo = randInt(1, 28);
    const result: OptimizationResult =
      rand() > 0.7 ? "Sucesso" : rand() > 0.4 ? "Neutro" : "Insucesso";
    const impact =
      result === "Sucesso" ? randInt(2, 12)
      : result === "Insucesso" ? -randInt(2, 9)
      : randInt(-2, 2);
    out.push({
      id: `log-${campaign.id}-${i}`,
      campaignId: campaign.id,
      title: pick(OPTIMIZATION_TEMPLATES),
      date: new Date(Date.now() - daysAgo * 86400_000).toISOString(),
      result,
      scoreImpact: impact,
    });
  }
  return out.sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

function buildAlertTimeline(campaigns: Campaign[]): AlertTimelinePoint[] {
  // Aggregate per day from each campaign's score history (last 7 days)
  const days = 7;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const out: AlertTimelinePoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const iso = toISODate(date);

    const point: AlertTimelinePoint = {
      date: iso,
      EXCELLENT: 0,
      GOOD: 0,
      WARNING: 0,
      CRITICAL: 0,
      LEARNING: 0,
    };

    for (const c of campaigns) {
      const sp = c.scoreHistory.find((s) => s.date === iso);
      const s = sp?.score ?? c.score;
      // Status thresholds for the timeline (visual approximation)
      const status: CampaignStatus =
        c.status === "LEARNING" ? "LEARNING"
        : s >= 80 ? "EXCELLENT"
        : s >= 60 ? "GOOD"
        : s >= 40 ? "WARNING"
        : "CRITICAL";
      point[status] += 1;
    }

    out.push(point);
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                */
/* -------------------------------------------------------------------------- */

let cached: PhiSnapshot | null = null;

export function generateSnapshot(): PhiSnapshot {
  if (cached) {
    // refresh only the lastUpdate + alert timeline so the UI feels live
    return {
      ...cached,
      generatedAt: new Date().toISOString(),
    };
  }

  const campaigns: Campaign[] = STATUS_DISTRIBUTION.map((status, i) =>
    buildCampaign(i, status),
  );

  const tasks: Task[] = campaigns.flatMap(buildTasksForCampaign);
  const logs: OptimizationLog[] = campaigns.flatMap(buildLogsForCampaign);
  const alertTimeline = buildAlertTimeline(campaigns);

  cached = {
    campaigns,
    tasks,
    logs,
    alertTimeline,
    generatedAt: new Date().toISOString(),
  };
  return cached;
}
