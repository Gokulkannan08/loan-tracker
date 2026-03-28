import { useState, useMemo } from "react";
import {
  fmt, fmtFull, pmt,
  buildSchedule, computeTotals, computeRegCosts, computeFYData,
  type LoanType, type PropertyType, type ScheduleRow,
} from "@/lib/loan-engine";

// shadcn/ui components
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// Recharts
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";

// ─── Palette ───
const C = {
  amber: "#f59e0b", blue: "#3b82f6", green: "#10b981",
  red: "#ef4444", purple: "#8b5cf6", teal: "#14b8a6",
} as const;

// ─── Field wrapper ───
interface FieldProps {
  label: string;
  children: React.ReactNode;
  suffix?: string;
}

function Field({ label, children, suffix }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div className="relative">
        {children}
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── KPI Card ───
interface KPIProps {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}

function KPI({ label, value, sub, color }: KPIProps) {
  return (
    <Card>
      <CardContent className="text-center py-3 px-2">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
        <div className="text-xl font-bold font-mono" style={{ color: color || "inherit" }}>{value}</div>
        {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}

// ─── Doughnut (Recharts PieChart) ───
interface DoughnutChartProps {
  principal: number;
  interest: number;
}

function DoughnutChart({ principal, interest }: DoughnutChartProps) {
  const data = [
    { name: "Principal", value: principal, color: C.blue },
    { name: "Interest", value: interest, color: C.amber },
  ];
  const total = principal + interest;
  const pPct = total > 0 ? ((principal / total) * 100).toFixed(1) : "0";
  const iPct = total > 0 ? ((interest / total) * 100).toFixed(1) : "0";

  return (
    <div className="flex items-center gap-5">
      <ResponsiveContainer width={160} height={160}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={42} outerRadius={68} dataKey="value" strokeWidth={0}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip formatter={(v) => fmtFull(v as number)} contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-col gap-2">
        <div>
          <div className="text-[10px] text-muted-foreground">● Principal</div>
          <div className="text-base font-bold font-mono" style={{ color: C.blue }}>{fmt(principal)} <span className="text-[10px] text-muted-foreground">({pPct}%)</span></div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground">● Interest</div>
          <div className="text-base font-bold font-mono" style={{ color: C.amber }}>{fmt(interest)} <span className="text-[10px] text-muted-foreground">({iPct}%)</span></div>
        </div>
        <div className="pt-1 border-t border-border">
          <div className="text-[10px] text-muted-foreground">Total Payout</div>
          <div className="text-base font-bold font-mono">{fmt(total)}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Annual Stacked Bar Chart (Recharts) ───
interface AnnualChartPoint {
  fy: number;
  interest: number;
  principal: number;
}

function AnnualChart({ data }: { data: AnnualChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="fy" tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v: number) => `FY${String(v).slice(-2)}`} />
        <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v: number) => v >= 1e5 ? `${(v / 1e5).toFixed(0)}L` : `${v}`} />
        <Tooltip formatter={(v) => fmtFull(v as number)} contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} labelFormatter={(v) => `FY ${v}-${(Number(v) + 1).toString().slice(-2)}`} />
        <Bar dataKey="interest" stackId="a" fill={C.amber} radius={[0, 0, 0, 0]} name="Interest" />
        <Bar dataKey="principal" stackId="a" fill={C.blue} radius={[4, 4, 0, 0]} name="Principal" />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN APP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function App() {
  // ─── State ───
  const [loanAmt, setLoanAmt] = useState(5000000);
  const [annualRate, setAnnualRate] = useState(8.5);
  const [tenureYears, setTenureYears] = useState(20);
  const [tenureMonths, setTenureMonths] = useState(0);
  const [startDate, setStartDate] = useState("2026-04-01");
  const [loanType, setLoanType] = useState<LoanType>("floating");
  const [propertyType, setPropertyType] = useState<PropertyType>("self");
  const [coBorrowers, setCoBorrowers] = useState("1");
  const [taxBracket, setTaxBracket] = useState(30);
  const [monthlyExtra, setMonthlyExtra] = useState(0);
  const [lumpSum, setLumpSum] = useState(0);
  const [lumpSumMonth, setLumpSumMonth] = useState(12);
  const [strategy, setStrategy] = useState<"tenure" | "emi">("tenure");
  const [processingFee, setProcessingFee] = useState(1);
  const [fixedPenalty, setFixedPenalty] = useState(3);

  const totalMonths = tenureYears * 12 + tenureMonths;
  const monthlyRate = annualRate / 100 / 12;
  const coBorrowersNum = parseInt(coBorrowers);
  const hasExtra = monthlyExtra > 0 || lumpSum > 0;

  // ─── Engine ───
  const { standard, accelerated } = useMemo(() => ({
    standard: buildSchedule(loanAmt, monthlyRate, totalMonths, startDate, false, 0, 0, 0),
    accelerated: buildSchedule(loanAmt, monthlyRate, totalMonths, startDate, true, monthlyExtra, lumpSum, lumpSumMonth),
  }), [loanAmt, monthlyRate, totalMonths, startDate, monthlyExtra, lumpSum, lumpSumMonth]);

  const totals = useMemo(() => computeTotals(standard, accelerated), [standard, accelerated]);
  const regCosts = useMemo(() => computeRegCosts(loanAmt, processingFee, loanType, fixedPenalty, accelerated), [loanAmt, processingFee, loanType, fixedPenalty, accelerated]);

  const schedule = hasExtra ? accelerated : standard;
  const fyData = useMemo(() => computeFYData(schedule, propertyType, coBorrowersNum, taxBracket), [schedule, propertyType, coBorrowersNum, taxBracket]);
  const totalTaxSaved = fyData.reduce((s, d) => s + d.taxSaved, 0);

  const netEffRate = useMemo(() => {
    const netInt = totals.accInterest - totalTaxSaved;
    const avgBal = loanAmt / 2;
    const years = totals.accMonths / 12;
    return years > 0 && avgBal > 0 ? (netInt / avgBal / years) * 100 : 0;
  }, [totals, totalTaxSaved, loanAmt]);

  const annualChartData = useMemo(() => {
    const map: Record<number, AnnualChartPoint> = {};
    schedule.forEach((r: ScheduleRow) => {
      const fy = r.date.getMonth() >= 3 ? r.date.getFullYear() : r.date.getFullYear() - 1;
      if (!map[fy]) map[fy] = { fy, interest: 0, principal: 0 };
      map[fy].interest += r.interest;
      map[fy].principal += r.principal;
    });
    return Object.values(map).sort((a, b) => a.fy - b.fy);
  }, [schedule]);

  const emi = pmt(monthlyRate, totalMonths, loanAmt);

  // ─── Render ───
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="px-8 pt-6 pb-2 flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-primary">₹</span> Loan Amortization Tracker
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Indian Financial Context · INR · FY April–March · RBI 2026 Compliant</p>
        </div>
      </header>

      {/* Tabs */}
      <Tabs defaultValue="dashboard" className="px-8 pt-2 pb-10">
        <TabsList className="mb-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="schedule">Amortization</TabsTrigger>
          <TabsTrigger value="tax">Tax &amp; Costs</TabsTrigger>
        </TabsList>

        {/* ━━━ DASHBOARD ━━━ */}
        <TabsContent value="dashboard">
          <div className="grid grid-cols-[320px_1fr] gap-5">
            {/* Left inputs */}
            <div className="flex flex-col gap-4">
              {/* Loan Parameters */}
              <Card className="border-t-[3px] border-t-blue-500">
                <CardHeader><CardTitle className="text-blue-400">Loan Parameters</CardTitle></CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Field label="Loan Amount (₹)">
                    <Input type="number" value={loanAmt} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoanAmt(+e.target.value)} />
                  </Field>
                  <Field label="Annual Interest Rate" suffix="%">
                    <Input type="number" step="0.1" value={annualRate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAnnualRate(+e.target.value)} />
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Tenure (Years)">
                      <Input type="number" value={tenureYears} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTenureYears(+e.target.value)} />
                    </Field>
                    <Field label="+ Months">
                      <Input type="number" value={tenureMonths} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTenureMonths(+e.target.value)} />
                    </Field>
                  </div>

                  <DatePicker label="Loan Start Date" value={startDate} onChange={setStartDate} />

                  <div className="flex flex-col gap-1.5">
                    <Label>Rate Type</Label>
                    <ToggleGroup type="single" value={loanType} onValueChange={(v: string) => v && setLoanType(v as LoanType)}>
                      <ToggleGroupItem value="floating">Floating</ToggleGroupItem>
                      <ToggleGroupItem value="fixed">Fixed</ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  <Field label="Property Type">
                    <Select value={propertyType} onValueChange={(v: string) => setPropertyType(v as PropertyType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self">Self-Occupied</SelectItem>
                        <SelectItem value="letout">Let-Out</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <div className="flex flex-col gap-1.5">
                    <Label>Co-Borrowers</Label>
                    <ToggleGroup type="single" value={coBorrowers} onValueChange={(v: string) => v && setCoBorrowers(v)}>
                      <ToggleGroupItem value="1">1</ToggleGroupItem>
                      <ToggleGroupItem value="2">2 (Joint)</ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  <Field label="Tax Bracket" suffix="%">
                    <Input type="number" value={taxBracket} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaxBracket(+e.target.value)} />
                  </Field>
                </CardContent>
              </Card>

              {/* Prepayment */}
              <Card className="border-t-[3px] border-t-emerald-500">
                <CardHeader><CardTitle className="text-emerald-400">Prepayment Strategy</CardTitle></CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Field label="Monthly Extra (₹)">
                    <Input type="number" value={monthlyExtra} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMonthlyExtra(+e.target.value)} />
                  </Field>
                  <Field label="Lump Sum (₹)">
                    <Input type="number" value={lumpSum} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLumpSum(+e.target.value)} />
                  </Field>
                  <Field label="Lump Sum in Month #">
                    <Input type="number" value={lumpSumMonth} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLumpSumMonth(+e.target.value)} />
                  </Field>
                  <div className="flex flex-col gap-1.5">
                    <Label>Strategy</Label>
                    <ToggleGroup type="single" value={strategy} onValueChange={(v: string) => v && setStrategy(v as "tenure" | "emi")}>
                      <ToggleGroupItem value="tenure">Reduce Tenure</ToggleGroupItem>
                      <ToggleGroupItem value="emi">Lower EMI</ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                  <Field label="Processing Fee" suffix="%">
                    <Input type="number" step="0.1" value={processingFee} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProcessingFee(+e.target.value)} />
                  </Field>
                  {loanType === "fixed" && (
                    <Field label="Preclosure Penalty" suffix="%">
                      <Input type="number" value={fixedPenalty} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFixedPenalty(+e.target.value)} />
                    </Field>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: KPIs + Charts */}
            <div className="flex flex-col gap-4">
              {/* EMI Hero */}
              <Card className="border-t-[3px] border-t-primary">
                <CardContent className="flex justify-center items-baseline gap-3 py-4">
                  <span className="text-sm text-muted-foreground">Monthly EMI</span>
                  <span className="text-4xl font-bold font-mono text-primary">{fmtFull(emi)}</span>
                </CardContent>
              </Card>

              {/* KPI row */}
              <div className="grid grid-cols-3 gap-3">
                <KPI label="Total Interest" value={fmt(totals.accInterest)} color={C.amber} sub={hasExtra ? `Std: ${fmt(totals.stdInterest)}` : undefined} />
                <KPI label="Total Payout" value={fmt(totals.accTotal)} color={C.blue} />
                <KPI label="Tenure" value={`${Math.floor(totals.accMonths / 12)}y ${totals.accMonths % 12}m`} color={C.teal} sub={`of ${Math.floor(totals.stdMonths / 12)}y ${totals.stdMonths % 12}m`} />
              </div>

              {hasExtra && (
                <div className="grid grid-cols-3 gap-3">
                  <KPI label="Interest Saved" value={fmt(totals.interestSaved)} color={C.green} />
                  <KPI label="Months Saved" value={`${totals.monthsSaved}`} color={C.green} sub={`${Math.floor(totals.monthsSaved / 12)}y ${totals.monthsSaved % 12}m`} />
                  <KPI label="Total Tax Saved" value={fmt(totalTaxSaved)} color={C.purple} sub={`Net Eff. Rate: ${netEffRate.toFixed(2)}%`} />
                </div>
              )}

              {/* Charts */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-t-[3px] border-t-blue-500">
                  <CardHeader><CardTitle className="text-blue-400">Principal vs Interest</CardTitle></CardHeader>
                  <CardContent>
                    <DoughnutChart principal={totals.accPrincipal} interest={totals.accInterest} />
                  </CardContent>
                </Card>
                <Card className="border-t-[3px] border-t-teal-500">
                  <CardHeader><CardTitle className="text-teal-400">Annual Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    {annualChartData.length > 0 && <AnnualChart data={annualChartData} />}
                  </CardContent>
                </Card>
              </div>

              {/* Scenario comparison */}
              {hasExtra && (
                <Card className="border-t-[3px] border-t-emerald-500">
                  <CardHeader><CardTitle className="text-emerald-400">Scenario Comparison</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground mb-2">Standard Schedule</div>
                        <div className="flex flex-col gap-1.5 text-[13px]">
                          <div className="flex justify-between"><span className="text-muted-foreground">Interest</span><span className="font-mono">{fmt(totals.stdInterest)}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Total Payout</span><span className="font-mono">{fmt(totals.stdTotal)}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Tenure</span><span className="font-mono">{Math.floor(totals.stdMonths / 12)}y {totals.stdMonths % 12}m</span></div>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-emerald-400 mb-2">With Prepayments ✓</div>
                        <div className="flex flex-col gap-1.5 text-[13px]">
                          <div className="flex justify-between"><span className="text-muted-foreground">Interest</span><span className="font-mono text-emerald-400">{fmt(totals.accInterest)}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Total Payout</span><span className="font-mono text-emerald-400">{fmt(totals.accTotal)}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Tenure</span><span className="font-mono text-emerald-400">{Math.floor(totals.accMonths / 12)}y {totals.accMonths % 12}m</span></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ━━━ AMORTIZATION ━━━ */}
        <TabsContent value="schedule">
          <div className="mb-3 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{schedule.length} periods · Reducing Balance · {hasExtra ? "With Prepayments" : "Standard Schedule"}</span>
            <span className="text-xs text-muted-foreground">Scroll for full schedule</span>
          </div>
          <Card>
            <div className="max-h-[600px] overflow-auto rounded-xl">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-muted sticky top-0 z-10">
                    {["#", "Date", "Opening Bal", "EMI", "Extra", "Interest", "Principal", "Closing Bal"].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-right text-primary font-semibold text-[10px] tracking-wider font-mono border-b-2 border-primary/40">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((r: ScheduleRow, i: number) => (
                    <tr key={r.period} className={`border-b border-border ${i % 2 === 0 ? "bg-card" : "bg-background"}`}>
                      <td className="px-3 py-2 text-right text-muted-foreground font-mono">{r.period}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground text-[11px]">{r.date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })}</td>
                      <td className="px-3 py-2 text-right font-mono">{fmtFull(r.openBal)}</td>
                      <td className="px-3 py-2 text-right font-mono">{fmtFull(r.scheduled)}</td>
                      <td className={`px-3 py-2 text-right font-mono ${r.extra > 0 ? "text-emerald-400" : "text-muted-foreground"}`}>{r.extra > 0 ? fmtFull(r.extra) : "–"}</td>
                      <td className="px-3 py-2 text-right font-mono text-amber-400">{fmtFull(r.interest)}</td>
                      <td className="px-3 py-2 text-right font-mono text-blue-400">{fmtFull(r.principal)}</td>
                      <td className={`px-3 py-2 text-right font-mono ${r.closeBal < 1 ? "text-emerald-400 font-bold" : ""}`}>{r.closeBal < 1 ? "₹0 ✓" : fmtFull(r.closeBal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ━━━ TAX & COSTS ━━━ */}
        <TabsContent value="tax">
          <div className="grid grid-cols-2 gap-5">
            {/* Friction Costs */}
            <Card className="border-t-[3px] border-t-red-500">
              <CardHeader><CardTitle className="text-red-400">Initial Friction Costs</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-3">
                {[
                  { label: "Processing Fee", val: regCosts.procFee, gst: regCosts.procGST, total: regCosts.procTotal },
                  { label: `CERSAI (${loanAmt <= 500000 ? "≤5L" : ">5L"})`, val: regCosts.cersaiBase, gst: regCosts.cersaiGST, total: regCosts.cersaiTotal },
                ].map((item) => (
                  <div key={item.label} className="bg-background rounded-lg p-3">
                    <div className="text-xs font-semibold text-muted-foreground mb-2">{item.label}</div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Base</span><span className="font-mono">{fmtFull(item.val)}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">+ 18% GST</span><span className="font-mono text-red-400">{fmtFull(item.gst)}</span></div>
                    <div className="flex justify-between text-xs mt-2 pt-2 border-t border-border font-bold"><span>Total</span><span className="font-mono">{fmtFull(item.total)}</span></div>
                  </div>
                ))}
                <div className="flex justify-between p-3 bg-primary/10 rounded-lg font-bold text-sm">
                  <span>Total Initial Outflow</span>
                  <span className="font-mono text-primary">{fmtFull(regCosts.totalInitial)}</span>
                </div>
              </CardContent>
            </Card>

            {/* RBI Preclosure */}
            <Card className="border-t-[3px] border-t-violet-500">
              <CardHeader><CardTitle className="text-violet-400">Preclosure Rules (RBI 2026)</CardTitle></CardHeader>
              <CardContent>
                <div className="bg-background rounded-lg p-3.5 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${loanType === "floating" ? "bg-emerald-400" : "bg-red-400"}`} />
                    <span className="text-sm font-semibold">{loanType === "floating" ? "Floating Rate" : "Fixed Rate"}</span>
                  </div>
                  {loanType === "floating" ? (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Under RBI Directions 2025 (effective Jan 1, 2026), <span className="text-emerald-400 font-semibold">zero preclosure penalty</span> applies to floating-rate loans for individual, non-business borrowers.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                        Fixed-rate loans may attract a penalty of <span className="text-red-400 font-semibold">{fixedPenalty}%</span> on outstanding principal + 18% GST.
                      </p>
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">Penalty</span><span className="font-mono">{fmtFull(regCosts.preclosurePenalty)}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">+ 18% GST</span><span className="font-mono text-red-400">{fmtFull(regCosts.preclosureGST)}</span></div>
                      <div className="flex justify-between text-xs font-bold mt-2 pt-2 border-t border-border"><span>Total Penalty</span><span className="font-mono text-red-400">{fmtFull(regCosts.preclosureTotal)}</span></div>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed px-1">
                  Penal charges for missed EMIs are now flat, transparent charges per RBI guidelines. They cannot be capitalized into outstanding principal.
                </p>
              </CardContent>
            </Card>

            {/* Tax Shield */}
            <Card className="col-span-2 border-t-[3px] border-t-emerald-500">
              <CardHeader>
                <CardTitle className="text-emerald-400">
                  Tax Shield · {coBorrowersNum === 2 ? "Joint (2×)" : "Single"} · {taxBracket}% Bracket
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Summary pills */}
                <div className="flex gap-3 mb-4 flex-wrap">
                  {[
                    { label: "§24(b) Cap/yr", value: propertyType === "self" ? fmt(200000 * coBorrowersNum) : "Unlimited", color: C.green },
                    { label: "§80C Cap/yr", value: fmt(150000 * coBorrowersNum), color: C.blue },
                    { label: "Total Tax Saved", value: fmt(totalTaxSaved), color: C.purple },
                    { label: "Net Eff. Rate", value: `${netEffRate.toFixed(2)}%`, color: C.amber },
                  ].map((p) => (
                    <div key={p.label} className="bg-background rounded-lg py-2.5 px-4 flex-1 min-w-[180px]">
                      <div className="text-[10px] text-muted-foreground">{p.label}</div>
                      <div className="text-lg font-bold font-mono" style={{ color: p.color }}>{p.value}</div>
                    </div>
                  ))}
                </div>

                {/* FY Table */}
                <div className="max-h-[360px] overflow-auto rounded-lg border border-border">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-muted sticky top-0 z-10">
                        {["FY", "Interest Paid", "§24(b) Ded.", "Principal Paid", "§80C Ded.", "Tax Saved"].map((h) => (
                          <th key={h} className="px-3 py-2 text-right text-emerald-400 font-semibold text-[10px] tracking-wider font-mono border-b-2 border-emerald-500/40">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {fyData.map((d, i) => (
                        <tr key={d.fy} className={`border-b border-border ${i % 2 === 0 ? "bg-card" : "bg-background"}`}>
                          <td className="px-3 py-1.5 text-right font-semibold text-muted-foreground font-mono">FY{d.fy}-{(d.fy + 1).toString().slice(-2)}</td>
                          <td className="px-3 py-1.5 text-right font-mono text-amber-400">{fmtFull(d.interest)}</td>
                          <td className="px-3 py-1.5 text-right font-mono text-emerald-400">{fmtFull(d.intDed)}</td>
                          <td className="px-3 py-1.5 text-right font-mono text-blue-400">{fmtFull(d.principal)}</td>
                          <td className="px-3 py-1.5 text-right font-mono text-emerald-400">{fmtFull(d.prinDed)}</td>
                          <td className="px-3 py-1.5 text-right font-mono text-violet-400 font-semibold">{fmtFull(d.taxSaved)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
