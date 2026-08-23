import { useQuery } from "@tanstack/react-query";
import { CLIENT_DOSSIERS } from "@/lib/phi/clientMock";
import type { ClientDossier } from "@/lib/phi/clientTypes";

const STALE_MS = 5 * 60 * 1000;

/**
 * Single source of truth for client dossier data (read-only).
 * Today: returns static mock dossiers with simulated latency.
 * Tomorrow: swap the queryFn for a Notion/BigQuery-backed fetcher with the same shape.
 */
export function useClientData() {
  return useQuery<ClientDossier[]>({
    queryKey: ["phi", "clients"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 300));
      return CLIENT_DOSSIERS;
    },
    staleTime: STALE_MS,
    refetchOnWindowFocus: false,
  });
}
