import { ExternalLink, Gauge, Globe, MousePointerClick, TestTube2, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AB_TESTS, SITE_KPIS, SITES } from "@/lib/phi/sitesMock";

const pct = (v: number) => `${(v * 100).toFixed(1).replace(".", ",")}%`;
const int = (v: number) => v.toLocaleString("pt-BR");

function KpiCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof Globe;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-center font-mono text-3xl tracking-tight">{value}</div>
        <p className="mt-1 text-center text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}

export default function SitesList() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div>
        <h1 className="font-serif text-2xl tracking-tight md:text-3xl">Sites &amp; LPs</h1>
        <p className="text-sm text-muted-foreground">
          Telemetria de sites e landing pages dos clientes — preparado para GA4 e CRO.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Taxa média de conversão"
          value={pct(SITE_KPIS.avgConversionRate)}
          note="Média ponderada dos sites monitorados"
          icon={MousePointerClick}
        />
        <KpiCard
          label="Sessões mensais"
          value={int(SITE_KPIS.monthlySessions)}
          note="Últimos 30 dias, todos os domínios"
          icon={Users}
        />
        <KpiCard
          label="Tempo de carregamento (LCP)"
          value={`${SITE_KPIS.lcpSeconds.toFixed(1).replace(".", ",")}s`}
          note="Excelente — abaixo de 2,5s"
          icon={Gauge}
        />
        <KpiCard
          label="Testes A/B ativos"
          value={String(SITE_KPIS.activeAbTests)}
          note="Rodando neste momento"
          icon={TestTube2}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Sites dos clientes</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <ul className="divide-y divide-border">
            {SITES.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/40 md:px-6"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{s.client}</div>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 truncate text-xs text-muted-foreground hover:text-primary"
                  >
                    {s.page} · {s.url.replace(/^https?:\/\//, "")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm">{int(s.sessions)}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Sessões
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm">{pct(s.conversionRate)}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Conversão
                  </div>
                </div>
                <Badge variant={s.abStatus === "Ativo" ? "default" : "secondary"}>
                  {s.abStatus === "Ativo" ? "Teste A/B ativo" : s.abStatus}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {AB_TESTS.map((t) => {
          const best = t.variants.reduce((a, b) => (b.conversionRate > a.conversionRate ? b : a));
          return (
            <Card key={t.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t.client}</CardTitle>
                <p className="text-xs text-muted-foreground">{t.hypothesis}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {t.variants.map((v) => (
                  <div key={v.label} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm">
                        <span className="font-medium">{v.label}</span>{" "}
                        <span className="text-muted-foreground">· {v.name}</span>
                      </span>
                      <span className="font-mono text-sm">{pct(v.conversionRate)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${
                          v.label === best.label ? "bg-status-excellent" : "bg-primary"
                        }`}
                        style={{ width: `${Math.min(100, v.conversionRate * 1000)}%` }}
                      />
                    </div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {pct(v.traffic)} do tráfego
                    </p>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  Liderando: <span className="text-status-excellent">{best.label}</span> ·{" "}
                  {best.name}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
