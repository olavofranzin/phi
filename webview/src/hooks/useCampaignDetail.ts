import { useQuery } from "@tanstack/react-query";

const STALE_MS = 5 * 60 * 1000;
const API_BASE = import.meta.env.VITE_PHI_API_BASE ?? "";

export interface CampaignOps {
  investido?: string | number | null;
  cpa?: string | null;
  cpc?: string | null;
  cpm?: string | null;
  ctr?: string | null;
  cvr?: string | null;
  cpl?: string | null;
  impressoes?: string | null;
  taxaConversao?: string | null;
  roas?: string | number | null;
  metricaMae7d?: string | number | null;
  metaMae?: string | number | null;
  metricaMaeNome?: string | string[] | null;
}
export interface OpsTask {
  name?: string | null;
  status?: string | null;
  priority?: string | null;
  metric?: string | null;
  hypothesis?: string | null;
  gravity?: string | null;
  url?: string | null;
}
export interface OpsLog {
  acao?: string | null;
  date?: string | null;
  resultado?: string | null;
  tipo?: string | null;
  impacto?: string | number | null;
  classificacao?: string | null;
  url?: string | null;
}
export interface OpsDaily {
  title?: string | null;
  date?: string | null;
  analise?: string | null;
  statusMetrica?: string | null;
  metricaPrincipal?: string | null;
  v1d?: string | number | null;
  v3d?: string | number | null;
  v7d?: string | number | null;
  tendencia1?: string | null;
  tendencia3?: string | null;
  optimizationScore?: string | number | null;
  fonte?: string | null;
  url?: string | null;
}
export interface OpsAnalysis {
  titulo?: string | null;
  diagnostico?: string | null;
  decisao?: string | null;
  proximosPassos?: string | null;
  leitura?: string | null;
  severidade?: string | null;
  flags?: string[];
  janela?: string | null;
  nivel?: string | null;
  score?: string | number | null;
  data?: string | null;
  modelo?: string | null;
  confianca?: string | null;
  url?: string | null;
}
export interface OpsAd {
  nome?: string | null;
  plataforma?: string | null;
  status?: string | null;
  statusOperacional?: string | null;
  scoreOperacional?: string | number | null;
  diagnostico?: string | null;
  tendencia?: string | null;
  metaMae?: string | number | null;
  metricaMae7d?: string | null;
  kpis: {
    investido?: string | null;
    cpa?: string | null;
    cpc?: string | null;
    cpm?: string | null;
    ctr?: string | null;
    roas?: string | null;
    conversoes?: string | null;
    impressoes?: string | null;
    cliques?: string | null;
    taxaConversao?: string | null;
  };
  url?: string | null;
}
export interface CampaignDetailBundle {
  ops: CampaignOps | null;
  tasks: OpsTask[];
  logs: OpsLog[];
  dailyEntries: OpsDaily[];
  analyses: OpsAnalysis[];
  ads: OpsAd[];
}

/** Painel operacional da campanha (Notion): métricas, tarefas, log, daily, análises, anúncios. */
export function useCampaignDetail(campaignId?: string) {
  return useQuery<CampaignDetailBundle>({
    queryKey: ["phi", "campaign-detail", campaignId],
    enabled: !!campaignId,
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/api/campaign-detail?campaign=${encodeURIComponent(campaignId!)}`,
        { headers: { Accept: "application/json" } },
      );
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`campaign-detail ${res.status}: ${body.slice(0, 200)}`);
      }
      return (await res.json()) as CampaignDetailBundle;
    },
    staleTime: STALE_MS,
    refetchOnWindowFocus: false,
  });
}
