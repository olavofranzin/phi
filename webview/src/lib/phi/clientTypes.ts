export type DossierFieldType = "text" | "url" | "textarea" | "email" | "tel";

export interface DossierFieldDef {
  key: string;
  label: string;
  type: DossierFieldType;
}

export interface DossierSection {
  id: string;
  index: string;
  title: string;
  subtitle: string;
  fields: DossierFieldDef[];
}

export interface ClientDossier {
  /** Matches Campaign.client */
  client: string;
  /** field key -> value. Empty/missing = N/D */
  fields: Record<string, string>;
}

/** Cadastro real do cliente vindo do Notion (base Clientes). */
export interface ClientRecord {
  clientId: string | null;
  num: string | null;
  name: string | null;
  status?: string | null;
  sla?: string | null;
  riscoChurn?: string | null;
  canalAquisicao?: string | null;
  email?: string | null;
  fone?: string | null;
  endereco?: string | null;
  site?: string | null;
  cnpj?: string | null;
  segmento?: string | null;
  servicos?: string[];
  ticketLtv?: number | null;
  margem?: number | null;
  nps?: number | null;
  inicioContrato?: string | null;
  terminoContrato?: string | null;
}
