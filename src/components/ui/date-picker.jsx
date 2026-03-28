import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function DatePicker({ value, onChange, label }) {
  const [open, setOpen] = React.useState(false)
  const date = value ? new Date(value + "T00:00:00") : undefined

  const handleSelect = (selected) => {
    if (selected) {
      const y = selected.getFullYear()
      const m = String(selected.getMonth() + 1).padStart(2, "0")
      const d = String(selected.getDate()).padStart(2, "0")
      onChange(`${y}-${m}-${d}`)
    }
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-medium text-slate-400 tracking-wide">
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-mono text-[13px] h-9",
              "bg-secondary border-slate-700/60 hover:bg-slate-700/50",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5 text-slate-500" />
            {date ? format(date, "dd MMM yyyy") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            defaultMonth={date}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
