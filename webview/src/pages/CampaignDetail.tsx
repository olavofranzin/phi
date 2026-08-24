import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, TrendingDown, TrendingUp, Info } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { usePhiData } from "@/hooks/usePhiData";
import { useScoreHistory } from "@/hooks/useScoreHistory";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/phi/StatusBadge";
import {
  STATUS_VAR,
  type Campaign,
  type CampaignStatus,
  type OptimizationResult,
  type Priority,
  type ScorePoint,
} from "@/lib/phi/types";
import { cn } from "@/lib/utils";

const ND = "N/D";
/** Formata um número; se for null/NaN, devolve "N/D" (guardrail honesto). */
function nd(v: number | null | undefined, fmt: (n: number) => string) {
  return v == null || Number.isNaN(v) ? ND : fmt(v);
}
function fmtBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}
function fmtDate(iso: string | null | undefined) {
  if (!iso) return ND;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ND
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
function fmtTime(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const PRIORITY_ORDER: Priority[] = ["P0", "P1", "P2"];

const PRIORITY_STYLE: Record<Priority, string> = {
  P0: "bg-status-critical/15 text-status-critical border-status-critical/40",
  P1: "bg-status-warning/15 text-status-warning border-status-warning/40",
  P2: "bg-status-learning/15 text-status-learning border-status-learning/40",
};

const RESULT_STYLE: Record<OptimizationResult, string> = {
  Sucesso: "bg-status-good/15 text-status-good border-status-good/40",
  Neutro: "bg-muted text-muted-foreground border-border",
  Insucesso: "bg-status-critical/15 text-status-critical border-status-critical/40",
};

export default function CampaignDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = usePhiData();

  const campaign = data?.campaigns.find((c) => c.id === id);
  const { data: history } = useScoreHistory(campaign?.id);
  const tasks = useMemo(
    () => (data && id ? data.tasks.filter((t) => t.campaignId === id) : []),
    [data, id],
  );
  const logs = useMemo(
    () => (data && id ? data.logs.filter((l) => l.campaignId === id) : []),
    [data, id],
  );

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center gap-4 p-12 text-center">
        <p className="text-lg">Campanha não encontrada.</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/")}
        className="-ml-2 text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Overview
      </Button>

      <CampaignHeader campaign={campaign} />

      <ScoreEvolution history={history ?? []} logs={logs} />

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Métricas operacionais
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <MetricCard label="Investimento" value={nd(campaign.investment, fmtBRL)} delta={campaign.deltas.investment} />
          <MetricCard label="CPA Alvo" value={nd(campaign.cpaTarget, fmtBRL)} />
          <MetricCard
            label="CPA Real"
            value={nd(campaign.cpaActual, fmtBRL)}
            delta={campaign.deltas.cpaActual == null ? undefined : -campaign.deltas.cpaActual /* lower is better */}
          />
          <MetricCard
            label="Conversões"
            value={nd(campaign.conversions, (n) => n.toLocaleString("pt-BR"))}
            delta={campaign.deltas.conversions}
          />
          <MetricCard
            label="CTR"
            value={nd(campaign.ctr, (n) => `${(n * 100).toFixed(2)}%`)}
            delta={campaign.deltas.ctr}
          />
          <MetricCard
            label="ROAS"
            value={nd(campaign.roas, (n) => `${n.toFixed(2)}x`)}
            delta={campaign.deltas.roas}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tarefas ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <ActiveTasks tasks={tasks} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Histórico de otimizações</CardTitle>
          </CardHeader>
          <CardContent>
            <OptimizationTimeline logs={logs} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------- subviews ------------------------------- */

function CampaignHeader({ campaign }: { campaign: Campaign }) {
  const navigate = useNavigate();
  const hasClient = campaign.client && campaign.client !== "N/D";
  return (
    <Card>
      <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{campaign.name}</h1>
            <StatusBadge status={campaign.status} size="lg" />
          </div>
          <p className="text-sm text-muted-foreground">
            {hasClient ? (
              <button
                type="button"
                onClick={() => navigate(`/clientes/${encodeURIComponent(campaign.client)}`)}
                className="text-primary underline underline-offset-4 hover:opacity-80"
              >
                {campaign.client}
              </button>
            ) : (
              campaign.client
            )}{" "}
            · {campaign.platform}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            Última atualização PHI · {fmtDate(campaign.lastUpdate)} {fmtTime(campaign.lastUpdate)}
          </p>
        </div>

        <ScoreGauge score={campaign.score} status={campaign.status} />
      </CardContent>
    </Card>
  );
}

function ScoreGauge({ score, status }: { score: number; status: CampaignStatus }) {
  const size = 130;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const hasScore = Number.isFinite(score);
  const offset = circumference - ((hasScore ? score : 0) / 100) * circumference;

  return (
    <div className="relative flex h-[130px] w-[130px] shrink-0 items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={STATUS_VAR[status]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-3xl font-semibold leading-none">{hasScore ? score : ND}</span>
        <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Score PHI</span>
      </div>
    </div>
  );
}

function ScoreEvolution({
  history,
  logs,
}: {
  history: ScorePoint[];
  logs: ReturnType<typeof Object>[];
}) {
  // Build chart data and overlay optimization markers on matching dates
  const data = history.map((p) => ({
    date: p.date,
    label: fmtDateShort(p.date),
    score: p.score,
  }));

  const dateToScore = new Map(data.map((d) => [d.date, d.score]));

  const markers = (logs as { date: string; title: string; result: OptimizationResult; scoreImpact: number }[])
    .map((l) => {
      const isoDay = l.date.slice(0, 10);
      const score = dateToScore.get(isoDay);
      if (score == null) return null;
      return { ...l, isoDay, score, label: fmtDateShort(isoDay) };
    })
    .filter(Boolean) as { isoDay: string; title: string; result: OptimizationResult; scoreImpact: number; score: number; label: string }[];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Evolução do Score</CardTitle>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Info className="h-3 w-3" />
            {data.length === 0 ? "Sem histórico disponível" : "Score diário (phi_score_history)"}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval={Math.floor(data.length / 8)}
              />
              <YAxis
                domain={[0, 100]}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />

              <ReferenceLine y={80} stroke={STATUS_VAR.EXCELLENT} strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: "80", fill: "hsl(var(--muted-foreground))", fontSize: 10, position: "right" }} />
              <ReferenceLine y={60} stroke={STATUS_VAR.WARNING} strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: "60", fill: "hsl(var(--muted-foreground))", fontSize: 10, position: "right" }} />
              <ReferenceLine y={40} stroke={STATUS_VAR.CRITICAL} strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: "40", fill: "hsl(var(--muted-foreground))", fontSize: 10, position: "right" }} />

              <ReTooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />

              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5 }}
              />

              {markers.map((m, i) => (
                <ReferenceDot
                  key={i}
                  x={m.label}
                  y={m.score}
                  r={5}
                  fill={
                    m.result === "Sucesso"
                      ? STATUS_VAR.EXCELLENT
                      : m.result === "Insucesso"
                        ? STATUS_VAR.CRITICAL
                        : "hsl(var(--muted-foreground))"
                  }
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: number;
}) {
  const showDelta = delta != null && !Number.isNaN(delta);
  const positive = (delta ?? 0) >= 0;
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-2 font-mono text-xl font-semibold">{value}</div>
        {showDelta && (
          <div
            className={cn(
              "mt-1 flex items-center gap-1 text-xs font-medium",
              positive ? "text-status-good" : "text-status-critical",
            )}
          >
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {positive ? "+" : ""}
            {delta!.toFixed(1)}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActiveTasks({ tasks }: { tasks: { id: string; title: string; priority: Priority; status: string; affectedMetric: string; hypothesis: string }[] }) {
  const open = tasks.filter((t) => t.status === "Aberta" || t.status === "Em Execução");
  if (open.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        🎯 Sem tarefas abertas para esta campanha.
      </p>
    );
  }

  const grouped = PRIORITY_ORDER.map((p) => ({
    priority: p,
    items: open.filter((t) => t.priority === p),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-5">
      {grouped.map((g) => (
        <div key={g.priority}>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline" className={cn("font-mono text-[10px]", PRIORITY_STYLE[g.priority])}>
              {g.priority}
            </Badge>
            <span className="text-xs text-muted-foreground">{g.items.length} tarefa(s)</span>
          </div>
          <Accordion type="multiple" className="space-y-1.5">
            {g.items.map((t) => (
              <AccordionItem
                key={t.id}
                value={t.id}
                className="rounded-md border border-border bg-background/40 px-3"
              >
                <AccordionTrigger className="py-3 text-sm hover:no-underline">
                  <div className="flex flex-1 items-center justify-between gap-2 text-left">
                    <span className="font-medium">{t.title}</span>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t.affectedMetric}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-3 text-sm text-muted-foreground">
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-foreground/70">
                    Hipótese de solução
                  </div>
                  {t.hypothesis}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ))}
    </div>
  );
}

function OptimizationTimeline({ logs }: { logs: { id: string; title: string; date: string; result: OptimizationResult; scoreImpact: number }[] }) {
  if (logs.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhuma otimização registrada.
      </p>
    );
  }
  return (
    <ol className="relative space-y-3 border-l border-border pl-4">
      {logs.map((l) => {
        const positive = l.scoreImpact > 0;
        const negative = l.scoreImpact < 0;
        return (
          <li key={l.id} className="relative">
            <span
              className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background"
              style={{
                backgroundColor:
                  l.result === "Sucesso"
                    ? STATUS_VAR.EXCELLENT
                    : l.result === "Insucesso"
                      ? STATUS_VAR.CRITICAL
                      : "hsl(var(--muted-foreground))",
              }}
            />
            <div className="rounded-md border border-border bg-background/40 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] text-muted-foreground">{fmtDate(l.date)}</span>
                <Badge variant="outline" className={cn("font-mono text-[10px]", RESULT_STYLE[l.result])}>
                  {l.result}
                </Badge>
              </div>
              <p className="mt-1.5 text-sm font-medium">{l.title}</p>
              <p
                className={cn(
                  "mt-1 font-mono text-xs",
                  positive ? "text-status-good" : negative ? "text-status-critical" : "text-muted-foreground",
                )}
              >
                Impacto no score: {positive ? "+" : ""}
                {l.scoreImpact} pts
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
