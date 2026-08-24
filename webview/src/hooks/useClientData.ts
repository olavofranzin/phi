import { useQuery } from "@tanstack/react-query";
import type { ClientRecord } from "@/lib/phi/clientTypes";

const STALE_MS = 5 * 60 * 1000;
const API_BASE = import.meta.env.VITE_PHI_API_BASE ?? "";

/**
 * Cadastro real dos clientes (Notion Clientes), via backend. View-only.
 * Em erro/sem token, o backend devolve lista vazia (a UI mostra estado vazio).
 */
export function useClientData() {
  return useQuery<ClientRecord[]>({
    queryKey: ["phi", "clients"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/clients`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`clients ${res.status}: ${body.slice(0, 200)}`);
      }
      return (await res.json()) as ClientRecord[];
    },
    staleTime: STALE_MS,
    refetchOnWindowFocus: false,
  });
}
