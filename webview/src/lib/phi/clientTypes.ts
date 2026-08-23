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
