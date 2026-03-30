import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  ResponsiveContainer, Tooltip as RTooltip,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import { C } from "@/lib/palette";

export interface AnnualPoint {
  fy: number;
  interest: number;
  principal: number;
}

interface AnnualBarChartProps {
  data: AnnualPoint[];
}

export function AnnualBarChart({ data }: AnnualBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={196}>
      <BarChart data={data} margin={{ top: 6, right: 4, left: -24, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid strokeDasharray="2 4" stroke="oklch(1 0 0 / 5%)" vertical={false} />
        <XAxis
          dataKey="fy"
          tick={{ fontSize: 9, fill: C.muted, fontFamily: "'JetBrains Mono', monospace" }}
          tickFormatter={(v: number) => `'${String(v).slice(-2)}`}
          axisLine={false} tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 9, fill: C.muted, fontFamily: "'JetBrains Mono', monospace" }}
          tickFormatter={(v: number) => v >= 1e5 ? `${(v / 1e5).toFixed(0)}L` : String(v)}
          axisLine={false} tickLine={false}
        />
        <RTooltip content={<ChartTooltip />} cursor={{ fill: "oklch(1 0 0 / 4%)" }} />
        <Bar dataKey="interest"  stackId="a" fill={C.amber} name="Interest"  radius={[0, 0, 0, 0]} />
        <Bar dataKey="principal" stackId="a" fill={C.sky}   name="Principal" radius={[3, 3, 0, 0]} />
        <Legend
          wrapperStyle={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
          iconType="circle"
          iconSize={7}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
