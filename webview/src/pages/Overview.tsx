import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, AlertTriangle, AlertCircle, Activity, ListChecks, Sparkles } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

import { usePhiData } from "@/hooks/usePhiData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/phi/StatusBadge";
import { STATUS_LABEL, STATUS_VAR, type CampaignStatus } from "@/lib/phi/types";
import { cn } from "@/lib/utils";

const STATUS_FOR_DONUT: CampaignStatus[] = ["EXCELLENT", "GOOD", "LEARNING", "WARNING", "CRITICAL"];

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function fmtDateShort(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function Overview() {
  const navigate = useNavigate();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { data, isLoading, refetch, isFetching } = usePhiData({ autoRefresh });

  const stats = useMemo(() => {
    if (!data) return null;
    const { campaigns, tasks } = data;
    const total = campaigns.length;
    const byStatus = STATUS_FOR_DONUT.reduce<Record<CampaignStatus, number>>((acc, s) => {
      acc[s] = 0;
      return acc;
    }, { EXCELLENT: 0, GOOD: 0, LEARNING: 0, WARNING: 0, CRITICAL: 0 });
    for (const c of campaigns) byStatus[c.status]++;

    const avgScore = Math.round(
      campaigns.reduce((sum, c) => sum + c.score, 0) / Math.max(1, total),
    );
    const openTasksP01 = tasks.filter(
      (t) => (t.status === "Aberta" || t.status === "Em Execução") && (t.priority === "P0" || t.priority === "P1"),
    ).length;

    return { total, byStatus, avgScore, openTasksP01 };
  }, [data]);

  const criticalRows = useMemo(() => {
    if (!data) return [];
    const tasksOpenByCampaign = new Map<string, number>();
    for (const t of data.tasks) {
      if (t.status === "Aberta" || t.status === "Em Execução") {
        tasksOpenByCampaign.set(t.campaignId, (tasksOpenByCampaign.get(t.campaignId) ?? 0) + 1);
      }
    }
    return data.campaigns
      .filter((c) => c.status === "CRITICAL" || c.status === "WARNING")
      .sort((a, b) => a.score - b.score)
      .map((c) => ({ ...c, openTasks: tasksOpenByCampaign.get(c.id) ?? 0 }));
  }, [data]);

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">PHI™ Overview</h1>
          <p className="text-sm text-muted-foreground">
            Saúde geral das campanhas de tráfego pago em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "gap-1.5 font-mono text-[11px]",
              autoRefresh ? "border-status-good/40 text-status-good" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                autoRefresh ? "bg-status-good animate-pulse" : "bg-muted-foreground",
              )}
            />
            {autoRefresh ? "Auto-refresh 5min" : "Auto-refresh off"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh((v) => !v)}
            className="hidden sm:inline-flex"
          >
            {autoRefresh ? "Pausar" : "Retomar"}
          </Button>
          <Button size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
            Atualizar
          </Button>
          {data && (
            <span className="hidden font-mono text-xs text-muted-foreground md:inline">
              · {fmtTime(data.generatedAt)}
            </span>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label="Campanhas ativas"
          value={stats?.total ?? "—"}
          icon={<Activity className="h-4 w-4" />}
          loading={isLoading}
        />
        <KpiCard
          label="CRITICAL"
          value={stats ? `${stats.byStatus.CRITICAL}` : "—"}
          subtitle={
            stats
              ? `${Math.round((stats.byStatus.CRITICAL / Math.max(1, stats.total)) * 100)}% do total`
              : undefined
          }
          accent="critical"
          icon={<AlertCircle className="h-4 w-4" />}
          loading={isLoading}
        />
        <KpiCard
          label="WARNING"
          value={stats ? `${stats.byStatus.WARNING}` : "—"}
          subtitle={
            stats
              ? `${Math.round((stats.byStatus.WARNING / Math.max(1, stats.total)) * 100)}% do total`
              : undefined
          }
          accent="warning"
          icon={<AlertTriangle className="h-4 w-4" />}
          loading={isLoading}
        />
        <KpiCard
          label="Score médio"
          value={stats ? <span className="font-mono">{stats.avgScore}</span> : "—"}
          subtitle="0–100"
          icon={<Sparkles className="h-4 w-4" />}
          loading={isLoading}
        />
        <KpiCard
          label="Tarefas P0/P1"
          value={stats?.openTasksP01 ?? "—"}
          subtitle="abertas / em execução"
          icon={<ListChecks className="h-4 w-4" />}
          loading={isLoading}
        />
      </div>

      {/* Donut + Timeline */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribuição por status</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading || !stats ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="h-56 w-full sm:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={STATUS_FOR_DONUT.map((s) => ({
                          name: STATUS_LABEL[s],
                          value: stats.byStatus[s],
                          status: s,
                        }))}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={85}
                        strokeWidth={2}
                        stroke="hsl(var(--card))"
                      >
                        {STATUS_FOR_DONUT.map((s) => (
                          <Cell key={s} fill={STATUS_VAR[s]} />
                        ))}
                      </Pie>
                      <ReTooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="flex w-full flex-col gap-2 sm:w-1/2">
                  {STATUS_FOR_DONUT.map((s) => {
                    const count = stats.byStatus[s];
                    const pct = Math.round((count / Math.max(1, stats.total)) * 100);
                    return (
                      <li key={s} className="flex items-center justify-between gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-sm"
                            style={{ backgroundColor: STATUS_VAR[s] }}
                          />
                          <span className="text-foreground/90">{STATUS_LABEL[s]}</span>
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">
                          <span className="text-foreground">{count}</span> · {pct}%
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Timeline de alertas (7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading || !data ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data.alertTimeline.map((p) => ({ ...p, label: fmtDateShort(p.date) }))}
                    margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="label"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <ReTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 11 }}
                      iconType="circle"
                      iconSize={8}
                    />
                    {STATUS_FOR_DONUT.map((s) => (
                      <Line
                        key={s}
                        type="monotone"
                        dataKey={s}
                        name={STATUS_LABEL[s]}
                        stroke={STATUS_VAR[s]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Critical campaigns table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Campanhas críticas</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {isLoading ? (
            <div className="space-y-2 px-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : criticalRows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <span className="text-3xl">🎉</span>
              <p className="text-sm text-muted-foreground">
                Nenhuma campanha em estado crítico ou warning.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Campanha</TableHead>
                  <TableHead className="hidden md:table-cell">Cliente</TableHead>
                  <TableHead className="hidden sm:table-cell">Plataforma</TableHead>
                  <TableHead className="w-[140px]">Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Tarefas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {criticalRows.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/campanhas/${c.id}`)}
                  >
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {c.client}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {c.platform}
                    </TableCell>
                    <TableCell>
                      <ScoreBar score={c.score} status={c.status} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {c.openTasks}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ----------------------------- subcomponents ---------------------------- */

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  accent?: "critical" | "warning";
  loading?: boolean;
}

function KpiCard({ label, value, subtitle, icon, accent, loading }: KpiCardProps) {
  const accentClass =
    accent === "critical"
      ? "border-status-critical/30"
      : accent === "warning"
        ? "border-status-warning/30"
        : "";
  const valueClass =
    accent === "critical"
      ? "text-status-critical"
      : accent === "warning"
        ? "text-status-warning"
        : "text-foreground";

  return (
    <Card className={cn("overflow-hidden", accentClass)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <span>{label}</span>
          {icon}
        </div>
        {loading ? (
          <Skeleton className="mt-3 h-8 w-20" />
        ) : (
          <div className={cn("mt-2 text-3xl font-semibold leading-none", valueClass)}>{value}</div>
        )}
        {subtitle && !loading && (
          <p className="mt-2 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreBar({ score, status }: { score: number; status: CampaignStatus }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{ width: `${score}%`, backgroundColor: STATUS_VAR[status] }}
        />
      </div>
      <span className="font-mono text-xs text-foreground">{score}</span>
    </div>
  );
}
