import { useQuery } from "@tanstack/react-query";
import type { PhiSnapshot } from "@/lib/phi/types";

const STALE_MS = 5 * 60 * 1000;

// Base da API do backend. Vazio = mesma origem (backend serve o build).
// Em dev, defina VITE_PHI_API_BASE (ex.: http://localhost:8080).
const API_BASE = import.meta.env.VITE_PHI_API_BASE ?? "";

/**
 * Fonte única dos dados de campanha (métricas). View-only.
 * Busca do backend (edge/Node) que lê o BigQuery (phi_score_current + raw_campaign_data).
 * O score vem pronto de phi_score_current — o front NUNCA recalcula.
 * Em falha, o React Query expõe o erro (a UI mostra estado de erro/N/D) — sem inventar dados.
 */
export function usePhiData(opts?: { autoRefresh?: boolean }) {
  return useQuery<PhiSnapshot>({
    queryKey: ["phi", "snapshot"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/phi-snapshot`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`phi-snapshot ${res.status}: ${body.slice(0, 200)}`);
      }
      return (await res.json()) as PhiSnapshot;
    },
    staleTime: STALE_MS,
    refetchInterval: opts?.autoRefresh ? STALE_MS : false,
    refetchOnWindowFocus: false,
  });
}
