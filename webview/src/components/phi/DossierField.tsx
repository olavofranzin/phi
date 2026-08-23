import type { DossierFieldType } from "@/lib/phi/clientTypes";

interface DossierFieldProps {
  label: string;
  type: DossierFieldType;
  value?: string;
}

/** Read-only label -> value row for the client dossier. Never editable. */
export function DossierField({ label, type, value }: DossierFieldProps) {
  const v = value?.trim();

  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[minmax(0,180px)_1fr] sm:gap-4">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm">
        {!v ? (
          <span className="text-muted-foreground">N/D</span>
        ) : type === "url" ? (
          <a
            href={v}
            target="_blank"
            rel="noreferrer"
            className="break-all text-primary underline underline-offset-4 hover:opacity-80"
          >
            {v}
          </a>
        ) : type === "email" ? (
          <a
            href={`mailto:${v}`}
            className="break-all text-primary underline underline-offset-4 hover:opacity-80"
          >
            {v}
          </a>
        ) : type === "tel" ? (
          <a
            href={`tel:${v.replace(/[^\d+]/g, "")}`}
            className="text-primary underline underline-offset-4 hover:opacity-80"
          >
            {v}
          </a>
        ) : type === "textarea" ? (
          <span className="whitespace-pre-line leading-relaxed">{v}</span>
        ) : (
          <span>{v}</span>
        )}
      </dd>
    </div>
  );
}
