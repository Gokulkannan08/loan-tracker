import { Card } from "@/components/ui/card";
import { fmtFull, type ScheduleRow } from "@/lib/loan-engine";

// Static thead — hoisted at module level to avoid recreation on every render
const tableHead = (
  <thead className="sticky top-0 z-10">
    <tr className="bg-card border-b border-border">
      {([
        ["#",         "w-8",                 "text-left"],
        ["Date",      "",                    "text-left"],
        ["Opening",   "hidden sm:table-cell","text-right"],
        ["EMI",       "",                    "text-right"],
        ["Extra",     "hidden sm:table-cell","text-right"],
        ["Interest",  "",                    "text-right text-amber-400/60"],
        ["Principal", "",                    "text-right text-sky-400/60"],
        ["Balance",   "",                    "text-right"],
      ] as const).map(([h, w, cls]) => (
        <th key={h} className={`px-2 sm:px-3 py-2 text-[9px] uppercase tracking-[0.12em] text-muted-foreground font-medium ${w} ${cls}`}>
          {h}
        </th>
      ))}
    </tr>
  </thead>
);

interface AmortizationTabProps {
  schedule: ScheduleRow[];
  byYear: { year: number; rows: ScheduleRow[] }[];
  hasExtra: boolean;
  emi: number;
}

export function AmortizationTab({ schedule, byYear, hasExtra, emi }: AmortizationTabProps) {
  return (
    <div className="p-3 sm:p-5 text-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] text-muted-foreground">
          {schedule.length} periods · Reducing Balance ·{" "}
          <span className={hasExtra ? "text-emerald-400 font-medium" : ""}>
            {hasExtra ? "Accelerated" : "Standard Schedule"}
          </span>
        </p>
        <p className="text-[10px] font-mono text-muted-foreground hidden sm:block">
          EMI: {fmtFull(emi)}
        </p>
      </div>

      <Card>
        <div className="overflow-auto max-h-[calc(100vh-180px)]">
          <table className="w-full border-collapse text-[11px] min-w-[560px]">
            {tableHead}
            <tbody>
              {byYear.flatMap(({ year, rows }) => [
                <tr key={`yr-${year}`}>
                  <td colSpan={8} className="px-2 sm:px-3 py-1 bg-muted/20">
                    <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-primary/60">{year}</span>
                  </td>
                </tr>,
                ...rows.map((r: ScheduleRow) => (
                  <tr key={r.period} className="border-b border-border/40 hover:bg-muted/25 transition-colors">
                    <td className="px-2 sm:px-3 py-1.5 text-muted-foreground/50 font-mono">{r.period}</td>
                    <td className="px-2 sm:px-3 py-1.5 text-muted-foreground font-mono">
                      {r.date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })}
                    </td>
                    <td className="px-2 sm:px-3 py-1.5 text-right font-mono hidden sm:table-cell">{fmtFull(r.openBal)}</td>
                    <td className="px-2 sm:px-3 py-1.5 text-right font-mono">{fmtFull(r.scheduled)}</td>
                    <td className={`px-2 sm:px-3 py-1.5 text-right font-mono hidden sm:table-cell ${r.extra > 0 ? "text-emerald-400" : "text-muted-foreground/30"}`}>
                      {r.extra > 0 ? fmtFull(r.extra) : "–"}
                    </td>
                    <td className="px-2 sm:px-3 py-1.5 text-right font-mono text-amber-400">{fmtFull(r.interest)}</td>
                    <td className="px-2 sm:px-3 py-1.5 text-right font-mono text-sky-400">{fmtFull(r.principal)}</td>
                    <td className={`px-2 sm:px-3 py-1.5 text-right font-mono ${r.closeBal < 1 ? "text-emerald-400 font-bold" : ""}`}>
                      {r.closeBal < 1 ? "₹0 ✓" : fmtFull(r.closeBal)}
                    </td>
                  </tr>
                )),
              ])}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
