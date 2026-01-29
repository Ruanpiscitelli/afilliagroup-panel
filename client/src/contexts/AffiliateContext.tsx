import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/services/api';

interface AffiliateContextType {
    selectedAffiliateId: string | null;
    setSelectedAffiliateId: (id: string) => void;
    isMasterAccount: boolean;
    subAccounts: { id: string; name: string; avatarUrl: string | null }[];
    isLoading: boolean;
}

const AffiliateContext = createContext<AffiliateContextType | undefined>(undefined);

export function AffiliateProvider({ children }: { children: React.ReactNode }) {
    const [selectedAffiliateId, setSelectedAffiliateId] = useState<string | null>(null);

    const { data: userData, isLoading } = useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            const { data } = await authApi.me();
            return data.user;
        },
    });

    // Initialize selected ID
    useEffect(() => {
        if (userData?.id && !selectedAffiliateId) {
            // ADMIN users should see ALL data by default
            // Affiliates with children (sub-accounts) should also see 'all'
            // Regular affiliates see only their own data
            const isAdmin = userData.role === 'ADMIN';
            const hasChildren = userData.children && userData.children.length > 0;
            setSelectedAffiliateId((isAdmin || hasChildren) ? 'all' : userData.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userData?.id, userData?.children?.length, userData?.role]);

    const subAccounts = userData?.children || [];
    const isMasterAccount = subAccounts.length > 0;

    return (
        <AffiliateContext.Provider
            value={{
                selectedAffiliateId: selectedAffiliateId || userData?.id || null,
                setSelectedAffiliateId,
                isMasterAccount,
                subAccounts,
                isLoading,
            }}
        >
            {children}
        </AffiliateContext.Provider>
    );
}

export function useAffiliate() {
    const context = useContext(AffiliateContext);
    if (context === undefined) {
        throw new Error('useAffiliate must be used within an AffiliateProvider');
    }
    return context;
}
