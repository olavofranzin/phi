import { cn } from "@/lib/utils";
import { STATUS_LABEL, STATUS_VAR, type CampaignStatus } from "@/lib/phi/types";

interface StatusBadgeProps {
  status: CampaignStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StatusBadge({ status, size = "sm", className }: StatusBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-wide",
        sizeClasses,
        className,
      )}
      style={{
        color: STATUS_VAR[status],
        backgroundColor: `color-mix(in srgb, ${STATUS_VAR[status]} 14%, transparent)`,
        borderColor: `color-mix(in srgb, ${STATUS_VAR[status]} 35%, transparent)`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: STATUS_VAR[status] }}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}
