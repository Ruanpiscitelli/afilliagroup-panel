import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAffiliate } from '@/contexts/AffiliateContext';
import { useAuth } from '@/hooks/useAuth';
import { Users } from 'lucide-react';

export function AffiliateSwitcher() {
    const { user } = useAuth();
    const {
        selectedAffiliateId,
        setSelectedAffiliateId,
        isMasterAccount,
        subAccounts,
    } = useAffiliate();

    if (!isMasterAccount || !user) {
        return (
            <div className="flex items-center gap-2 text-slate-700">
                <span className="font-semibold">{user?.name}</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" />
            <Select
                value={selectedAffiliateId || 'all'}
                onValueChange={setSelectedAffiliateId}
            >
                <SelectTrigger className="w-[240px] h-9 bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">
                        <span className="font-medium">Visão Geral</span> (Todos)
                    </SelectItem>
                    <SelectItem value={user.id}>
                        <span className="font-medium">{user.name}</span> (Minha Conta)
                    </SelectItem>
                    {subAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                            {account.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
