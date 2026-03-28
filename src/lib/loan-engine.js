// ─── INR Formatting (Lakhs/Crores) ───
export const fmt = (n) => {
  if (n === undefined || n === null || isNaN(n)) return "₹0";
  const abs = Math.abs(n);
  if (abs >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
};

export const fmtFull = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;

// ─── PMT (Reducing Balance EMI) ───
export const pmt = (rate, nper, pv) => {
  if (rate === 0) return pv / nper;
  return (pv * rate * Math.pow(1 + rate, nper)) / (Math.pow(1 + rate, nper) - 1);
};

// ─── Date Helpers ───
export const addMonths = (date, m) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + m);
  return d;
};

export const getFY = (date) => {
  const d = new Date(date);
  return d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
};

// ─── Build Amortization Schedule ───
export function buildSchedule(loanAmt, monthlyRate, totalMonths, startDate, withExtra, monthlyExtra, lumpSum, lumpSumMonth) {
  const emi = pmt(monthlyRate, totalMonths, loanAmt);
  const rows = [];
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
export function computeTotals(standard, accelerated) {
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
export function computeRegCosts(loanAmt, processingFee, loanType, fixedPenalty, accelerated) {
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
export function computeFYData(schedule, propertyType, coBorrowers, taxBracket) {
  const map = {};
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
