import { useQuery } from "@tanstack/react-query";
import type { ScorePoint } from "@/lib/phi/types";

const STALE_MS = 5 * 60 * 1000;
const API_BASE = import.meta.env.VITE_PHI_API_BASE ?? "";

/**
 * Série histórica do score de uma campanha (phi_score_history), via backend.
 * O score é fato (não recalcula). Vazio se não houver histórico.
 */
export function useScoreHistory(campaignId?: string) {
  return useQuery<ScorePoint[]>({
    queryKey: ["phi", "score-history", campaignId],
    enabled: !!campaignId,
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/api/phi-score-history?campaign=${encodeURIComponent(campaignId!)}`,
        { headers: { Accept: "application/json" } },
      );
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`score-history ${res.status}: ${body.slice(0, 200)}`);
      }
      return (await res.json()) as ScorePoint[];
    },
    staleTime: STALE_MS,
    refetchOnWindowFocus: false,
  });
}
