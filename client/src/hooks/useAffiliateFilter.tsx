import { createContext, useContext, useState, ReactNode } from 'react';

interface AffiliateFilterContextType {
    selectedAffiliate: string | null;
    setSelectedAffiliate: (id: string | null) => void;
    affiliateName: string;
}

const AffiliateFilterContext = createContext<AffiliateFilterContextType | null>(null);

export function AffiliateFilterProvider({ children }: { children: ReactNode }) {
    const [selectedAffiliate, setSelectedAffiliate] = useState<string | null>(null);
    const [affiliateName] = useState('Todos'); // Removed setAffiliateName

    const handleSetAffiliate = (id: string | null) => {
        setSelectedAffiliate(id);
    };

    return (
        <AffiliateFilterContext.Provider
            value={{
                selectedAffiliate,
                setSelectedAffiliate: handleSetAffiliate,
                affiliateName,
            }}
        >
            {children}
        </AffiliateFilterContext.Provider>
    );
}

export function useAffiliateFilter() {
    const context = useContext(AffiliateFilterContext);
    if (!context) {
        throw new Error('useAffiliateFilter must be used within an AffiliateFilterProvider');
    }
    return context;
}
