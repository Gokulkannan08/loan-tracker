import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/KpiCard";
import { MiniBar } from "@/components/MiniBar";
import { fmt, fmtFull, type LoanType, type PropertyType, type Totals, type RegCosts, type FYRow } from "@/lib/loan-engine";
import { C } from "@/lib/palette";

// Static thead — hoisted at module level
const tableHead = (
  <thead className="sticky top-0 bg-card z-10">
    <tr className="border-b border-border">
      {([
        ["FY",             "text-left"],
        ["Interest Paid",  "text-right text-amber-400/60"],
        ["§24(b) Ded.",    "text-right text-emerald-400/60"],
        ["Cap Used",       "text-right"],
        ["Principal Paid", "text-right text-sky-400/60"],
        ["§80C Ded.",      "text-right text-emerald-400/60"],
        ["Cap Used",       "text-right"],
        ["Tax Saved",      "text-right text-violet-400/60"],
      ] as const).map(([h, cls], i) => (
        <th key={i} className={`px-2 sm:px-3 py-2 text-[9px] uppercase tracking-[0.12em] text-muted-foreground font-medium ${cls}`}>
          {h}
        </th>
      ))}
    </tr>
  </thead>
);

interface TaxTabProps {
  totals: Totals;
  regCosts: RegCosts;
  loanType: LoanType;
  loanAmt: number;
  fixedPenalty: number;
  propertyType: PropertyType;
  coBorrowersNum: number;
  taxBracket: number;
  fyData: FYRow[];
  totalTaxSaved: number;
  netEffRate: number;
  maxIntDed: number;
  maxPrinDed: number;
}

export function TaxTab({
  regCosts, loanType, loanAmt, fixedPenalty,
  propertyType, coBorrowersNum, taxBracket,
  fyData, totalTaxSaved, netEffRate, maxIntDed, maxPrinDed,
}: TaxTabProps) {
  return (
    <div className="p-3 sm:p-5 space-y-4 text-sm">

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <KpiCard
          label="§24(b) Cap / yr"
          value={propertyType === "self" ? fmt(200000 * coBorrowersNum) : "∞ Unlimited"}
          sub={coBorrowersNum === 2 ? "Joint deduction" : "Single borrower"}
          color={C.emerald}
        />
        <KpiCard label="§80C Cap / yr"      value={fmt(150000 * coBorrowersNum)}  sub="Principal repayment"  color={C.sky} />
        <KpiCard label="Total Tax Saved"    value={fmt(totalTaxSaved)}            sub={`At ${taxBracket}% bracket`} color={C.violet} />
        <KpiCard label="Net Effective Rate" value={`${netEffRate.toFixed(2)}%`}   sub="After tax deductions" color={C.amber} />
      </div>

      {/* Friction costs + RBI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Initial Friction Costs</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Processing Fee",                                  base: regCosts.procFee,    gst: regCosts.procGST,   total: regCosts.procTotal   },
              { label: `CERSAI (${loanAmt <= 500000 ? "≤5L" : ">5L"})`, base: regCosts.cersaiBase, gst: regCosts.cersaiGST, total: regCosts.cersaiTotal },
            ].map((item) => (
              <div key={item.label} className="rounded-md bg-muted/20 p-3 space-y-1.5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{item.label}</p>
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Base</span>
                  <span className="font-mono">{fmtFull(item.base)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">+ 18% GST</span>
                  <span className="font-mono text-rose-400">{fmtFull(item.gst)}</span>
                </div>
                <div className="flex justify-between text-[11px] pt-1.5 border-t border-border font-semibold">
                  <span>Total</span>
                  <span className="font-mono">{fmtFull(item.total)}</span>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center bg-primary/10 border border-primary/20 rounded-md px-3 py-2.5">
              <span className="text-[11px] font-semibold">Total Initial Outflow</span>
              <span className="font-mono font-bold text-primary">{fmtFull(regCosts.totalInitial)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Preclosure Rules · RBI 2026</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2 h-2 rounded-full ${loanType === "floating" ? "bg-emerald-400" : "bg-rose-400"}`} />
              <span className="text-sm font-semibold">{loanType === "floating" ? "Floating Rate" : "Fixed Rate"}</span>
            </div>
            {loanType === "floating" ? (
              <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 p-3.5">
                <p className="text-[11px] text-emerald-300/80 leading-relaxed">
                  <span className="text-emerald-400 font-semibold">Zero penalty</span> — RBI Directions 2025 (effective Jan 1 2026) mandate no preclosure charges for floating-rate individual home loans.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                  Fixed-rate: <span className="text-rose-400 font-semibold">{fixedPenalty}%</span> on outstanding principal + 18% GST.
                </p>
                <div className="space-y-1.5 rounded-md bg-muted/20 p-3">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Penalty Base</span>
                    <span className="font-mono">{fmtFull(regCosts.preclosurePenalty)}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">+ 18% GST</span>
                    <span className="font-mono text-rose-400">{fmtFull(regCosts.preclosureGST)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] pt-1.5 border-t border-border font-semibold">
                    <span>Total Penalty</span>
                    <span className="font-mono text-rose-400">{fmtFull(regCosts.preclosureTotal)}</span>
                  </div>
                </div>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground/70 leading-relaxed mt-3 pt-3 border-t border-border">
              Penal charges for missed EMIs must be flat and transparent — cannot be capitalised into principal.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* FY Tax Shield Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Tax Shield by Financial Year · {taxBracket}% · {coBorrowersNum === 2 ? "Joint (2×)" : "Single"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-[420px]">
            <table className="w-full border-collapse text-[11px] min-w-[600px]">
              {tableHead}
              <tbody>
                {fyData.map((d, i) => {
                  const intPct  = maxIntDed === Infinity ? 100 : (d.interest  / maxIntDed)  * 100;
                  const prinPct =                               (d.principal / maxPrinDed) * 100;
                  return (
                    <tr
                      key={d.fy}
                      className={`border-b border-border/40 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-muted/5"}`}
                    >
                      <td className="px-2 sm:px-3 py-2 font-mono font-semibold text-muted-foreground">
                        FY{d.fy}–{(d.fy + 1).toString().slice(-2)}
                      </td>
                      <td className="px-2 sm:px-3 py-2 text-right font-mono text-amber-400">{fmtFull(d.interest)}</td>
                      <td className="px-2 sm:px-3 py-2 text-right font-mono text-emerald-400">{fmtFull(d.intDed)}</td>
                      <td className="px-2 sm:px-3 py-2 text-right"><MiniBar pct={intPct}  color={C.emerald} /></td>
                      <td className="px-2 sm:px-3 py-2 text-right font-mono text-sky-400">{fmtFull(d.principal)}</td>
                      <td className="px-2 sm:px-3 py-2 text-right font-mono text-emerald-400">{fmtFull(d.prinDed)}</td>
                      <td className="px-2 sm:px-3 py-2 text-right"><MiniBar pct={prinPct} color={C.sky} /></td>
                      <td className="px-2 sm:px-3 py-2 text-right font-mono text-violet-400 font-semibold">{fmtFull(d.taxSaved)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
