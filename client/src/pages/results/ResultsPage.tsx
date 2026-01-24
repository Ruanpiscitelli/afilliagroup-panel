import { useQuery } from '@tanstack/react-query';
import { metricsApi } from '@/services/api';
import { useDateRange } from '@/hooks/useDateRange';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FunnelChart } from '@/components/charts/FunnelChart';
import { CampaignBarChart } from '@/components/charts/CampaignBarChart';
import { TimeSeriesChart } from '@/components/charts/TimeSeriesChart';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export function ResultsPage() {
    const { formattedRange } = useDateRange();

    const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
        queryKey: ['dashboard', formattedRange],
        queryFn: async () => {
            const { data } = await metricsApi.getDashboard(
                formattedRange.startDate,
                formattedRange.endDate
            );
            return data;
        },
    });

    const { data: campaignData, isLoading: isLoadingCampaigns } = useQuery({
        queryKey: ['byCampaign', formattedRange],
        queryFn: async () => {
            const { data } = await metricsApi.getByCampaign(
                formattedRange.startDate,
                formattedRange.endDate
            );
            return data;
        },
    });

    const { data: timeSeriesData, isLoading: isLoadingTimeSeries } = useQuery({
        queryKey: ['timeSeries', formattedRange],
        queryFn: async () => {
            const { data } = await metricsApi.getTimeSeries(
                formattedRange.startDate,
                formattedRange.endDate
            );
            return data;
        },
    });

    const { data: topCampaignsData, isLoading: isLoadingTopCampaigns } = useQuery({
        queryKey: ['topCampaigns', formattedRange],
        queryFn: async () => {
            const { data } = await metricsApi.getTopCampaigns(
                formattedRange.startDate,
                formattedRange.endDate,
                10
            );
            return data;
        },
    });

    const isLoading = isLoadingDashboard || isLoadingCampaigns || isLoadingTimeSeries || isLoadingTopCampaigns;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    const campaigns = campaignData?.campaigns || [];
    const topCampaigns = topCampaignsData?.campaigns || [];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-slate-900">Resultados</h1>
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

            {/* Campaign Charts */}
            <div className="grid grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base font-medium">CPA (R$) por Campanha</CardTitle>
                        <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="h-7 px-2 text-xs">R$</Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-500">Qtd.</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <CampaignBarChart
                            data={campaigns}
                            dataKey="commissionCpa"
                            title=""
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-medium">REV (R$) por Campanha</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CampaignBarChart
                            data={campaigns}
                            dataKey="commissionRev"
                            title=""
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Time Series Chart */}
            <Card>
                <CardContent className="pt-6">
                    <TimeSeriesChart data={timeSeriesData?.timeSeries || []} />
                </CardContent>
            </Card>

            {/* Detailed Campaign Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-medium">Detalhamento por Campanha</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Afiliado</TableHead>
                                <TableHead>Campanha</TableHead>
                                <TableHead>Cadastros</TableHead>
                                <TableHead>FTDs</TableHead>
                                <TableHead>CPA Qual.</TableHead>
                                <TableHead>Depósito</TableHead>
                                <TableHead>Conv%</TableHead>
                                <TableHead>CPA R$</TableHead>
                                <TableHead>REV R$</TableHead>
                                <TableHead>Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topCampaigns.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center text-slate-500 py-8">
                                        Nenhuma campanha encontrada
                                    </TableCell>
                                </TableRow>
                            ) : (
                                topCampaigns.map((campaign: any, index: number) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{campaign.affiliate}</TableCell>
                                        <TableCell className="text-slate-600">{campaign.campaign}</TableCell>
                                        <TableCell>{campaign.registrations}</TableCell>
                                        <TableCell>{campaign.ftds}</TableCell>
                                        <TableCell>{campaign.qualifiedCpa}</TableCell>
                                        <TableCell>{formatCurrency(campaign.depositAmount)}</TableCell>
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
