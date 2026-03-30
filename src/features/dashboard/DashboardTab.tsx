import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/KpiCard";
import { DonutChart } from "@/components/charts/DonutChart";
import { AnnualBarChart, type AnnualPoint } from "@/components/charts/AnnualBarChart";
import { fmt, fmtFull, type LoanType, type PropertyType, type Totals } from "@/lib/loan-engine";
import { C } from "@/lib/palette";

interface DashboardTabProps {
  emi: number;
  annualRate: number;
  loanType: LoanType;
  loanAmt: number;
  totalMonths: number;
  totals: Totals;
  hasExtra: boolean;
  annualChartData: AnnualPoint[];
  propertyType: PropertyType;
  coBorrowersNum: number;
  taxBracket: number;
  totalTaxSaved: number;
  netEffRate: number;
}

export function DashboardTab({
  emi, annualRate, loanType, loanAmt, totalMonths,
  totals, hasExtra, annualChartData,
  propertyType, coBorrowersNum, taxBracket, totalTaxSaved, netEffRate,
}: DashboardTabProps) {
  return (
    <div className="p-3 sm:p-5 space-y-4 text-sm">

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <KpiCard
          label="Monthly EMI"
          value={fmtFull(emi)}
          sub={`${annualRate}% · ${loanType}`}
          color={C.primary}
        />
        <KpiCard
          label="Total Interest"
          value={fmt(totals.accInterest)}
          sub={hasExtra ? `Std: ${fmt(totals.stdInterest)}` : "Reducing balance"}
          color={C.amber}
          badge={hasExtra ? fmt(totals.interestSaved) : undefined}
          badgeGood
        />
        <KpiCard
          label="Total Payout"
          value={fmt(totals.accTotal)}
          sub={`Principal: ${fmt(loanAmt)}`}
          color={C.sky}
        />
        <KpiCard
          label="Tenure"
          value={`${Math.floor(totals.accMonths / 12)}y ${totals.accMonths % 12}m`}
          sub={hasExtra
            ? `of ${Math.floor(totals.stdMonths / 12)}y ${totals.stdMonths % 12}m`
            : `${totalMonths} total months`}
          badge={hasExtra ? `${totals.monthsSaved}mo` : undefined}
          badgeGood
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Principal vs Interest</CardTitle></CardHeader>
          <CardContent>
            <DonutChart principal={totals.accPrincipal} interest={totals.accInterest} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Annual Breakdown (FY)</CardTitle></CardHeader>
          <CardContent>
            {annualChartData.length > 0 && <AnnualBarChart data={annualChartData} />}
          </CardContent>
        </Card>
      </div>

      {/* Scenario comparison */}
      {hasExtra && (
        <Card>
          <CardHeader><CardTitle>Scenario Comparison</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-[1fr_1px_1fr_1px_1fr] gap-0">
              <div className="space-y-2 pr-3 sm:pr-5">
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-3">Metric</p>
                {["Total Interest", "Total Payout", "Tenure"].map((l) => (
                  <p key={l} className="text-[11px] text-muted-foreground h-5 flex items-center">{l}</p>
                ))}
              </div>
              <div className="bg-border" />
              <div className="space-y-2 px-3 sm:px-5">
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-3">Standard</p>
                <p className="text-[11px] font-mono h-5 flex items-center">{fmt(totals.stdInterest)}</p>
                <p className="text-[11px] font-mono h-5 flex items-center">{fmt(totals.stdTotal)}</p>
                <p className="text-[11px] font-mono h-5 flex items-center">{Math.floor(totals.stdMonths / 12)}y {totals.stdMonths % 12}m</p>
              </div>
              <div className="bg-border" />
              <div className="space-y-2 pl-3 sm:pl-5">
                <p className="text-[9px] uppercase tracking-widest text-emerald-400 mb-3">Accelerated ✓</p>
                <p className="text-[11px] font-mono text-emerald-400 h-5 flex items-center">{fmt(totals.accInterest)}</p>
                <p className="text-[11px] font-mono text-emerald-400 h-5 flex items-center">{fmt(totals.accTotal)}</p>
                <p className="text-[11px] font-mono text-emerald-400 h-5 flex items-center">{Math.floor(totals.accMonths / 12)}y {totals.accMonths % 12}m</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between bg-emerald-500/10 rounded-md px-3 sm:px-4 py-2.5 border border-emerald-500/15">
                <span className="text-[11px] text-emerald-300/70">Interest Saved</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{fmt(totals.interestSaved)}</span>
              </div>
              <div className="flex items-center justify-between bg-emerald-500/10 rounded-md px-3 sm:px-4 py-2.5 border border-emerald-500/15">
                <span className="text-[11px] text-emerald-300/70">Months Saved</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{totals.monthsSaved} mo</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tax preview */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Shield Preview · {taxBracket}% Bracket</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: "§24(b) Cap / yr", value: propertyType === "self" ? fmt(200000 * coBorrowersNum) : "Unlimited", color: C.emerald },
              { label: "§80C Cap / yr",   value: fmt(150000 * coBorrowersNum), color: C.sky },
              { label: "Total Tax Saved", value: fmt(totalTaxSaved),           color: C.violet },
              { label: "Net Eff. Rate",   value: `${netEffRate.toFixed(2)}%`,  color: C.amber },
            ].map((p) => (
              <div key={p.label} className="rounded-md bg-muted/20 px-3 py-2.5">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">{p.label}</p>
                <p className="font-mono font-bold text-base" style={{ color: p.color }}>{p.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
