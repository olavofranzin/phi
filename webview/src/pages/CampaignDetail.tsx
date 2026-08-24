import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  Info,
  Megaphone,
  Sparkles,
  ClipboardList,
  History,
  CalendarDays,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { usePhiData } from "@/hooks/usePhiData";
import { useScoreHistory } from "@/hooks/useScoreHistory";
import {
  useCampaignDetail,
  type CampaignOps,
  type OpsAd,
  type OpsAnalysis,
  type OpsDaily,
  type OpsLog,
  type OpsTask,
} from "@/hooks/useCampaignDetail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/phi/StatusBadge";
import { STATUS_VAR, type Campaign, type CampaignStatus, type ScorePoint } from "@/lib/phi/types";
import { cn } from "@/lib/utils";

const ND = "N/D";
const STATUS_SET = ["EXCELLENT", "GOOD", "WARNING", "CRITICAL", "LEARNING"];

function txt(v: unknown): string {
  if (v === null || v === undefined || v === "") return ND;
  if (Array.isArray(v)) return v.length ? v.join(", ") : ND;
  return String(v);
}
function fmtBRL(v: unknown): string {
  const n = typeof v === "number" ? v : Number(v);
  if (v === null || v === undefined || v === "" || Number.isNaN(n)) return ND;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
}
function fmtNum(v: unknown, digits = 2): string {
  const n = typeof v === "number" ? v : Number(v);
  if (v === null || v === undefined || v === "" || Number.isNaN(n)) return ND;
  return n.toLocaleString("pt-BR", { maximumFractionDigits: digits });
}
function fmtDate(v: unknown): string {
  if (!v) return ND;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString("pt-BR");
}

export default function CampaignDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = usePhiData();
  const { data: history } = useScoreHistory(id);
  const { data: bundle, isLoading: loadingBundle } = useCampaignDetail(id);

  const campaign = data?.campaigns.find((c) => c.id === id);

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!campaign) {
    return (
      <div className="flex flex-col items-center gap-4 p-12 text-center">
        <p className="text-lg">Campanha não encontrada.</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/campanhas")}
        className="-ml-2 text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Campanhas
      </Button>

      <CampaignHeader campaign={campaign} />

      <OperationalMetrics ops={bundle?.ops ?? null} loading={loadingBundle} />

      <ScoreEvolution history={history ?? []} />

      <AgentAnalyses analyses={bundle?.analyses ?? []} loading={loadingBundle} />

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4" /> Tarefas ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActiveTasks tasks={bundle?.tasks ?? []} loading={loadingBundle} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4" /> Histórico de otimizações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OptimizationTimeline logs={bundle?.logs ?? []} loading={loadingBundle} />
          </CardContent>
        </Card>
      </div>

      <DailyEntries entries={bundle?.dailyEntries ?? []} loading={loadingBundle} />

      <AdsSection ads={bundle?.ads ?? []} loading={loadingBundle} />
    </div>
  );
}

/* ------------------------------- Header ------------------------------- */
function CampaignHeader({ campaign }: { campaign: Campaign }) {
  const navigate = useNavigate();
  const hasClient = campaign.client && campaign.client !== "N/D";
  const score = campaign.score;
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
        </div>
        <ScoreGauge score={score} status={campaign.status} />
      </CardContent>
    </Card>
  );
}

function ScoreGauge({ score, status }: { score: number | null; status: CampaignStatus }) {
  const size = 130;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const has = Number.isFinite(score as number);
  const offset = circumference - ((has ? (score as number) : 0) / 100) * circumference;
  return (
    <div className="relative flex h-[130px] w-[130px] shrink-0 items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
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
        <span className="font-mono text-3xl font-semibold leading-none">{has ? score : ND}</span>
        <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Score PHI</span>
      </div>
    </div>
  );
}

/* ------------------------- Métricas Operacionais ------------------------- */
function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-2 font-mono text-lg font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function OperationalMetrics({ ops, loading }: { ops: CampaignOps | null; loading: boolean }) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Métricas operacionais
        </h2>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Info className="h-3 w-3" /> valores de 7 dias (30 dias entre parênteses)
        </span>
      </div>
      {loading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          <MetricCard label="Investido" value={fmtBRL(ops?.investido)} />
          <MetricCard label="CPA" value={txt(ops?.cpa)} />
          <MetricCard label="CPC" value={txt(ops?.cpc)} />
          <MetricCard label="CPM" value={txt(ops?.cpm)} />
          <MetricCard label="CTR" value={txt(ops?.ctr)} />
          <MetricCard label="Taxa de conversão" value={txt(ops?.cvr ?? ops?.taxaConversao)} />
          <MetricCard label="ROAS" value={typeof ops?.roas === "number" ? fmtNum(ops?.roas) : txt(ops?.roas)} />
          <MetricCard label="Impressões" value={txt(ops?.impressoes)} />
          <MetricCard label="Métrica-mãe (7D)" value={fmtNum(ops?.metricaMae7d)} />
          <MetricCard label="Meta da métrica-mãe" value={fmtNum(ops?.metaMae)} />
        </div>
      )}
    </div>
  );
}

/* ---------------------------- Score evolution ---------------------------- */
function ScoreEvolution({ history }: { history: ScorePoint[] }) {
  const data = history.map((p) => ({ label: fmtDate(p.date), score: p.score }));
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
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(data.length / 8))} />
              <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <ReferenceLine y={80} stroke={STATUS_VAR.EXCELLENT} strokeDasharray="4 4" strokeOpacity={0.5} />
              <ReferenceLine y={60} stroke={STATUS_VAR.WARNING} strokeDasharray="4 4" strokeOpacity={0.5} />
              <ReferenceLine y={40} stroke={STATUS_VAR.CRITICAL} strokeDasharray="4 4" strokeOpacity={0.5} />
              <ReTooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/* --------------------------- Análise dos agentes --------------------------- */
function NotionLink({ url }: { url?: string | null }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-xs text-primary underline underline-offset-4 hover:opacity-80"
    >
      abrir no Notion <ExternalLink className="h-3 w-3" />
    </a>
  );
}

function leituraBadge(leitura?: string | null) {
  const s = String(leitura || "").toUpperCase();
  if (STATUS_SET.includes(s)) return <StatusBadge status={s as CampaignStatus} />;
  return leitura ? <Badge variant="outline">{leitura}</Badge> : null;
}

function AgentAnalyses({ analyses, loading }: { analyses: OpsAnalysis[]; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4" /> Análise dos agentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : analyses.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma análise registrada para esta campanha.
          </p>
        ) : (
          <div className="space-y-3">
            {analyses.slice(0, 6).map((a, i) => (
              <div key={a.url || i} className="rounded-md border border-border bg-background/40 p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {leituraBadge(a.leitura)}
                  {a.severidade && <Badge variant="outline" className="text-[10px] uppercase">{a.severidade}</Badge>}
                  {a.janela && <Badge variant="outline" className="text-[10px]">{a.janela}</Badge>}
                  {a.nivel && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{a.nivel}</span>}
                  <span className="ml-auto text-[11px] text-muted-foreground">{fmtDate(a.data)}</span>
                </div>
                {a.titulo && <p className="mb-2 text-sm font-medium">{a.titulo}</p>}
                {a.diagnostico && (
                  <Field label="Diagnóstico" value={a.diagnostico} />
                )}
                {a.decisao && <Field label="Decisão" value={a.decisao} />}
                {a.proximosPassos && <Field label="Próximos passos" value={a.proximosPassos} />}
                {a.flags && a.flags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {a.flags.map((f) => (
                      <Badge key={f} variant="outline" className="text-[10px]">{f}</Badge>
                    ))}
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    {a.modelo ? `modelo: ${a.modelo}` : ""}
                  </span>
                  <NotionLink url={a.url} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/70">{label}</div>
      <p className="whitespace-pre-line text-sm text-muted-foreground">{value}</p>
    </div>
  );
}

/* ------------------------------ Tarefas ativas ------------------------------ */
function ActiveTasks({ tasks, loading }: { tasks: OpsTask[]; loading: boolean }) {
  if (loading) return <Skeleton className="h-24 w-full" />;
  if (tasks.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">🎯 Sem tarefas abertas para esta campanha.</p>;
  }
  return (
    <ul className="space-y-2">
      {tasks.map((t, i) => (
        <li key={t.url || i} className="rounded-md border border-border bg-background/40 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium">{txt(t.name)}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {t.priority && <Badge variant="outline" className="font-mono text-[10px]">{t.priority}</Badge>}
                {t.status && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.status}</span>}
                {t.metric && <span className="text-[10px] text-muted-foreground">· {t.metric}</span>}
              </div>
              {t.hypothesis && <p className="mt-1.5 text-xs text-muted-foreground">{t.hypothesis}</p>}
            </div>
          </div>
          <div className="mt-2 text-right">
            <NotionLink url={t.url} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------- Histórico de otimizações ------------------------- */
function OptimizationTimeline({ logs, loading }: { logs: OpsLog[]; loading: boolean }) {
  if (loading) return <Skeleton className="h-24 w-full" />;
  if (logs.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma otimização registrada.</p>;
  }
  const color = (r?: string | null) =>
    r === "Sucesso" ? STATUS_VAR.EXCELLENT : r === "Insucesso" ? STATUS_VAR.CRITICAL : "hsl(var(--muted-foreground))";
  return (
    <ol className="relative space-y-3 border-l border-border pl-4">
      {logs.map((l, i) => (
        <li key={l.url || i} className="relative">
          <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background" style={{ backgroundColor: color(l.resultado) }} />
          <div className="rounded-md border border-border bg-background/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] text-muted-foreground">{fmtDate(l.date)}</span>
              {l.resultado && <Badge variant="outline" className="font-mono text-[10px]">{l.resultado}</Badge>}
            </div>
            <p className="mt-1.5 text-sm font-medium">{txt(l.acao)}</p>
            {l.tipo && <p className="mt-0.5 text-[11px] text-muted-foreground">{l.tipo}</p>}
            <div className="mt-1 text-right">
              <NotionLink url={l.url} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------ Daily Entry ------------------------------ */
function DailyEntries({ entries, loading }: { entries: OpsDaily[]; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-4 w-4" /> Daily Entry (Observações Diárias)
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {loading ? (
          <div className="px-6"><Skeleton className="h-24 w-full" /></div>
        ) : entries.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-muted-foreground">Sem registros diários.</p>
        ) : (
          <ul className="divide-y divide-border">
            {entries.slice(0, 8).map((e, i) => (
              <li key={e.url || i} className="px-6 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{fmtDate(e.date)}</span>
                  {e.metricaPrincipal && <Badge variant="outline" className="text-[10px]">{e.metricaPrincipal}</Badge>}
                  {e.statusMetrica && <span className="text-[11px] text-muted-foreground">{e.statusMetrica}</span>}
                  <span className="ml-auto">
                    <NotionLink url={e.url} />
                  </span>
                </div>
                {e.analise && <p className="mt-1 text-sm">{e.analise}</p>}
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                  {e.v7d != null && e.v7d !== "" && <span>7D: {fmtNum(e.v7d)}</span>}
                  {e.tendencia1 && <span>tend. 1Dx7D: {e.tendencia1}</span>}
                  {e.optimizationScore != null && e.optimizationScore !== "" && <span>opt. score: {fmtNum(e.optimizationScore)}</span>}
                  {e.fonte && <span>fonte: {e.fonte}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------------------- Anúncios -------------------------------- */
function AdKpi({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono text-sm">{txt(value)}</div>
    </div>
  );
}

function AdsSection({ ads, loading }: { ads: OpsAd[]; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Megaphone className="h-4 w-4" /> Anúncios da campanha
        </CardTitle>
        <p className="text-xs text-muted-foreground">Mesmos KPIs da campanha, por anúncio — 7 dias (30 dias entre parênteses).</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : ads.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhum anúncio vinculado a esta campanha.</p>
        ) : (
          <div className="space-y-3">
            {ads.map((ad, i) => (
              <div key={ad.url || i} className="rounded-md border border-border bg-background/40 p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{txt(ad.nome)}</span>
                  {ad.plataforma && <Badge variant="outline" className="text-[10px]">{ad.plataforma}</Badge>}
                  {ad.status && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{ad.status}</span>}
                  {ad.statusOperacional && <Badge variant="outline" className="text-[10px]">{ad.statusOperacional}</Badge>}
                  <span className="ml-auto">
                    <NotionLink url={ad.url} />
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
                  <AdKpi label="Investido" value={ad.kpis.investido} />
                  <AdKpi label="CPA" value={ad.kpis.cpa} />
                  <AdKpi label="CPC" value={ad.kpis.cpc} />
                  <AdKpi label="CPM" value={ad.kpis.cpm} />
                  <AdKpi label="CTR" value={ad.kpis.ctr} />
                  <AdKpi label="ROAS" value={ad.kpis.roas} />
                  <AdKpi label="Conversões" value={ad.kpis.conversoes} />
                  <AdKpi label="Impressões" value={ad.kpis.impressoes} />
                  <AdKpi label="Cliques" value={ad.kpis.cliques} />
                  <AdKpi label="Taxa conv." value={ad.kpis.taxaConversao} />
                </div>
                {ad.diagnostico && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    <span className="font-semibold uppercase tracking-wider text-foreground/70">Diagnóstico:</span>{" "}
                    {ad.diagnostico}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
