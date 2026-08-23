import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { usePhiData } from "@/hooks/usePhiData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/phi/StatusBadge";
import { STATUS_VAR } from "@/lib/phi/types";

export default function CampaignsList() {
  const navigate = useNavigate();
  const { data, isLoading } = usePhiData();

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Campanhas</h1>
        <p className="text-sm text-muted-foreground">
          Selecione uma campanha para ver o drill-down completo.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Todas as campanhas ({data?.campaigns.length ?? "—"})</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {isLoading || !data ? (
            <div className="space-y-2 px-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {data.campaigns
                .slice()
                .sort((a, b) => a.score - b.score)
                .map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/campanhas/${c.id}`)}
                      className="flex w-full items-center gap-4 px-6 py-3 text-left transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{c.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {c.client} · {c.platform}
                        </div>
                      </div>
                      <div className="hidden items-center gap-2 sm:flex">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${c.score}%`, backgroundColor: STATUS_VAR[c.status] }}
                          />
                        </div>
                        <span className="w-7 text-right font-mono text-xs">{c.score}</span>
                      </div>
                      <StatusBadge status={c.status} />
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
