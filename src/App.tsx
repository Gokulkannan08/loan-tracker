import { useState, useMemo, useEffect } from "react";
import {
  pmt, buildSchedule, computeTotals, computeRegCosts, computeFYData,
  type LoanType, type PropertyType, type ScheduleRow,
} from "@/lib/loan-engine";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { IconMenu2, IconSun, IconMoon } from "@tabler/icons-react";
import { fmt, fmtFull } from "@/lib/loan-engine";
import { C } from "@/lib/palette";
import { SidebarForm } from "@/features/inputs/SidebarForm";
import { DashboardTab } from "@/features/dashboard/DashboardTab";
import { AmortizationTab } from "@/features/amortization/AmortizationTab";
import { TaxTab } from "@/features/tax/TaxTab";
import type { AnnualPoint } from "@/components/charts/AnnualBarChart";

// ─── Topbar stat ──────────────────────────────────────────────────────────────
function TopStat({
  label, value, color, separator = true,
}: { label: string; value: string; color?: string; separator?: boolean }) {
  return (
    <>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground hidden sm:inline">{label}</span>
        <span className="text-sm font-bold font-mono" style={{ color: color || "inherit" }}>{value}</span>
      </div>
      {separator && <div className="w-px h-4 bg-border shrink-0" />}
    </>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// APP — state + computed values + layout shell only
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function App() {
  // ─── Theme ──────────────────────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  // ─── Mobile sidebar ──────────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setSidebarOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ─── Loan state ──────────────────────────────────────────────────────────────
  const [loanAmt,       setLoanAmt]       = useState(5000000);
  const [annualRate,    setAnnualRate]    = useState(8.5);
  const [tenureYears,   setTenureYears]   = useState(20);
  const [tenureMonths,  setTenureMonths]  = useState(0);
  const [startDate,     setStartDate]     = useState("2026-04-01");
  const [loanType,      setLoanType]      = useState<LoanType>("floating");
  const [propertyType,  setPropertyType]  = useState<PropertyType>("self");
  const [coBorrowers,   setCoBorrowers]   = useState("1");
  const [taxBracket,    setTaxBracket]    = useState(30);
  const [monthlyExtra,  setMonthlyExtra]  = useState(0);
  const [lumpSum,       setLumpSum]       = useState(0);
  const [lumpSumMonth,  setLumpSumMonth]  = useState(12);
  const [strategy,      setStrategy]      = useState<"tenure" | "emi">("tenure");
  const [processingFee, setProcessingFee] = useState(1);
  const [fixedPenalty,  setFixedPenalty]  = useState(3);

  // ─── Derived ─────────────────────────────────────────────────────────────────
  const totalMonths    = tenureYears * 12 + tenureMonths;
  const monthlyRate    = annualRate / 100 / 12;
  const coBorrowersNum = parseInt(coBorrowers);
  const hasExtra       = monthlyExtra > 0 || lumpSum > 0;

  // ─── Engine ──────────────────────────────────────────────────────────────────
  const { standard, accelerated } = useMemo(() => ({
    standard:    buildSchedule(loanAmt, monthlyRate, totalMonths, startDate, false, 0, 0, 0),
    accelerated: buildSchedule(loanAmt, monthlyRate, totalMonths, startDate, true, monthlyExtra, lumpSum, lumpSumMonth),
  }), [loanAmt, monthlyRate, totalMonths, startDate, monthlyExtra, lumpSum, lumpSumMonth]);

  const totals   = useMemo(() => computeTotals(standard, accelerated), [standard, accelerated]);
  const regCosts = useMemo(() => computeRegCosts(loanAmt, processingFee, loanType, fixedPenalty, accelerated),
    [loanAmt, processingFee, loanType, fixedPenalty, accelerated]);

  const schedule = hasExtra ? accelerated : standard;

  const fyData = useMemo(
    () => computeFYData(schedule, propertyType, coBorrowersNum, taxBracket),
    [schedule, propertyType, coBorrowersNum, taxBracket],
  );

  const totalTaxSaved = fyData.reduce((s, d) => s + d.taxSaved, 0);

  const netEffRate = useMemo(() => {
    const netInt = totals.accInterest - totalTaxSaved;
    const avgBal = loanAmt / 2;
    const years  = totals.accMonths / 12;
    return years > 0 && avgBal > 0 ? (netInt / avgBal / years) * 100 : 0;
  }, [totals, totalTaxSaved, loanAmt]);

  const annualChartData = useMemo<AnnualPoint[]>(() => {
    const map: Record<number, AnnualPoint> = {};
    schedule.forEach((r: ScheduleRow) => {
      const fy = r.date.getMonth() >= 3 ? r.date.getFullYear() : r.date.getFullYear() - 1;
      if (!map[fy]) map[fy] = { fy, interest: 0, principal: 0 };
      map[fy].interest  += r.interest;
      map[fy].principal += r.principal;
    });
    return Object.values(map).sort((a, b) => a.fy - b.fy);
  }, [schedule]);

  const emi = pmt(monthlyRate, totalMonths, loanAmt);

  const byYear = useMemo(() => {
    const groups: { year: number; rows: ScheduleRow[] }[] = [];
    schedule.forEach((r) => {
      const yr = r.date.getFullYear();
      const last = groups[groups.length - 1];
      if (last && last.year === yr) last.rows.push(r);
      else groups.push({ year: yr, rows: [r] });
    });
    return groups;
  }, [schedule]);

  const maxIntDed  = propertyType === "self" ? 200000 * coBorrowersNum : Infinity;
  const maxPrinDed = 150000 * coBorrowersNum;

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — fixed overlay on mobile, static column on md+ */}
      <aside className={[
        "w-[268px] shrink-0 flex flex-col border-r border-border overflow-hidden bg-background",
        "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out",
        "md:static md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
      ].join(" ")}>
        <SidebarForm
          loanAmt={loanAmt}             setLoanAmt={setLoanAmt}
          annualRate={annualRate}       setAnnualRate={setAnnualRate}
          tenureYears={tenureYears}     setTenureYears={setTenureYears}
          tenureMonths={tenureMonths}   setTenureMonths={setTenureMonths}
          startDate={startDate}         setStartDate={setStartDate}
          loanType={loanType}           setLoanType={setLoanType}
          propertyType={propertyType}   setPropertyType={setPropertyType}
          coBorrowers={coBorrowers}     setCoBorrowers={setCoBorrowers}
          taxBracket={taxBracket}       setTaxBracket={setTaxBracket}
          monthlyExtra={monthlyExtra}   setMonthlyExtra={setMonthlyExtra}
          lumpSum={lumpSum}             setLumpSum={setLumpSum}
          lumpSumMonth={lumpSumMonth}   setLumpSumMonth={setLumpSumMonth}
          strategy={strategy}           setStrategy={setStrategy}
          processingFee={processingFee} setProcessingFee={setProcessingFee}
          fixedPenalty={fixedPenalty}   setFixedPenalty={setFixedPenalty}
          setSidebarOpen={setSidebarOpen}
        />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header className="h-12 shrink-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-5 border-b border-border">
          <button
            className="md:hidden p-1.5 -ml-0.5 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open inputs"
          >
            <IconMenu2 size={18} />
          </button>

          <TopStat label="EMI" value={fmtFull(emi)} color={C.primary} />
          <div className="hidden sm:flex items-center gap-3">
            <TopStat label="Interest" value={fmt(totals.accInterest)} color={C.amber} />
            <TopStat label="Payout"   value={fmt(totals.accTotal)}    color={C.sky} />
            <TopStat
              label="Tenure"
              value={`${Math.floor(totals.accMonths / 12)}y ${totals.accMonths % 12}m`}
              separator={hasExtra}
            />
            {hasExtra && (
              <TopStat label="Saved" value={fmt(totals.interestSaved)} color={C.emerald} separator={false} />
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden lg:flex items-center gap-1 text-[9px] text-muted-foreground font-mono tracking-wider">
              <span>RBI 2026</span><span className="mx-1 opacity-40">·</span><span>INR</span>
            </span>
            <button
              onClick={() => setIsDark((d) => !d)}
              className="p-1.5 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground"
              aria-label="Toggle theme"
            >
              {isDark ? <IconSun size={16} /> : <IconMoon size={16} />}
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="dashboard" className="flex flex-col gap-0">
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-3 sm:px-5 pt-2.5 pb-0">
              <TabsList variant="line">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="schedule">
                  Amortization
                  <span className="ml-1.5 text-[9px] font-mono text-muted-foreground hidden sm:inline">
                    {schedule.length}mo
                  </span>
                </TabsTrigger>
                <TabsTrigger value="tax">Tax &amp; Costs</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="dashboard">
              <DashboardTab
                emi={emi}
                annualRate={annualRate}
                loanType={loanType}
                loanAmt={loanAmt}
                totalMonths={totalMonths}
                totals={totals}
                hasExtra={hasExtra}
                annualChartData={annualChartData}
                propertyType={propertyType}
                coBorrowersNum={coBorrowersNum}
                taxBracket={taxBracket}
                totalTaxSaved={totalTaxSaved}
                netEffRate={netEffRate}
              />
            </TabsContent>

            <TabsContent value="schedule">
              <AmortizationTab
                schedule={schedule}
                byYear={byYear}
                hasExtra={hasExtra}
                emi={emi}
              />
            </TabsContent>

            <TabsContent value="tax">
              <TaxTab
                totals={totals}
                regCosts={regCosts}
                loanType={loanType}
                loanAmt={loanAmt}
                fixedPenalty={fixedPenalty}
                propertyType={propertyType}
                coBorrowersNum={coBorrowersNum}
                taxBracket={taxBracket}
                fyData={fyData}
                totalTaxSaved={totalTaxSaved}
                netEffRate={netEffRate}
                maxIntDed={maxIntDed}
                maxPrinDed={maxPrinDed}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
