import { useDateRange } from '@/hooks/useDateRange';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { AffiliateSwitcher } from './AffiliateSwitcher';

export function Header() {
    const { dateRange, setDateRange } = useDateRange();

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
            <AffiliateSwitcher />

            {/* Date Range Picker - Now Interactive */}
            <DateRangePicker
                date={dateRange}
                onDateChange={setDateRange}
            />
        </header>
    );
}
