import { Card, CardContent } from "@/components/ui/card";

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  badge?: string;
  badgeGood?: boolean;
}

export function KpiCard({ label, value, sub, color, badge, badgeGood }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4 px-4">
        <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-2 font-medium">
          {label}
        </p>
        <p className="text-xl sm:text-2xl font-bold font-mono leading-none" style={{ color }}>
          {value}
        </p>
        <div className="flex items-center gap-2 mt-2 min-h-[16px]">
          {sub && <span className="text-[11px] text-muted-foreground">{sub}</span>}
          {badge && (
            <span
              className={`ml-auto text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                badgeGood
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-rose-500/15 text-rose-400"
              }`}
            >
              {badgeGood ? "↓ " : "↑ "}{badge}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
