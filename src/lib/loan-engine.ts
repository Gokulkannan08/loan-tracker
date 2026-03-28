// ─── Types ───
export type LoanType = "floating" | "fixed";
export type PropertyType = "self" | "letout";

export interface ScheduleRow {
  period: number;
  date: Date;
  openBal: number;
  interest: number;
  principal: number;
  scheduled: number;
  extra: number;
  totalPay: number;
  closeBal: number;
}

export interface Totals {
  stdInterest: number;
  stdPrincipal: number;
  stdTotal: number;
  stdMonths: number;
  accInterest: number;
  accPrincipal: number;
  accTotal: number;
  accMonths: number;
  interestSaved: number;
  monthsSaved: number;
}

export interface RegCosts {
  procFee: number;
  procGST: number;
  procTotal: number;
  cersaiBase: number;
  cersaiGST: number;
  cersaiTotal: number;
  preclosurePenalty: number;
  preclosureGST: number;
  preclosureTotal: number;
  totalInitial: number;
}

export interface FYRow {
  fy: number;
  interest: number;
  principal: number;
  intDed: number;
  prinDed: number;
  taxSaved: number;
}

// ─── INR Formatting (Lakhs/Crores) ───
export const fmt = (n: number | null | undefined): string => {
  if (n === undefined || n === null || isNaN(n)) return "₹0";
  const abs = Math.abs(n);
  if (abs >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
};

export const fmtFull = (n: number): string =>
  `₹${Math.round(n).toLocaleString("en-IN")}`;

// ─── PMT (Reducing Balance EMI) ───
export const pmt = (rate: number, nper: number, pv: number): number => {
  if (rate === 0) return pv / nper;
  return (pv * rate * Math.pow(1 + rate, nper)) / (Math.pow(1 + rate, nper) - 1);
};

// ─── Date Helpers ───
export const addMonths = (date: Date, m: number): Date => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + m);
  return d;
};

export const getFY = (date: Date): number => {
  const d = new Date(date);
  return d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
};

// ─── Build Amortization Schedule ───
export function buildSchedule(
  loanAmt: number,
  monthlyRate: number,
  totalMonths: number,
  startDate: string,
  withExtra: boolean,
  monthlyExtra: number,
  lumpSum: number,
  lumpSumMonth: number,
): ScheduleRow[] {
  const emi = pmt(monthlyRate, totalMonths, loanAmt);
  const rows: ScheduleRow[] = [];
  let balance = loanAmt;

  for (let p = 1; p <= totalMonths; p++) {
    if (balance <= 0.5) break;
    const interest = balance * monthlyRate;
    let scheduled = Math.min(emi, balance + interest);
    let extra = 0;
    if (withExtra) {
      extra = monthlyExtra;
      if (p === lumpSumMonth) extra += lumpSum;
      extra = Math.min(extra, Math.max(0, balance + interest - scheduled));
    }
    const totalPay = scheduled + extra;
    const prinComp = totalPay - interest;
    balance = Math.max(0, balance - prinComp);
    const date = addMonths(new Date(startDate), p - 1);
    rows.push({
      period: p, date, openBal: balance + prinComp,
      interest, principal: prinComp, scheduled, extra,
      totalPay, closeBal: balance,
    });
  }
  return rows;
}

// ─── Compute Totals ───
export function computeTotals(standard: ScheduleRow[], accelerated: ScheduleRow[]): Totals {
  const sInt = standard.reduce((s, r) => s + r.interest, 0);
  const sPrin = standard.reduce((s, r) => s + r.principal, 0);
  const aInt = accelerated.reduce((s, r) => s + r.interest, 0);
  const aPrin = accelerated.reduce((s, r) => s + r.principal, 0);
  return {
    stdInterest: sInt, stdPrincipal: sPrin, stdTotal: sInt + sPrin, stdMonths: standard.length,
    accInterest: aInt, accPrincipal: aPrin, accTotal: aInt + aPrin, accMonths: accelerated.length,
    interestSaved: sInt - aInt, monthsSaved: standard.length - accelerated.length,
  };
}

// ─── Regulatory Costs ───
export function computeRegCosts(
  loanAmt: number,
  processingFee: number,
  loanType: LoanType,
  fixedPenalty: number,
  accelerated: ScheduleRow[],
): RegCosts {
  const procFee = loanAmt * (processingFee / 100);
  const procGST = procFee * 0.18;
  const cersaiBase = loanAmt <= 500000 ? 50 : 100;
  const cersaiGST = Math.round(cersaiBase * 0.18);
  const lastBal = accelerated.length > 0 ? accelerated[accelerated.length - 1].closeBal : 0;
  const preclosurePenalty = loanType === "fixed" ? lastBal * (fixedPenalty / 100) : 0;
  const preclosureGST = preclosurePenalty * 0.18;
  return {
    procFee, procGST, procTotal: procFee + procGST,
    cersaiBase, cersaiGST, cersaiTotal: cersaiBase + cersaiGST,
    preclosurePenalty, preclosureGST, preclosureTotal: preclosurePenalty + preclosureGST,
    totalInitial: procFee + procGST + cersaiBase + cersaiGST,
  };
}

// ─── FY-wise Tax Shield Engine ───
export function computeFYData(
  schedule: ScheduleRow[],
  propertyType: PropertyType,
  coBorrowers: number,
  taxBracket: number,
): FYRow[] {
  const map: Record<number, { fy: number; interest: number; principal: number }> = {};
  schedule.forEach((r) => {
    const fy = getFY(r.date);
    if (!map[fy]) map[fy] = { fy, interest: 0, principal: 0 };
    map[fy].interest += r.interest;
    map[fy].principal += r.principal;
  });
  const maxInt = propertyType === "self" ? 200000 * coBorrowers : Infinity;
  const maxPrin = 150000 * coBorrowers;
  return Object.values(map).sort((a, b) => a.fy - b.fy).map((d) => {
    const intDed = Math.min(d.interest, maxInt);
    const prinDed = Math.min(d.principal, maxPrin);
    const taxSaved = (intDed + prinDed) * (taxBracket / 100);
    return { ...d, intDed, prinDed, taxSaved };
  });
}
