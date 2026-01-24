import { createContext, useContext, useState, ReactNode } from 'react';
import { startOfMonth, endOfMonth, format } from 'date-fns';

interface DateRange {
    from: Date;
    to: Date;
}

interface DateRangeContextType {
    dateRange: DateRange;
    setDateRange: (range: DateRange) => void;
    formattedRange: { startDate: string; endDate: string };
}

const DateRangeContext = createContext<DateRangeContextType | null>(null);

export function DateRangeProvider({ children }: { children: ReactNode }) {
    const [dateRange, setDateRange] = useState<DateRange>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });

    const formattedRange = {
        startDate: format(dateRange.from, 'yyyy-MM-dd'),
        endDate: format(dateRange.to, 'yyyy-MM-dd'),
    };

    return (
        <DateRangeContext.Provider value={{ dateRange, setDateRange, formattedRange }}>
            {children}
        </DateRangeContext.Provider>
    );
}

export function useDateRange() {
    const context = useContext(DateRangeContext);
    if (!context) {
        throw new Error('useDateRange must be used within a DateRangeProvider');
    }
    return context;
}
