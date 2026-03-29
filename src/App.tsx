import { useState, useMemo } from "react";
import {
  fmt, fmtFull, pmt,
  buildSchedule, computeTotals, computeRegCosts, computeFYData,
  type LoanType, type PropertyType, type ScheduleRow,
} from "@/lib/loan-engine";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  Tooltip as RTooltip,
} from "recharts";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  primary: "#d95f2e",
  sky:     "#38bdf8",
  emerald: "#34d399",
  amber:   "#fbbf24",
  violet:  "#a78bfa",
  rose:    "#fb7185",
  muted:   "#64748b",
} as const;

// ─── Sidebar section divider ───────────────────────────────────────────────────
function SideSection({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mt-5 mb-3 first:mt-0">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-primary">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

// ─── Sidebar form field ────────────────────────────────────────────────────────
function SideField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <Label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
        {label}
      </Label>
      <div className="relative">{children}</div>
    </div>
  );
}

// ─── Suffix badge inside an input ─────────────────────────────────────────────
function InputSuffix({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none font-mono select-none">
      {children}
    </span>
  );
}

// ─── Topbar stat ──────────────────────────────────────────────────────────────
function TopStat({
  label, value, color, separator = true,
}: { label: string; value: string; color?: string; separator?: boolean }) {
  return (
    <>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className="text-sm font-bold font-mono" style={{ color: color || "inherit" }}>{value}</span>
      </div>
      {separator && <div className="w-px h-4 bg-border shrink-0" />}
    </>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, color, badge, badgeGood,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  badge?: string;
  badgeGood?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4 px-4">
        <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-2 font-medium">
          {label}
        </p>
        <p className="text-2xl font-bold font-mono leading-none" style={{ color }}>
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

// ─── Custom chart tooltip ──────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
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

// ─── Donut chart ───────────────────────────────────────────────────────────────
function DonutChart({ principal, interest }: { principal: number; interest: number }) {
  const total = principal + interest;
  const slices = [
    { name: "Principal", value: principal, color: C.sky },
    { name: "Interest",  value: interest,  color: C.amber },
  ];

  return (
    <div className="flex items-center gap-6">
      <div className="shrink-0">
        <ResponsiveContainer width={130} height={130}>
          <PieChart>
            <Pie
              data={slices} cx="50%" cy="50%"
              innerRadius={34} outerRadius={56}
              dataKey="value" strokeWidth={0} paddingAngle={3}
            >
              {slices.map((s, i) => <Cell key={i} fill={s.color} />)}
            </Pie>
            <RTooltip
              formatter={(v) => fmtFull(v as number)}
              contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }}
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

// ─── Annual bar chart ──────────────────────────────────────────────────────────
interface AnnualPoint { fy: number; interest: number; principal: number }

function AnnualBarChart({ data }: { data: AnnualPoint[] }) {
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
        <Bar dataKey="interest"  stackId="a" fill={C.amber}  name="Interest"   radius={[0, 0, 0, 0]} />
        <Bar dataKey="principal" stackId="a" fill={C.sky}    name="Principal"  radius={[3, 3, 0, 0]} />
        <Legend wrapperStyle={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} iconType="circle" iconSize={7} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Mini progress bar ─────────────────────────────────────────────────────────
function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5 justify-end">
      <div className="w-14 h-1.5 bg-muted/50 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct).toFixed(0)}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground w-7 text-right">{Math.min(100, pct).toFixed(0)}%</span>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN APP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function App() {
  // ─── State ──────────────────────────────────────────────────────────────────
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
  const regCosts = useMemo(() => computeRegCosts(loanAmt, processingFee, loanType, fixedPenalty, accelerated), [loanAmt, processingFee, loanType, fixedPenalty, accelerated]);

  const schedule       = hasExtra ? accelerated : standard;
  const fyData         = useMemo(() => computeFYData(schedule, propertyType, coBorrowersNum, taxBracket), [schedule, propertyType, coBorrowersNum, taxBracket]);
  const totalTaxSaved  = fyData.reduce((s, d) => s + d.taxSaved, 0);

  const netEffRate = useMemo(() => {
    const netInt = totals.accInterest - totalTaxSaved;
    const avgBal = loanAmt / 2;
    const years  = totals.accMonths / 12;
    return years > 0 && avgBal > 0 ? (netInt / avgBal / years) * 100 : 0;
  }, [totals, totalTaxSaved, loanAmt]);

  const annualChartData = useMemo(() => {
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

  // Group schedule rows by calendar year for table
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

  // Tax deduction caps for FY utilization bars
  const maxIntDed  = propertyType === "self" ? 200000 * coBorrowersNum : Infinity;
  const maxPrinDed = 150000 * coBorrowersNum;

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">

      {/* ══════════════════════════════ SIDEBAR ══════════════════════════════ */}
      <aside className="w-[268px] shrink-0 flex flex-col border-r border-border overflow-hidden">

        {/* Logo strip */}
        <div className="h-12 shrink-0 flex items-center gap-2 px-4 border-b border-border">
          <span className="text-primary font-bold text-xl font-mono leading-none">₹</span>
          <div>
            <p className="text-[13px] font-semibold tracking-tight leading-none">Loan Tracker</p>
            <p className="text-[9px] text-muted-foreground tracking-wider mt-0.5">Indian · INR · FY Apr–Mar</p>
          </div>
        </div>

        {/* Input scroll area */}
        <div className="flex-1 overflow-y-auto px-4 py-3">

          {/* ── LOAN ── */}
          <SideSection label="Loan" />

          <SideField label="Loan Amount">
            <Input
              type="number" value={loanAmt}
              onChange={(e) => setLoanAmt(+e.target.value)}
              className="font-mono pr-6"
            />
            <InputSuffix>₹</InputSuffix>
          </SideField>

          <SideField label="Annual Rate">
            <Input
              type="number" step="0.1" value={annualRate}
              onChange={(e) => setAnnualRate(+e.target.value)}
              className="font-mono pr-5"
            />
            <InputSuffix>%</InputSuffix>
          </SideField>

          <div className="grid grid-cols-2 gap-2">
            <SideField label="Years">
              <Input type="number" value={tenureYears} onChange={(e) => setTenureYears(+e.target.value)} className="font-mono" />
            </SideField>
            <SideField label="Months">
              <Input type="number" value={tenureMonths} onChange={(e) => setTenureMonths(+e.target.value)} className="font-mono" />
            </SideField>
          </div>

          <div className="mb-3">
            <DatePicker label="Start Date" value={startDate} onChange={setStartDate} />
          </div>

          <SideField label="Rate Type">
            <ToggleGroup
              type="single" value={loanType}
              onValueChange={(v) => v && setLoanType(v as LoanType)}
              className="w-full"
            >
              <ToggleGroupItem value="floating" className="flex-1 text-[11px]">Floating</ToggleGroupItem>
              <ToggleGroupItem value="fixed"    className="flex-1 text-[11px]">Fixed</ToggleGroupItem>
            </ToggleGroup>
          </SideField>

          {/* ── TAX PROFILE ── */}
          <SideSection label="Tax Profile" />

          <SideField label="Property Type">
            <Select value={propertyType} onValueChange={(v) => setPropertyType(v as PropertyType)}>
              <SelectTrigger className="w-full h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="self">Self-Occupied</SelectItem>
                <SelectItem value="letout">Let-Out</SelectItem>
              </SelectContent>
            </Select>
          </SideField>

          <SideField label="Co-Borrowers">
            <ToggleGroup
              type="single" value={coBorrowers}
              onValueChange={(v) => v && setCoBorrowers(v)}
              className="w-full"
            >
              <ToggleGroupItem value="1" className="flex-1 text-[11px]">Single</ToggleGroupItem>
              <ToggleGroupItem value="2" className="flex-1 text-[11px]">Joint 2×</ToggleGroupItem>
            </ToggleGroup>
          </SideField>

          <SideField label="Tax Bracket">
            <Input
              type="number" value={taxBracket}
              onChange={(e) => setTaxBracket(+e.target.value)}
              className="font-mono pr-5"
            />
            <InputSuffix>%</InputSuffix>
          </SideField>

          {/* ── PREPAYMENT ── */}
          <SideSection label="Prepayment" />

          <SideField label="Monthly Extra">
            <Input
              type="number" value={monthlyExtra}
              onChange={(e) => setMonthlyExtra(+e.target.value)}
              className="font-mono pr-6"
            />
            <InputSuffix>₹</InputSuffix>
          </SideField>

          <SideField label="Lump Sum">
            <Input
              type="number" value={lumpSum}
              onChange={(e) => setLumpSum(+e.target.value)}
              className="font-mono pr-6"
            />
            <InputSuffix>₹</InputSuffix>
          </SideField>

          <SideField label="Lump Sum at Month">
            <Input type="number" value={lumpSumMonth} onChange={(e) => setLumpSumMonth(+e.target.value)} className="font-mono" />
          </SideField>

          <SideField label="Strategy">
            <ToggleGroup
              type="single" value={strategy}
              onValueChange={(v) => v && setStrategy(v as "tenure" | "emi")}
              className="w-full"
            >
              <ToggleGroupItem value="tenure" className="flex-1 text-[11px]">Tenure</ToggleGroupItem>
              <ToggleGroupItem value="emi"    className="flex-1 text-[11px]">EMI</ToggleGroupItem>
            </ToggleGroup>
          </SideField>

          {/* ── FEES ── */}
          <SideSection label="Fees" />

          <SideField label="Processing Fee">
            <Input
              type="number" step="0.1" value={processingFee}
              onChange={(e) => setProcessingFee(+e.target.value)}
              className="font-mono pr-5"
            />
            <InputSuffix>%</InputSuffix>
          </SideField>

          {loanType === "fixed" && (
            <SideField label="Preclosure Penalty">
              <Input
                type="number" value={fixedPenalty}
                onChange={(e) => setFixedPenalty(+e.target.value)}
                className="font-mono pr-5"
              />
              <InputSuffix>%</InputSuffix>
            </SideField>
          )}

          <div className="h-6" />
        </div>
      </aside>

      {/* ════════════════════════════ MAIN AREA ══════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header className="h-12 shrink-0 flex items-center gap-4 px-5 border-b border-border">
          <TopStat label="EMI"     value={fmtFull(emi)}             color={C.primary} />
          <TopStat label="Interest" value={fmt(totals.accInterest)} color={C.amber} />
          <TopStat label="Payout"   value={fmt(totals.accTotal)}    color={C.sky} />
          <TopStat
            label="Tenure"
            value={`${Math.floor(totals.accMonths / 12)}y ${totals.accMonths % 12}m`}
            separator={hasExtra}
          />
          {hasExtra && (
            <TopStat
              label="Saved"
              value={fmt(totals.interestSaved)}
              color={C.emerald}
              separator={false}
            />
          )}
          <div className="ml-auto flex items-center gap-1 text-[9px] text-muted-foreground font-mono tracking-wider">
            <span>RBI 2026</span>
            <span className="mx-1 opacity-40">·</span>
            <span>INR</span>
          </div>
        </header>

        {/* Tab area */}
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="dashboard" className="flex flex-col gap-0">

            {/* Tab nav */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-5 pt-2.5 pb-0">
              <TabsList variant="line">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="schedule">
                  Amortization
                  <span className="ml-1.5 text-[9px] font-mono text-muted-foreground">
                    {schedule.length}mo
                  </span>
                </TabsTrigger>
                <TabsTrigger value="tax">Tax &amp; Costs</TabsTrigger>
              </TabsList>
            </div>

            {/* ══ DASHBOARD ══════════════════════════════════════════════════ */}
            <TabsContent value="dashboard" className="p-5 space-y-4 text-sm">

              {/* KPIs */}
              <div className="grid grid-cols-4 gap-3">
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
                  sub={hasExtra ? `of ${Math.floor(totals.stdMonths / 12)}y ${totals.stdMonths % 12}m` : `${totalMonths} total months`}
                  badge={hasExtra ? `${totals.monthsSaved}mo` : undefined}
                  badgeGood
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle>Principal vs Interest</CardTitle></CardHeader>
                  <CardContent><DonutChart principal={totals.accPrincipal} interest={totals.accInterest} /></CardContent>
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
                      {/* Labels */}
                      <div className="space-y-2 pr-5">
                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-3">Metric</p>
                        {["Total Interest", "Total Payout", "Tenure"].map((l) => (
                          <p key={l} className="text-[11px] text-muted-foreground h-5 flex items-center">{l}</p>
                        ))}
                      </div>
                      <div className="bg-border" />
                      {/* Standard */}
                      <div className="space-y-2 px-5">
                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-3">Standard</p>
                        <p className="text-[11px] font-mono h-5 flex items-center">{fmt(totals.stdInterest)}</p>
                        <p className="text-[11px] font-mono h-5 flex items-center">{fmt(totals.stdTotal)}</p>
                        <p className="text-[11px] font-mono h-5 flex items-center">{Math.floor(totals.stdMonths / 12)}y {totals.stdMonths % 12}m</p>
                      </div>
                      <div className="bg-border" />
                      {/* Accelerated */}
                      <div className="space-y-2 pl-5">
                        <p className="text-[9px] uppercase tracking-widest text-emerald-400 mb-3">Accelerated ✓</p>
                        <p className="text-[11px] font-mono text-emerald-400 h-5 flex items-center">{fmt(totals.accInterest)}</p>
                        <p className="text-[11px] font-mono text-emerald-400 h-5 flex items-center">{fmt(totals.accTotal)}</p>
                        <p className="text-[11px] font-mono text-emerald-400 h-5 flex items-center">{Math.floor(totals.accMonths / 12)}y {totals.accMonths % 12}m</p>
                      </div>
                    </div>

                    {/* Savings strip */}
                    <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3">
                      <div className="flex items-center justify-between bg-emerald-500/10 rounded-md px-4 py-2.5 border border-emerald-500/15">
                        <span className="text-[11px] text-emerald-300/70">Interest Saved</span>
                        <span className="font-mono font-bold text-emerald-400 text-sm">{fmt(totals.interestSaved)}</span>
                      </div>
                      <div className="flex items-center justify-between bg-emerald-500/10 rounded-md px-4 py-2.5 border border-emerald-500/15">
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
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: "§24(b) Cap / yr", value: propertyType === "self" ? fmt(200000 * coBorrowersNum) : "Unlimited", color: C.emerald },
                      { label: "§80C Cap / yr",   value: fmt(150000 * coBorrowersNum),  color: C.sky },
                      { label: "Total Tax Saved",  value: fmt(totalTaxSaved),            color: C.violet },
                      { label: "Net Eff. Rate",    value: `${netEffRate.toFixed(2)}%`,   color: C.amber },
                    ].map((p) => (
                      <div key={p.label} className="rounded-md bg-muted/20 px-3 py-2.5">
                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">{p.label}</p>
                        <p className="font-mono font-bold text-base" style={{ color: p.color }}>{p.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ══ AMORTIZATION ════════════════════════════════════════════════ */}
            <TabsContent value="schedule" className="p-5 text-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] text-muted-foreground">
                  {schedule.length} periods · Reducing Balance ·{" "}
                  <span className={hasExtra ? "text-emerald-400 font-medium" : ""}>
                    {hasExtra ? "Accelerated" : "Standard Schedule"}
                  </span>
                </p>
                <p className="text-[10px] font-mono text-muted-foreground">EMI: {fmtFull(emi)}</p>
              </div>

              <Card>
                <div className="overflow-auto max-h-[calc(100vh-180px)]">
                  <table className="w-full border-collapse text-[11px]">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-card border-b border-border">
                        {[
                          ["#",          "w-8",  "text-left"],
                          ["Date",       "",     "text-left"],
                          ["Opening",    "",     "text-right"],
                          ["EMI",        "",     "text-right"],
                          ["Extra",      "",     "text-right"],
                          ["Interest",   "",     "text-right text-amber-400/60"],
                          ["Principal",  "",     "text-right text-sky-400/60"],
                          ["Balance",    "",     "text-right"],
                        ].map(([h, w, cls]) => (
                          <th
                            key={h}
                            className={`px-3 py-2 text-[9px] uppercase tracking-[0.12em] text-muted-foreground font-medium ${w} ${cls}`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {byYear.flatMap(({ year, rows }) => [
                        <tr key={`yr-${year}`}>
                          <td colSpan={8} className="px-3 py-1 bg-muted/20">
                            <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-primary/60">{year}</span>
                          </td>
                        </tr>,
                        ...rows.map((r: ScheduleRow) => (
                          <tr
                            key={r.period}
                            className="border-b border-border/40 hover:bg-muted/25 transition-colors"
                          >
                            <td className="px-3 py-1.5 text-muted-foreground/50 font-mono">{r.period}</td>
                            <td className="px-3 py-1.5 text-muted-foreground font-mono">
                              {r.date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })}
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono">{fmtFull(r.openBal)}</td>
                            <td className="px-3 py-1.5 text-right font-mono">{fmtFull(r.scheduled)}</td>
                            <td className={`px-3 py-1.5 text-right font-mono ${r.extra > 0 ? "text-emerald-400" : "text-muted-foreground/30"}`}>
                              {r.extra > 0 ? fmtFull(r.extra) : "–"}
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono text-amber-400">{fmtFull(r.interest)}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-sky-400">{fmtFull(r.principal)}</td>
                            <td className={`px-3 py-1.5 text-right font-mono ${r.closeBal < 1 ? "text-emerald-400 font-bold" : ""}`}>
                              {r.closeBal < 1 ? "₹0 ✓" : fmtFull(r.closeBal)}
                            </td>
                          </tr>
                        )),
                      ])}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            {/* ══ TAX & COSTS ══════════════════════════════════════════════════ */}
            <TabsContent value="tax" className="p-5 space-y-4 text-sm">

              {/* Summary KPIs */}
              <div className="grid grid-cols-4 gap-3">
                <KpiCard label="§24(b) Cap / yr"   value={propertyType === "self" ? fmt(200000 * coBorrowersNum) : "∞ Unlimited"} sub={coBorrowersNum === 2 ? "Joint deduction" : "Single borrower"} color={C.emerald} />
                <KpiCard label="§80C Cap / yr"      value={fmt(150000 * coBorrowersNum)}  sub="Principal repayment"    color={C.sky} />
                <KpiCard label="Total Tax Saved"    value={fmt(totalTaxSaved)}            sub={`At ${taxBracket}% bracket`}  color={C.violet} />
                <KpiCard label="Net Effective Rate" value={`${netEffRate.toFixed(2)}%`}   sub="After tax deductions"   color={C.amber} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Friction costs */}
                <Card>
                  <CardHeader><CardTitle>Initial Friction Costs</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { label: "Processing Fee",                                   base: regCosts.procFee,    gst: regCosts.procGST,    total: regCosts.procTotal    },
                      { label: `CERSAI (${loanAmt <= 500000 ? "≤5L" : ">5L"})`,  base: regCosts.cersaiBase, gst: regCosts.cersaiGST,  total: regCosts.cersaiTotal  },
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

                {/* RBI Preclosure */}
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
                    <table className="w-full border-collapse text-[11px]">
                      <thead className="sticky top-0 bg-card z-10">
                        <tr className="border-b border-border">
                          {[
                            ["FY",              "text-left"],
                            ["Interest Paid",   "text-right text-amber-400/60"],
                            ["§24(b) Ded.",     "text-right text-emerald-400/60"],
                            ["Cap Used",        "text-right"],
                            ["Principal Paid",  "text-right text-sky-400/60"],
                            ["§80C Ded.",       "text-right text-emerald-400/60"],
                            ["Cap Used",        "text-right"],
                            ["Tax Saved",       "text-right text-violet-400/60"],
                          ].map(([h, cls], i) => (
                            <th key={i} className={`px-3 py-2 text-[9px] uppercase tracking-[0.12em] text-muted-foreground font-medium ${cls}`}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {fyData.map((d, i) => {
                          const intPct  = maxIntDed  === Infinity ? 100 : (d.interest  / maxIntDed)  * 100;
                          const prinPct =                                  (d.principal / maxPrinDed) * 100;
                          return (
                            <tr key={d.fy} className={`border-b border-border/40 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-muted/5"}`}>
                              <td className="px-3 py-2 font-mono font-semibold text-muted-foreground">
                                FY{d.fy}–{(d.fy + 1).toString().slice(-2)}
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-amber-400">{fmtFull(d.interest)}</td>
                              <td className="px-3 py-2 text-right font-mono text-emerald-400">{fmtFull(d.intDed)}</td>
                              <td className="px-3 py-2 text-right"><MiniBar pct={intPct}  color={C.emerald} /></td>
                              <td className="px-3 py-2 text-right font-mono text-sky-400">{fmtFull(d.principal)}</td>
                              <td className="px-3 py-2 text-right font-mono text-emerald-400">{fmtFull(d.prinDed)}</td>
                              <td className="px-3 py-2 text-right"><MiniBar pct={prinPct} color={C.sky} /></td>
                              <td className="px-3 py-2 text-right font-mono text-violet-400 font-semibold">{fmtFull(d.taxSaved)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
