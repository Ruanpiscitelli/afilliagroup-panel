import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDateRange } from '@/hooks/useDateRange';
import { Button } from '@/components/ui/button';

export function Header() {
    const { dateRange } = useDateRange();

    const formatDateRange = () => {
        const from = format(dateRange.from, "d 'de' MMM. 'de' yyyy", { locale: ptBR });
        const to = format(dateRange.to, "d 'de' MMM. 'de' yyyy", { locale: ptBR });
        return `${from} – ${to}`;
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
            <div />

            {/* Date Range Picker */}
            <Button variant="outline" className="gap-2 text-sm font-normal">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span className="text-slate-700">{formatDateRange()}</span>
            </Button>
        </header>
    );
}
