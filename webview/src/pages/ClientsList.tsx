import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { usePhiData } from "@/hooks/usePhiData";
import { useClientData } from "@/hooks/useClientData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/phi/StatusBadge";
import { STATUS_ORDER, type Campaign, type CampaignStatus } from "@/lib/phi/types";

/** Display-only aggregation. Does not recalculate any campaign score. */
export function aggregateClient(campaigns: Campaign[]) {
  if (campaigns.length === 0) {
    return { count: 0, avgScore: null as number | null, worstStatus: null as CampaignStatus | null };
  }
  const avgScore = Math.round(
    campaigns.reduce((acc, c) => acc + c.score, 0) / campaigns.length,
  );
  const worstStatus = campaigns
    .map((c) => c.status)
    .sort((a, b) => STATUS_ORDER.indexOf(b) - STATUS_ORDER.indexOf(a))[0];
  return { count: campaigns.length, avgScore, worstStatus };
}

export default function ClientsList() {
  const navigate = useNavigate();
  const { data: phi, isLoading: loadingPhi } = usePhiData();
  const { data: dossiers, isLoading: loadingClients } = useClientData();

  const isLoading = loadingPhi || loadingClients;

  const rows = useMemo(() => {
    if (!dossiers) return [];
    return dossiers
      .map((d) => {
        const campaigns = phi?.campaigns.filter((c) => c.client === d.client) ?? [];
        return { client: d.client, campaigns, ...aggregateClient(campaigns) };
      })
      .sort((a, b) => a.client.localeCompare(b.client, "pt-BR"));
  }, [dossiers, phi]);

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div>
        <h1 className="font-serif text-2xl tracking-tight md:text-3xl">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Dossiê de cada cliente e desempenho agregado das suas campanhas.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Todos os clientes ({isLoading ? "—" : rows.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {isLoading ? (
            <div className="space-y-2 px-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              Nenhum cliente cadastrado ainda.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((r) => (
                <li key={r.client}>
                  <button
                    type="button"
                    onClick={() => navigate(`/clientes/${encodeURIComponent(r.client)}`)}
                    className="flex w-full items-center gap-4 px-6 py-3 text-left transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{r.client}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {r.count} {r.count === 1 ? "campanha ativa" : "campanhas ativas"}
                      </div>
                    </div>
                    <div className="hidden text-right sm:block">
                      <div className="font-mono text-sm">
                        {r.avgScore ?? <span className="text-muted-foreground">N/D</span>}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Score médio
                      </div>
                    </div>
                    {r.worstStatus ? (
                      <StatusBadge status={r.worstStatus} />
                    ) : (
                      <span className="text-xs text-muted-foreground">N/D</span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
