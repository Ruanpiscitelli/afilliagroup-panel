import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
    Target,
    DollarSign,
    Percent,
    Search,
    Download,
    TrendingUp,
    Wallet,
    CreditCard
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { subDays } from 'date-fns';
import { DateRangePicker } from '@/components/ui/date-range-picker';

export function AdminDashboardPage() {
    const [dateRange, setDateRange] = useState({
        start: subDays(new Date(), 30).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
    });
    const [searchTerm, setSearchTerm] = useState('');

    const { data: performanceData, isLoading } = useQuery({
        queryKey: ['admin-performance', dateRange],
        queryFn: async () => {
            const { data } = await adminApi.getPerformanceAffiliates(dateRange.start, dateRange.end);
            return data;
        },
    });

    const totals = performanceData?.totals || {
        registrations: 0,
        ftds: 0,
        qualifiedCpa: 0,
        depositAmount: 0,
        commissionCpa: 0,
        commissionRev: 0,
        totalCommission: 0,
    };

    const affiliates = performanceData?.data || [];

    const filteredAffiliates = affiliates.filter((aff: any) =>
        aff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aff.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const kpiCards = [
        {
            title: 'Cadastros',
            value: totals.registrations,
            icon: Users,
            description: 'Total no período',
        },
        {
            title: 'FTDs',
            value: totals.ftds,
            icon: Target,
            description: 'Primeiros depósitos',
        },
        {
            title: 'CPA Qualificado',
            value: totals.qualifiedCpa,
            icon: TrendingUp,
            description: 'Aprovados',
        },
        {
            title: 'Depósitos (R$)',
            value: formatCurrency(totals.depositAmount),
            icon: Wallet,
            description: 'Volume total',
        },
        {
            title: 'CPA (R$)',
            value: formatCurrency(totals.commissionCpa),
            icon: DollarSign,
            description: 'Comissões CPA',
        },
        {
            title: 'REV (R$)',
            value: formatCurrency(totals.commissionRev),
            icon: Percent,
            description: 'Revenue Share',
        },
        {
            title: 'Total (R$)',
            value: formatCurrency(totals.totalCommission),
            icon: CreditCard,
            description: 'Total a pagar',
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-end items-center gap-4">
                <div className="flex items-center gap-2">
                    <DateRangePicker
                        date={{
                            from: new Date(dateRange.start),
                            to: new Date(dateRange.end)
                        }}
                        onDateChange={(range) => {
                            if (range?.from) {
                                setDateRange({
                                    start: range.from.toISOString().split('T')[0],
                                    end: (range.to || range.from).toISOString().split('T')[0]
                                });
                            }
                        }}
                    />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                {kpiCards.map((card, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">
                                {card.title}
                            </CardTitle>
                            <card.icon className="h-4 w-4 text-slate-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold text-slate-900">{card.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Area */}
            <Tabs defaultValue="affiliates" className="w-full">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                    <TabsList>
                        <TabsTrigger value="affiliates">Afiliados</TabsTrigger>
                        <TabsTrigger value="campaigns" disabled>Campanhas (Em breve)</TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Pesquisar afiliado..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <Button variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Exportar CSV
                        </Button>
                    </div>
                </div>

                <TabsContent value="affiliates" className="mt-0">
                    <div className="rounded-md border bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead className="w-[200px] font-bold text-slate-900">Afiliado</TableHead>
                                    <TableHead className="text-right font-bold text-slate-900">Cadastros</TableHead>
                                    <TableHead className="text-right font-bold text-slate-900">FTDs</TableHead>
                                    <TableHead className="text-right font-bold text-slate-900">CPA Qual.</TableHead>
                                    <TableHead className="text-right font-bold text-slate-900">Depósitos</TableHead>
                                    <TableHead className="text-right font-bold text-slate-900">Conv%</TableHead>
                                    <TableHead className="text-right font-bold text-slate-900">CPA R$</TableHead>
                                    <TableHead className="text-right font-bold text-slate-900">REV R$</TableHead>
                                    <TableHead className="text-right font-bold text-slate-900">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-24 text-center">
                                            Carregando dados...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredAffiliates.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-24 text-center">
                                            Nenhum dado encontrado
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredAffiliates.map((item: any) => (
                                        <TableRow key={item.id} className="hover:bg-slate-50 even:bg-slate-50/50">
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-900">{item.name}</span>
                                                    <span className="text-slate-500 text-xs">{item.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">{item.metrics.registrations}</TableCell>
                                            <TableCell className="text-right font-mono">{item.metrics.ftds}</TableCell>
                                            <TableCell className="text-right font-mono">{item.metrics.qualifiedCpa}</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(item.metrics.depositAmount)}</TableCell>
                                            <TableCell className="text-right font-mono">{item.metrics.conversionRate}%</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(item.metrics.commissionCpa)}</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(item.metrics.commissionRev)}</TableCell>
                                            <TableCell className="text-right font-bold font-mono text-emerald-600">
                                                {formatCurrency(item.metrics.totalCommission)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
