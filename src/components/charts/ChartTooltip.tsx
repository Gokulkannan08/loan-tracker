import { fmtFull } from "@/lib/loan-engine";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-card ring-1 ring-foreground/15 shadow-xl px-3 py-2.5 text-xs min-w-[140px]">
      {label !== undefined && (
        <p className="font-mono text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wide">
          FY {label}–{String(Number(label) + 1).slice(-2)}
        </p>
      )}
      {payload.map((p: { name: string; value: number; color: string }) => (
        <div key={p.name} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="font-mono ml-auto pl-3">{fmtFull(p.value)}</span>
        </div>
      ))}
    </div>
  );
}
