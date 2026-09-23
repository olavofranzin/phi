import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Search } from "lucide-react";

import { usePhiData } from "@/hooks/usePhiData";
import { useClientData } from "@/hooks/useClientData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/phi/StatusBadge";
import { CLIENT_NICHES, CLIENT_STATUSES } from "@/lib/phi/clientTypes";
import { STATUS_ORDER, type Campaign, type CampaignStatus } from "@/lib/phi/types";

/** Display-only aggregation. Does not recalculate any campaign score. */
export function aggregateClient(campaigns: Campaign[]) {
  if (campaigns.length === 0) {
    return { count: 0, avgScore: null as number | null, worstStatus: null as CampaignStatus | null };
  }
  const scored = campaigns.filter((c) => c.score != null);
  const avgScore = scored.length
    ? Math.round(scored.reduce((acc, c) => acc + (c.score ?? 0), 0) / scored.length)
    : null;
  const worstStatus = campaigns
    .map((c) => c.status)
    .sort((a, b) => STATUS_ORDER.indexOf(b) - STATUS_ORDER.indexOf(a))[0];
  return { count: campaigns.length, avgScore, worstStatus };
}

export default function ClientsList() {
  const navigate = useNavigate();
  const { data: phi, isLoading: loadingPhi } = usePhiData();
  const { data: dossiers, isLoading: loadingClients } = useClientData();

  const [query, setQuery] = useState("");
  const [niche, setNiche] = useState("all");
  const [status, setStatus] = useState("all");

  const isLoading = loadingPhi || loadingClients;

  const rows = useMemo(() => {
    if (!dossiers) return [];
    const q = query.trim().toLowerCase();
    return dossiers
      .filter((d) => (niche === "all" ? true : d.niche === niche))
      .filter((d) => (status === "all" ? true : d.status === status))
      .filter((d) =>
        q
          ? d.client.toLowerCase().includes(q) ||
            d.tags.some((t) => t.toLowerCase().includes(q)) ||
            d.niche.toLowerCase().includes(q)
          : true,
      )
      .map((d) => {
        const campaigns = phi?.campaigns.filter((c) => c.client === d.client) ?? [];
        return { dossier: d, ...aggregateClient(campaigns) };
      })
      .sort((a, b) => a.dossier.client.localeCompare(b.dossier.client, "pt-BR"));
  }, [dossiers, phi, query, niche, status]);

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div>
        <h1 className="font-serif text-2xl tracking-tight md:text-3xl">Clientes &amp; Dossiê</h1>
        <p className="text-sm text-muted-foreground">
          Dossiê estratégico de cada cliente e desempenho agregado das suas campanhas.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente, nicho ou tag…"
            className="pl-9"
          />
        </div>
        <Select value={niche} onValueChange={setNiche}>
          <SelectTrigger className="md:w-52">
            <SelectValue placeholder="Nicho" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os nichos</SelectItem>
            {CLIENT_NICHES.map((n) => (
              <SelectItem key={n} value={n}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="md:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {CLIENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhum cliente encontrado com esses filtros.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ dossier: d, count, avgScore, worstStatus }) => (
            <Card key={d.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{d.client}</CardTitle>
                  <Badge variant={d.status === "Ativo" ? "default" : "secondary"}>{d.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{d.niche}</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <div className="flex flex-wrap gap-1.5">
                  {d.tags.length === 0 ? (
                    <span className="text-xs text-muted-foreground">Sem tags</span>
                  ) : (
                    d.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))
                  )}
                </div>

                <div className="flex items-center gap-6">
                  <div>
                    <div className="font-mono text-xl">{count}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Campanhas
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-xl">
                      {avgScore ?? <span className="text-base text-muted-foreground">N/D</span>}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Score médio
                    </div>
                  </div>
                  <div className="ml-auto">
                    {worstStatus ? (
                      <StatusBadge status={worstStatus} />
                    ) : (
                      <span className="text-xs text-muted-foreground">N/D</span>
                    )}
                  </div>
                </div>

                <div className="mt-auto flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/clientes/${d.id}`)}
                  >
                    Abrir dossiê
                  </Button>
                  {d.notionUrl && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={d.notionUrl} target="_blank" rel="noreferrer">
                        Notion <ExternalLink className="ml-1 h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
