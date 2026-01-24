"use client"

import * as React from "react"
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfYear } from "date-fns"
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

    const handleSelect = (range: DateRange | undefined) => {
        if (range?.from && range?.to) {
            onDateChange({ from: range.from, to: range.to })
        } else if (range?.from) {
            onDateChange({ from: range.from, to: range.from })
        }
    }

    const presets = [
        {
            label: "Hoje",
            getValue: () => ({ from: new Date(), to: new Date() }),
        },
        {
            label: "Últimos 7 dias",
            getValue: () => ({ from: subDays(new Date(), 6), to: new Date() }),
        },
        {
            label: "Últimos 30 dias",
            getValue: () => ({ from: subDays(new Date(), 29), to: new Date() }),
        },
        {
            label: "Este mês",
            getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }),
        },
        {
            label: "Mês passado",
            getValue: () => {
                const lastMonth = subMonths(new Date(), 1)
                return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) }
            },
        },
        {
            label: "Este ano",
            getValue: () => ({ from: startOfYear(new Date()), to: new Date() }),
        },
    ]

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant="outline"
                        className={cn(
                            "w-auto justify-start text-left font-normal gap-2",
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
                        <div className="border-r border-slate-200 p-3 space-y-1">
                            <p className="text-xs font-medium text-slate-500 mb-2">Atalhos</p>
                            {presets.map((preset) => (
                                <button
                                    key={preset.label}
                                    onClick={() => {
                                        const newDate = preset.getValue()
                                        onDateChange(newDate)
                                        setIsOpen(false)
                                    }}
                                    className="block w-full text-left px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        {/* Calendar */}
                        <div className="p-3">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={{ from: date.from, to: date.to }}
                                onSelect={handleSelect}
                                numberOfMonths={2}
                                locale={ptBR}
                            />
                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 mt-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => setIsOpen(false)}
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
