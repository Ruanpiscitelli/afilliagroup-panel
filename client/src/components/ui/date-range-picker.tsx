"use client"

import * as React from "react"
import { format, subDays, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
    date: { from: Date; to: Date }
    onDateChange: (date: { from: Date; to: Date }) => void
    className?: string
}

export function DateRangePicker({
    date,
    onDateChange,
    className,
}: DateRangePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false)

    // Update local state when prop changes, if needed (optional, but good for reset)
    // Here we rely on `date` prop for initial value only or control? 
    // Usually control. But simpler: local state for interaction, flush on Apply.

    const [selectedRange, setSelectedRange] = React.useState<DateRange | undefined>({
        from: date?.from,
        to: date?.to,
    })

    const handleSelect = (range: DateRange | undefined) => {
        setSelectedRange(range)
    }

    const handleApply = () => {
        if (selectedRange?.from) {
            onDateChange({
                from: selectedRange.from,
                to: selectedRange.to || selectedRange.from, // Handle single day selection
            })
        }
        setIsOpen(false)
    }

    const handleCancel = () => {
        setSelectedRange({ from: date.from, to: date.to }) // Reset to internal prop
        setIsOpen(false)
    }

    const presets = [
        {
            label: "Ontem",
            getValue: () => {
                const yesterday = subDays(new Date(), 1)
                return { from: yesterday, to: yesterday }
            },
        },
        {
            label: "Últimos 7 dias",
            getValue: () => ({ from: subDays(new Date(), 6), to: new Date() }),
        },
        {
            label: "Este mês",
            getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }),
        },
        {
            label: "Todo período",
            getValue: () => ({ from: new Date(2025, 0, 1), to: new Date() }), // Assuming 2025 start or earlier
        },
    ]

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover open={isOpen} onOpenChange={(open) => {
                if (open) {
                    setSelectedRange({ from: date.from, to: date.to }) // Sync on open
                }
                setIsOpen(open)
            }}>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant="outline"
                        className={cn(
                            "w-auto justify-start text-left font-normal gap-2 h-10 px-4",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="h-4 w-4 text-slate-500" />
                        {date?.from ? (
                            date.to ? (
                                <span className="text-slate-700">
                                    {format(date.from, "d 'de' MMM. 'de' yyyy", { locale: ptBR })} –{" "}
                                    {format(date.to, "d 'de' MMM. 'de' yyyy", { locale: ptBR })}
                                </span>
                            ) : (
                                <span className="text-slate-700">
                                    {format(date.from, "d 'de' MMM. 'de' yyyy", { locale: ptBR })}
                                </span>
                            )
                        ) : (
                            <span>Selecione um período</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <div className="flex">
                        {/* Presets sidebar */}
                        <div className="border-r border-slate-200 p-3 w-[160px] flex flex-col justify-start bg-slate-50/50">
                            {presets.map((preset) => (
                                <button
                                    key={preset.label}
                                    onClick={() => {
                                        const newDate = preset.getValue()
                                        setSelectedRange(newDate)
                                        // Optional: Auto apply on preset click? Or wait for Apply? 
                                        // Screenshot implies presets set the calendar, user still clicks Apply usually.
                                        // But often presets auto-apply. Let's make presets update calendar view but wait for Apply.
                                    }}
                                    className="text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors w-full mb-1"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        {/* Calendar */}
                        <div className="p-0">
                            <div className="p-3">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={selectedRange?.from}
                                    selected={selectedRange}
                                    onSelect={handleSelect}
                                    numberOfMonths={2}
                                    locale={ptBR}
                                />
                            </div>
                            <div className="flex justify-end gap-2 p-3 border-t border-slate-200 bg-slate-50/30">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancel}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    size="sm"
                                    className="bg-slate-900 text-white hover:bg-slate-800"
                                    onClick={handleApply}
                                >
                                    Aplicar
                                </Button>
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
