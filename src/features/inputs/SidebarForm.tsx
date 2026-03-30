import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { IconX } from "@tabler/icons-react";
import type { LoanType, PropertyType } from "@/lib/loan-engine";

// ─── Primitives ───────────────────────────────────────────────────────────────

function SideSection({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mt-5 mb-3 first:mt-0">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-primary">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

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

function InputSuffix({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none font-mono select-none">
      {children}
    </span>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SidebarFormProps {
  loanAmt: number;       setLoanAmt: (v: number) => void;
  annualRate: number;    setAnnualRate: (v: number) => void;
  tenureYears: number;   setTenureYears: (v: number) => void;
  tenureMonths: number;  setTenureMonths: (v: number) => void;
  startDate: string;     setStartDate: (v: string) => void;
  loanType: LoanType;    setLoanType: (v: LoanType) => void;
  propertyType: PropertyType; setPropertyType: (v: PropertyType) => void;
  coBorrowers: string;   setCoBorrowers: (v: string) => void;
  taxBracket: number;    setTaxBracket: (v: number) => void;
  monthlyExtra: number;  setMonthlyExtra: (v: number) => void;
  lumpSum: number;       setLumpSum: (v: number) => void;
  lumpSumMonth: number;  setLumpSumMonth: (v: number) => void;
  strategy: "tenure" | "emi"; setStrategy: (v: "tenure" | "emi") => void;
  processingFee: number; setProcessingFee: (v: number) => void;
  fixedPenalty: number;  setFixedPenalty: (v: number) => void;
  setSidebarOpen: (v: boolean) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SidebarForm({
  loanAmt, setLoanAmt,
  annualRate, setAnnualRate,
  tenureYears, setTenureYears,
  tenureMonths, setTenureMonths,
  startDate, setStartDate,
  loanType, setLoanType,
  propertyType, setPropertyType,
  coBorrowers, setCoBorrowers,
  taxBracket, setTaxBracket,
  monthlyExtra, setMonthlyExtra,
  lumpSum, setLumpSum,
  lumpSumMonth, setLumpSumMonth,
  strategy, setStrategy,
  processingFee, setProcessingFee,
  fixedPenalty, setFixedPenalty,
  setSidebarOpen,
}: SidebarFormProps) {
  return (
    <>
      {/* Logo strip */}
      <div className="h-12 shrink-0 flex items-center gap-2 px-4 border-b border-border">
        <span className="text-primary font-bold text-xl font-mono leading-none">₹</span>
        <div className="flex-1">
          <p className="text-[13px] font-semibold tracking-tight leading-none">Loan Tracker</p>
          <p className="text-[9px] text-muted-foreground tracking-wider mt-0.5">Indian · INR · FY Apr–Mar</p>
        </div>
        <button
          className="md:hidden p-1 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <IconX size={16} />
        </button>
      </div>

      {/* Inputs */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <SideSection label="Loan" />

        <SideField label="Loan Amount">
          <Input type="number" value={loanAmt} onChange={(e) => setLoanAmt(+e.target.value)} className="font-mono pr-6" />
          <InputSuffix>₹</InputSuffix>
        </SideField>

        <SideField label="Annual Rate">
          <Input type="number" step="0.1" value={annualRate} onChange={(e) => setAnnualRate(+e.target.value)} className="font-mono pr-5" />
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
          <ToggleGroup type="single" value={loanType} onValueChange={(v) => v && setLoanType(v as LoanType)} className="w-full">
            <ToggleGroupItem value="floating" className="flex-1 text-[11px]">Floating</ToggleGroupItem>
            <ToggleGroupItem value="fixed"    className="flex-1 text-[11px]">Fixed</ToggleGroupItem>
          </ToggleGroup>
        </SideField>

        <SideSection label="Tax Profile" />

        <SideField label="Property Type">
          <Select value={propertyType} onValueChange={(v) => setPropertyType(v as PropertyType)}>
            <SelectTrigger className="w-full h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="self">Self-Occupied</SelectItem>
              <SelectItem value="letout">Let-Out</SelectItem>
            </SelectContent>
          </Select>
        </SideField>

        <SideField label="Co-Borrowers">
          <ToggleGroup type="single" value={coBorrowers} onValueChange={(v) => v && setCoBorrowers(v)} className="w-full">
            <ToggleGroupItem value="1" className="flex-1 text-[11px]">Single</ToggleGroupItem>
            <ToggleGroupItem value="2" className="flex-1 text-[11px]">Joint 2×</ToggleGroupItem>
          </ToggleGroup>
        </SideField>

        <SideField label="Tax Bracket">
          <Input type="number" value={taxBracket} onChange={(e) => setTaxBracket(+e.target.value)} className="font-mono pr-5" />
          <InputSuffix>%</InputSuffix>
        </SideField>

        <SideSection label="Prepayment" />

        <SideField label="Monthly Extra">
          <Input type="number" value={monthlyExtra} onChange={(e) => setMonthlyExtra(+e.target.value)} className="font-mono pr-6" />
          <InputSuffix>₹</InputSuffix>
        </SideField>

        <SideField label="Lump Sum">
          <Input type="number" value={lumpSum} onChange={(e) => setLumpSum(+e.target.value)} className="font-mono pr-6" />
          <InputSuffix>₹</InputSuffix>
        </SideField>

        <SideField label="Lump Sum at Month">
          <Input type="number" value={lumpSumMonth} onChange={(e) => setLumpSumMonth(+e.target.value)} className="font-mono" />
        </SideField>

        <SideField label="Strategy">
          <ToggleGroup type="single" value={strategy} onValueChange={(v) => v && setStrategy(v as "tenure" | "emi")} className="w-full">
            <ToggleGroupItem value="tenure" className="flex-1 text-[11px]">Tenure</ToggleGroupItem>
            <ToggleGroupItem value="emi"    className="flex-1 text-[11px]">EMI</ToggleGroupItem>
          </ToggleGroup>
        </SideField>

        <SideSection label="Fees" />

        <SideField label="Processing Fee">
          <Input type="number" step="0.1" value={processingFee} onChange={(e) => setProcessingFee(+e.target.value)} className="font-mono pr-5" />
          <InputSuffix>%</InputSuffix>
        </SideField>

        {loanType === "fixed" && (
          <SideField label="Preclosure Penalty">
            <Input type="number" value={fixedPenalty} onChange={(e) => setFixedPenalty(+e.target.value)} className="font-mono pr-5" />
            <InputSuffix>%</InputSuffix>
          </SideField>
        )}

        <div className="h-6" />
      </div>
    </>
  );
}
