import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip } from "recharts";
import { fmt, fmtFull } from "@/lib/loan-engine";
import { C } from "@/lib/palette";

interface DonutChartProps {
  principal: number;
  interest: number;
}

export function DonutChart({ principal, interest }: DonutChartProps) {
  const total = principal + interest;
  const slices = [
    { name: "Principal", value: principal, color: C.sky },
    { name: "Interest",  value: interest,  color: C.amber },
  ];

  return (
    <div className="flex items-center gap-4 sm:gap-6">
      <div className="shrink-0">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie
              data={slices} cx="50%" cy="50%"
              innerRadius={30} outerRadius={52}
              dataKey="value" strokeWidth={0} paddingAngle={3}
            >
              {slices.map((s, i) => <Cell key={i} fill={s.color} />)}
            </Pie>
            <RTooltip
              formatter={(v) => fmtFull(v as number)}
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 11,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-1 space-y-3">
        {slices.map((s) => (
          <div key={s.name}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                {s.name}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {total > 0 ? ((s.value / total) * 100).toFixed(1) : "0"}%
              </span>
            </div>
            <p className="text-sm font-bold font-mono" style={{ color: s.color }}>{fmt(s.value)}</p>
          </div>
        ))}
        <div className="pt-2.5 border-t border-border">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Total</p>
          <p className="text-sm font-bold font-mono">{fmt(total)}</p>
        </div>
      </div>
    </div>
  );
}
