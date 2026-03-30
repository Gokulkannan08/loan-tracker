export const C = {
  primary: "#d95f2e",
  sky:     "#38bdf8",
  emerald: "#34d399",
  amber:   "#fbbf24",
  violet:  "#a78bfa",
  rose:    "#fb7185",
  muted:   "#64748b",
} as const;

export type Palette = typeof C;
