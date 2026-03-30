interface MiniBarProps {
  pct: number;
  color: string;
}

export function MiniBar({ pct, color }: MiniBarProps) {
  const clamped = Math.min(100, pct).toFixed(0);
  return (
    <div className="flex items-center gap-1.5 justify-end">
      <div className="w-14 h-1.5 bg-muted/50 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${clamped}%`, background: color }}
        />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground w-7 text-right">{clamped}%</span>
    </div>
  );
}
