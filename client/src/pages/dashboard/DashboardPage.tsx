import { useQuery } from '@tanstack/react-query';
import { Link2, BarChart3, HelpCircle, Settings2, ArrowRight } from 'lucide-react';
import { metricsApi } from '@/services/api';
import { useDateRange } from '@/hooks/useDateRange';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FunnelChart } from '@/components/charts/FunnelChart';
import { useAffiliate } from '@/contexts/AffiliateContext';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export function DashboardPage() {
    const { formattedRange } = useDateRange();
    const { selectedAffiliateId } = useAffiliate();

    const affiliateParams = (selectedAffiliateId && selectedAffiliateId !== 'all') ? selectedAffiliateId : undefined;

    const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
        // Incluir selectedAffiliateId na key para refazer query ao mudar
        queryKey: ['dashboard', formattedRange, affiliateParams],
        queryFn: async () => {
            const { data } = await metricsApi.getDashboard(
                formattedRange.startDate,
                formattedRange.endDate,
                affiliateParams
            );
            return data;
        },
    });

    const { data: topCampaignsData, isLoading: isLoadingCampaigns } = useQuery({
        queryKey: ['topCampaigns', formattedRange, affiliateParams],
        queryFn: async () => {
            const { data } = await metricsApi.getTopCampaigns(
                formattedRange.startDate,
                formattedRange.endDate,
                5,
                affiliateParams
            );
            return data;
        },
    });

    if (isLoadingDashboard || isLoadingCampaigns) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    const totals = dashboardData?.totals || {
        commissionTotal: 0,
        commissionCpa: 0,
        commissionRev: 0,
        registrations: 0,
        ftds: 0,
        qualifiedCpa: 0,
    };

    const campaigns = topCampaignsData?.campaigns || [];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-slate-900">Início</h1>
            </div>

            {/* Commission Cards */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-1 text-slate-500 text-sm mb-2">
                        Comissão total
                        <HelpCircle className="h-4 w-4" />
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-4">
                        {formatCurrency(totals.commissionTotal)}
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg">
                            <Settings2 className="h-5 w-5 text-slate-400" />
                            <div>
                                <div className="flex items-center gap-1 text-slate-500 text-xs">
                                    CPA (R$)
                                    <HelpCircle className="h-3 w-3" />
                                </div>
                                <p className="text-xl font-semibold text-slate-900">
                                    {formatCurrency(totals.commissionCpa)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg">
                            <Settings2 className="h-5 w-5 text-slate-400" />
                            <div>
                                <div className="flex items-center gap-1 text-slate-500 text-xs">
                                    REV (R$)
                                    <HelpCircle className="h-3 w-3" />
                                </div>
                                <p className="text-xl font-semibold text-slate-900">
                                    {formatCurrency(totals.commissionRev)}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Access */}
            <div>
                <h2 className="text-sm font-medium text-slate-700 mb-3">Acesso rápido</h2>
                <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg">
                                    <Link2 className="h-5 w-5 text-slate-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900">Meus links</p>
                                    <p className="text-sm text-slate-500">Visualize seus links de afiliado.</p>
                                </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-slate-400" />
                        </div>
                    </Card>
                    <Card className="p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg">
                                    <BarChart3 className="h-5 w-5 text-slate-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900">Dashboard</p>
                                    <p className="text-sm text-slate-500">Análise os dados da sua operação.</p>
                                </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-slate-400" />
                        </div>
                    </Card>
                </div>
            </div>

            {/* Funnel Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-medium">Funil de conversão</CardTitle>
                </CardHeader>
                <CardContent>
                    <FunnelChart data={dashboardData?.funnelData || []} />
                </CardContent>
            </Card>

            {/* Top 5 Campaigns Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-medium">Top 5 Campanhas</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Afiliado ↑</TableHead>
                                <TableHead>Campanha ↕</TableHead>
                                <TableHead>Cadastros ↕</TableHead>
                                <TableHead>FTDs ↕</TableHead>
                                <TableHead>CPA Qual. ↕</TableHead>
                                <TableHead>Depósito ↕</TableHead>
                                <TableHead>Conv% ↕</TableHead>
                                <TableHead>CPA R$ ↕</TableHead>
                                <TableHead>REV R$ ↕</TableHead>
                                <TableHead>Total ↕</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {campaigns.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center text-slate-500 py-8">
                                        Nenhuma campanha encontrada
                                    </TableCell>
                                </TableRow>
                            ) : (
                                campaigns.map((campaign: any, index: number) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{campaign.affiliate}</TableCell>
                                        <TableCell className="text-slate-600">{campaign.campaign}</TableCell>
                                        <TableCell>{campaign.registrations}</TableCell>
                                        <TableCell>{campaign.ftds}</TableCell>
                                        <TableCell>{formatCurrency(campaign.depositAmount)}</TableCell>
                                        <TableCell>{campaign.qualifiedCpa}</TableCell>
                                        <TableCell className={campaign.conversionRate > 0 ? 'text-green-600 font-medium' : 'text-red-500'}>
                                            {formatPercent(campaign.conversionRate)}
                                        </TableCell>
                                        <TableCell>{formatCurrency(campaign.commissionCpa)}</TableCell>
                                        <TableCell>{formatCurrency(campaign.commissionRev)}</TableCell>
                                        <TableCell className="font-semibold text-green-600">
                                            {formatCurrency(campaign.totalCommission)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
