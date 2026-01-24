import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { metricsApi } from '@/services/api';
import { useDateRange } from '@/hooks/useDateRange';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FunnelChart } from '@/components/charts/FunnelChart';
import { CampaignBarChart } from '@/components/charts/CampaignBarChart';
import { TimeSeriesChart } from '@/components/charts/TimeSeriesChart';
import { useAffiliate } from '@/contexts/AffiliateContext';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Users,
    UserPlus,
    Target,
    DollarSign,
    Wallet,
    TrendingUp,
    Calculator,
    Search,
    Download,
    ChevronDown,
} from 'lucide-react';

export function ResultsPage() {
    const { formattedRange } = useDateRange();
    const { selectedAffiliateId } = useAffiliate();
    const [mainTab, setMainTab] = useState('tabelas');
    const [tableTab, setTableTab] = useState('afiliados');
    const [searchTerm, setSearchTerm] = useState('');

    const affiliateParams = (selectedAffiliateId && selectedAffiliateId !== 'all') ? selectedAffiliateId : undefined;

    const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
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



    const { data: timeSeriesData, isLoading: isLoadingTimeSeries } = useQuery({
        queryKey: ['timeSeries', formattedRange, affiliateParams],
        queryFn: async () => {
            const { data } = await metricsApi.getTimeSeries(
                formattedRange.startDate,
                formattedRange.endDate,
                affiliateParams
            );
            return data;
        },
    });

    const { data: topCampaignsData, isLoading: isLoadingTopCampaigns } = useQuery({
        queryKey: ['topCampaigns', formattedRange, affiliateParams],
        queryFn: async () => {
            const { data } = await metricsApi.getTopCampaigns(
                formattedRange.startDate,
                formattedRange.endDate,
                50,
                affiliateParams
            );
            return data;
        },
    });

    if (isLoadingDashboard || isLoadingTimeSeries || isLoadingTopCampaigns) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    const topCampaigns = topCampaignsData?.campaigns || [];
    const summary = dashboardData?.summary || {};

    // Aggregate data by affiliate
    const affiliateData = topCampaigns.reduce((acc: any, item: any) => {
        const name = item.affiliate || 'Desconhecido';
        if (!acc[name]) {
            acc[name] = {
                name,
                registrations: 0,
                ftds: 0,
                qualifiedCpa: 0,
                depositAmount: 0,
                commissionCpa: 0,
                commissionRev: 0,
                totalCommission: 0,
            };
        }
        acc[name].registrations += item.registrations || 0;
        acc[name].ftds += item.ftds || 0;
        acc[name].qualifiedCpa += item.qualifiedCpa || 0;
        acc[name].depositAmount += item.depositAmount || 0;
        acc[name].commissionCpa += item.commissionCpa || 0;
        acc[name].commissionRev += item.commissionRev || 0;
        acc[name].totalCommission += item.totalCommission || 0;
        return acc;
    }, {});

    const affiliateList = Object.values(affiliateData);

    // Filter based on search
    const filteredAffiliates = affiliateList.filter((aff: any) => {
        return aff.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const filteredCampaigns = topCampaigns.filter((camp: { campaign?: string; affiliate?: string }) => {
        return camp.campaign?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            camp.affiliate?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const handleExportCSV = () => {
        const data = tableTab === 'afiliados' ? filteredAffiliates : filteredCampaigns;
        const headers = ['Afiliado', 'Cadastros', 'FTDs', 'CPA Qual.', 'Depósitos', 'Conv%', 'CPA R$', 'REV R$', 'Total'];

        const csvContent = [
            headers.join(','),
            ...data.map((row: any) => [
                row.name || row.affiliate,
                row.registrations,
                row.ftds,
                row.qualifiedCpa,
                row.depositAmount?.toFixed(2),
                row.ftds && row.registrations ? ((row.ftds / row.registrations) * 100).toFixed(0) + '%' : '0%',
                row.commissionCpa?.toFixed(2),
                row.commissionRev?.toFixed(2),
                row.totalCommission?.toFixed(2)
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resultados_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-slate-900">Resultados</h1>
            </div>

            {/* Main Tabs: Gráficos / Tabelas */}
            <Tabs value={mainTab} onValueChange={setMainTab}>
                <TabsList className="border-b border-slate-200 bg-transparent p-0 h-auto">
                    <TabsTrigger
                        value="graficos"
                        className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=inactive]:text-slate-500 rounded-none px-4 pb-3 pt-0 bg-transparent shadow-none"
                    >
                        Gráficos
                    </TabsTrigger>
                    <TabsTrigger
                        value="tabelas"
                        className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=inactive]:text-slate-500 rounded-none px-4 pb-3 pt-0 bg-transparent shadow-none"
                    >
                        Tabelas
                    </TabsTrigger>
                </TabsList>

                {/* Gráficos Tab */}
                <TabsContent value="graficos" className="space-y-6 pt-4">
                    {/* Funnel Chart - Compact */}
                    <Card className="bg-gradient-to-r from-slate-50 to-white">
                        <CardHeader className="pb-0">
                            <CardTitle className="text-base font-medium">Funil de conversão</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <FunnelChart data={dashboardData?.funnelData || []} />
                        </CardContent>
                    </Card>

                    {/* Campaign Charts - Side by Side with proper sizing */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Card className="border-slate-200">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                                <CardTitle className="text-sm font-medium text-slate-700">CPA (R$) por Campanha</CardTitle>
                                <div className="flex gap-1">
                                    <Button variant="outline" size="sm" className="h-6 px-2 text-xs">R$</Button>
                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-slate-400">Qtd.</Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0 pb-4">
                                <CampaignBarChart
                                    data={filteredCampaigns}
                                    dataKey="commissionCpa"
                                    title=""
                                />
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200">
                            <CardHeader className="pb-2 pt-4">
                                <CardTitle className="text-sm font-medium text-slate-700">REV (R$) por Campanha</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 pb-4">
                                <CampaignBarChart
                                    data={filteredCampaigns}
                                    dataKey="commissionRev"
                                    title=""
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Time Series Chart - Full Width */}
                    <Card className="border-slate-200">
                        <CardContent className="pt-4 pb-4">
                            <TimeSeriesChart data={timeSeriesData?.timeSeries || []} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tabelas Tab */}
                <TabsContent value="tabelas" className="space-y-6 pt-4">
                    {/* Summary Metric Cards */}
                    <div className="grid grid-cols-4 gap-4">
                        <Card className="border border-slate-200">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 rounded-lg">
                                        <UserPlus className="h-5 w-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            Cadastros <span className="text-slate-400">ⓘ</span>
                                        </p>
                                        <p className="text-xl font-bold text-slate-900">
                                            {summary.registrations || 0}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 rounded-lg">
                                        <Users className="h-5 w-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            FTD <span className="text-slate-400">ⓘ</span>
                                        </p>
                                        <p className="text-xl font-bold text-slate-900">
                                            {summary.ftds || 0}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 rounded-lg">
                                        <Target className="h-5 w-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            CPA Qual. <span className="text-slate-400">ⓘ</span>
                                        </p>
                                        <p className="text-xl font-bold text-slate-900">
                                            {summary.qualifiedCpa || 0}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 rounded-lg">
                                        <DollarSign className="h-5 w-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            Depósitos (R$) <span className="text-slate-400">ⓘ</span>
                                        </p>
                                        <p className="text-xl font-bold text-slate-900">
                                            {formatCurrency(summary.depositAmount || 0)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Second Row of Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <Card className="border border-slate-200">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 rounded-lg">
                                        <Wallet className="h-5 w-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            CPA (R$) <span className="text-slate-400">ⓘ</span>
                                        </p>
                                        <p className="text-xl font-bold text-slate-900">
                                            {formatCurrency(summary.commissionCpa || 0)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 rounded-lg">
                                        <TrendingUp className="h-5 w-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            REV (R$) <span className="text-slate-400">ⓘ</span>
                                        </p>
                                        <p className="text-xl font-bold text-slate-900">
                                            {formatCurrency(summary.commissionRev || 0)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 rounded-lg">
                                        <Calculator className="h-5 w-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            Total <span className="text-slate-400">ⓘ</span>
                                        </p>
                                        <p className="text-xl font-bold text-slate-900">
                                            {formatCurrency((summary.commissionCpa || 0) + (summary.commissionRev || 0))}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Table Section */}
                    <Card>
                        <CardContent className="p-0">
                            {/* Table Tabs and Search */}
                            <div className="flex items-center justify-between p-4 border-b border-slate-200">
                                <div className="flex gap-0">
                                    <button
                                        onClick={() => setTableTab('afiliados')}
                                        className={`px - 4 py - 2 text - sm font - medium border - b - 2 transition - colors ${tableTab === 'afiliados'
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-slate-500 hover:text-slate-700'
                                            } `}
                                    >
                                        Afiliados
                                    </button>
                                    <button
                                        onClick={() => setTableTab('campanhas')}
                                        className={`px - 4 py - 2 text - sm font - medium border - b - 2 transition - colors ${tableTab === 'campanhas'
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-slate-500 hover:text-slate-700'
                                            } `}
                                    >
                                        Campanhas
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder="Pesquisar"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-9 w-48 h-9"
                                        />
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleExportCSV}
                                        className="gap-2"
                                    >
                                        <Download className="h-4 w-4" />
                                        Exportar CSV
                                    </Button>
                                </div>
                            </div>

                            {/* Data Table */}
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead className="font-medium">
                                            <button className="flex items-center gap-1 hover:text-slate-900">
                                                {tableTab === 'afiliados' ? 'Afiliado/Data' : 'Campanha'}
                                                <ChevronDown className="h-3 w-3" />
                                            </button>
                                        </TableHead>
                                        <TableHead className="font-medium">
                                            <button className="flex items-center gap-1 hover:text-slate-900">
                                                Cadastros <ChevronDown className="h-3 w-3" />
                                            </button>
                                        </TableHead>
                                        <TableHead className="font-medium">
                                            <button className="flex items-center gap-1 hover:text-slate-900">
                                                FTDs <ChevronDown className="h-3 w-3" />
                                            </button>
                                        </TableHead>
                                        <TableHead className="font-medium">
                                            <button className="flex items-center gap-1 hover:text-slate-900">
                                                CPA Qual. <ChevronDown className="h-3 w-3" />
                                            </button>
                                        </TableHead>
                                        <TableHead className="font-medium">
                                            <button className="flex items-center gap-1 hover:text-slate-900">
                                                Depósitos (R$) <ChevronDown className="h-3 w-3" />
                                            </button>
                                        </TableHead>
                                        <TableHead className="font-medium">
                                            <button className="flex items-center gap-1 hover:text-slate-900">
                                                Conv% <ChevronDown className="h-3 w-3" />
                                            </button>
                                        </TableHead>
                                        <TableHead className="font-medium">
                                            <button className="flex items-center gap-1 hover:text-slate-900">
                                                CPA R$ <ChevronDown className="h-3 w-3" />
                                            </button>
                                        </TableHead>
                                        <TableHead className="font-medium">
                                            <button className="flex items-center gap-1 hover:text-slate-900">
                                                REV R$ <ChevronDown className="h-3 w-3" />
                                            </button>
                                        </TableHead>
                                        <TableHead className="font-medium">
                                            <button className="flex items-center gap-1 hover:text-slate-900">
                                                Total <ChevronDown className="h-3 w-3" />
                                            </button>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tableTab === 'afiliados' ? (
                                        filteredAffiliates.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={9} className="text-center text-slate-500 py-8">
                                                    Nenhum afiliado encontrado
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredAffiliates.map((aff: any, index: number) => {
                                                const convRate = aff.registrations > 0
                                                    ? (aff.ftds / aff.registrations) * 100
                                                    : 0;
                                                return (
                                                    <TableRow key={index} className="hover:bg-slate-50">
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-slate-400">›</span>
                                                                <span className="font-medium">{aff.name}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{aff.registrations}</TableCell>
                                                        <TableCell>{aff.ftds}</TableCell>
                                                        <TableCell>{aff.qualifiedCpa}</TableCell>
                                                        <TableCell>{formatCurrency(aff.depositAmount)}</TableCell>
                                                        <TableCell className={convRate > 0 ? 'text-green-600' : ''}>
                                                            {convRate.toFixed(0)}%
                                                        </TableCell>
                                                        <TableCell>{formatCurrency(aff.commissionCpa)}</TableCell>
                                                        <TableCell>{formatCurrency(aff.commissionRev)}</TableCell>
                                                        <TableCell className="font-semibold">
                                                            {formatCurrency(aff.totalCommission)}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )
                                    ) : (
                                        filteredCampaigns.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={9} className="text-center text-slate-500 py-8">
                                                    Nenhuma campanha encontrada
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredCampaigns.map((campaign: any, index: number) => (
                                                <TableRow key={index} className="hover:bg-slate-50">
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-slate-400">›</span>
                                                            <div>
                                                                <p className="font-medium">{campaign.campaign}</p>
                                                                <p className="text-xs text-slate-500">{campaign.affiliate}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{campaign.registrations}</TableCell>
                                                    <TableCell>{campaign.ftds}</TableCell>
                                                    <TableCell>{campaign.qualifiedCpa}</TableCell>
                                                    <TableCell>{formatCurrency(campaign.depositAmount)}</TableCell>
                                                    <TableCell className={campaign.conversionRate > 0 ? 'text-green-600' : ''}>
                                                        {formatPercent(campaign.conversionRate)}
                                                    </TableCell>
                                                    <TableCell>{formatCurrency(campaign.commissionCpa)}</TableCell>
                                                    <TableCell>{formatCurrency(campaign.commissionRev)}</TableCell>
                                                    <TableCell className="font-semibold">
                                                        {formatCurrency(campaign.totalCommission)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
