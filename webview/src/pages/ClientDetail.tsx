import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";

import { usePhiData } from "@/hooks/usePhiData";
import { useClientData } from "@/hooks/useClientData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/phi/StatusBadge";
import { DossierField } from "@/components/phi/DossierField";
import { DOSSIER_SECTIONS } from "@/lib/phi/sections";
import { STATUS_VAR } from "@/lib/phi/types";
import { aggregateClient } from "./ClientsList";

export default function ClientDetail() {
  const { client } = useParams<{ client: string }>();
  const navigate = useNavigate();
  const { data: phi, isLoading: loadingPhi } = usePhiData();
  const { data: dossiers, isLoading: loadingClients } = useClientData();

  const clientName = client ? decodeURIComponent(client) : "";
  const isLoading = loadingPhi || loadingClients;

  const dossier = useMemo(
    () => dossiers?.find((d) => d.client === clientName),
    [dossiers, clientName],
  );

  const campaigns = useMemo(
    () => phi?.campaigns.filter((c) => c.client === clientName) ?? [],
    [phi, clientName],
  );

  const agg = aggregateClient(campaigns);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-6 lg:p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="space-y-4 p-4 md:p-6 lg:p-8">
        <Button variant="outline" size="sm" onClick={() => navigate("/clientes")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm font-medium">Cliente não encontrado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Não há dossiê para “{clientName || "—"}”.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <Button variant="outline" size="sm" onClick={() => navigate("/clientes")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Clientes
      </Button>

      <Card>
        <CardContent className="flex flex-wrap items-end justify-between gap-4 pt-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Dossiê do cliente
            </p>
            <h1 className="font-serif text-3xl tracking-tight">{dossier.client}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {agg.count} {agg.count === 1 ? "campanha" : "campanhas"}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="font-mono text-2xl">
                {agg.avgScore ?? <span className="text-muted-foreground text-base">N/D</span>}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Score médio
              </div>
            </div>
            {agg.worstStatus ? (
              <StatusBadge status={agg.worstStatus} size="md" />
            ) : (
              <span className="text-xs text-muted-foreground">N/D</span>
            )}
          </div>
        </CardContent>
      </Card>

      {DOSSIER_SECTIONS.map((section) => (
        <Card key={section.id}>
          <CardHeader className="border-b border-border pb-3">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs text-muted-foreground">{section.index}</span>
              <span className="text-muted-foreground">/</span>
              <h2 className="font-serif text-lg uppercase tracking-[0.12em]">{section.title}</h2>
            </div>
            <p className="text-xs text-muted-foreground">{section.subtitle}</p>
          </CardHeader>
          <CardContent className="pt-2">
            <dl className="divide-y divide-border">
              {section.fields.map((f) => (
                <DossierField
                  key={f.key}
                  label={f.label}
                  type={f.type}
                  value={dossier.fields[f.key]}
                />
              ))}
            </dl>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader className="border-b border-border pb-3">
          <h2 className="font-serif text-lg uppercase tracking-[0.12em]">
            Campanhas deste cliente
          </h2>
          <p className="text-xs text-muted-foreground">
            Clique para abrir o drill-down completo da campanha.
          </p>
        </CardHeader>
        <CardContent className="px-0">
          {campaigns.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              Nenhuma campanha vinculada a este cliente.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {campaigns
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
                        <div className="truncate text-xs text-muted-foreground">{c.platform}</div>
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
