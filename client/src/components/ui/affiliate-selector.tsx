"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Users } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { affiliatesApi } from "@/services/api"

interface Affiliate {
    id: string
    name: string
    email: string
}

interface AffiliateSelectorProps {
    selectedId: string | null
    onSelect: (id: string | null, name: string) => void
}

export function AffiliateSelector({ selectedId, onSelect }: AffiliateSelectorProps) {
    const [open, setOpen] = React.useState(false)
    const [selectedName, setSelectedName] = React.useState("Todos")

    const { data: affiliatesData, isLoading } = useQuery({
        queryKey: ['affiliates'],
        queryFn: async () => {
            const { data } = await affiliatesApi.getAll()
            return data
        },
    })

    const affiliates: Affiliate[] = affiliatesData?.affiliates || []

    const handleSelect = (affiliate: Affiliate | null) => {
        if (affiliate) {
            setSelectedName(affiliate.name)
            onSelect(affiliate.id, affiliate.name)
        } else {
            setSelectedName("Todos")
            onSelect(null, "Todos")
        }
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "gap-2 justify-between min-w-[140px]",
                        selectedId && "border-slate-900"
                    )}
                >
                    <Users className="h-4 w-4" />
                    <span className="truncate max-w-[100px]">{selectedName}</span>
                    <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0" align="start">
                <div className="max-h-[300px] overflow-auto">
                    {/* Option: All */}
                    <button
                        onClick={() => handleSelect(null)}
                        className={cn(
                            "flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-slate-100 transition-colors",
                            !selectedId && "bg-slate-100"
                        )}
                    >
                        <Check className={cn("h-4 w-4", !selectedId ? "opacity-100" : "opacity-0")} />
                        <span className="font-medium">Todos os afiliados</span>
                    </button>

                    <div className="border-t border-slate-100 my-1" />

                    {isLoading ? (
                        <div className="px-3 py-2 text-sm text-slate-500">Carregando...</div>
                    ) : affiliates.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-slate-500">Nenhum afiliado encontrado</div>
                    ) : (
                        affiliates.map((affiliate) => (
                            <button
                                key={affiliate.id}
                                onClick={() => handleSelect(affiliate)}
                                className={cn(
                                    "flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-slate-100 transition-colors",
                                    selectedId === affiliate.id && "bg-slate-100"
                                )}
                            >
                                <Check className={cn("h-4 w-4", selectedId === affiliate.id ? "opacity-100" : "opacity-0")} />
                                <div className="flex flex-col">
                                    <span className="font-medium">{affiliate.name}</span>
                                    <span className="text-xs text-slate-500">{affiliate.email}</span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
