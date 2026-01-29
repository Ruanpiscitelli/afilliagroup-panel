import { useRef, useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, RefreshCw, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import jspreadsheet from 'jspreadsheet-ce';
import 'jspreadsheet-ce/dist/jspreadsheet.css';

interface Metric {
    id: number;
    date: string;
    userId: string;
    userName: string;
    userEmail: string;
    campaign: string;
    clicks: number;
    registrations: number;
    ftds: number;
    qualifiedCpa: number;
    depositAmount: number;
    commissionCpa: number;
    commissionRev: number;
}

interface Affiliate {
    id: string;
    name: string;
    email: string;
    status: string;
}

export function MetricsSpreadsheet() {
    const queryClient = useQueryClient();
    const spreadsheetRef = useRef<HTMLDivElement>(null);
    const jspreadsheetInstance = useRef<any>(null);
    const [changedRows, setChangedRows] = useState<Map<number, Record<string, number>>>(new Map());
    const [filters, setFilters] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        userId: '',
        page: 1,
        limit: 100,
    });

    // Fetch affiliates for filter dropdown
    const { data: affiliatesData } = useQuery({
        queryKey: ['admin-affiliates-all'],
        queryFn: async () => {
            const { data } = await adminApi.getAffiliates('all');
            return data;
        },
    });
    const affiliates: Affiliate[] = affiliatesData?.users || [];

    // Fetch metrics
    const { data: metricsData, isLoading, refetch } = useQuery({
        queryKey: ['admin-metrics-all', filters],
        queryFn: async () => {
            const { data } = await adminApi.getAllMetrics({
                startDate: filters.startDate,
                endDate: filters.endDate,
                userId: filters.userId || undefined,
                page: filters.page,
                limit: filters.limit,
            });
            return data;
        },
    });

    const metrics: Metric[] = metricsData?.metrics || [];
    const pagination = metricsData?.pagination || { page: 1, totalPages: 1, total: 0 };

    // Bulk update mutation
    const bulkUpdateMutation = useMutation({
        mutationFn: (updates: Array<{ id: number; data: Record<string, number> }>) =>
            adminApi.bulkUpdateMetrics(updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-metrics-all'] });
            setChangedRows(new Map());
            alert('Métricas atualizadas com sucesso!');
        },
        onError: (error: any) => {
            alert(`Erro ao salvar: ${error.response?.data?.error || error.message}`);
        },
    });

    // Handle cell changes
    const handleCellChange = useCallback((_instance: unknown, _cell: unknown, x: string | number, y: string | number, value: unknown) => {
        const rowIndex = typeof y === 'string' ? parseInt(y) : y;
        const colIndex = typeof x === 'string' ? parseInt(x) : x;

        if (!metrics[rowIndex]) return;

        const metricId = metrics[rowIndex].id;
        const columns = ['date', 'userName', 'campaign', 'clicks', 'registrations', 'ftds', 'qualifiedCpa', 'depositAmount', 'commissionCpa', 'commissionRev'];
        const fieldName = columns[colIndex];

        // Only track numeric changes (skip date, userName, campaign)
        if (colIndex >= 3) {
            const numericValue = parseFloat(String(value)) || 0;
            const currentChanges = changedRows.get(metricId) || {};
            currentChanges[fieldName] = numericValue;
            setChangedRows(prev => new Map(prev).set(metricId, currentChanges));
        }
    }, [metrics]);

    // Initialize spreadsheet
    useEffect(() => {
        if (!spreadsheetRef.current || metrics.length === 0) return;

        // Clear previous instance
        if (jspreadsheetInstance.current) {
            jspreadsheetInstance.current.destroy();
        }

        // Prepare data
        const data = metrics.map(m => [
            m.date,
            m.userName,
            m.campaign,
            m.clicks,
            m.registrations,
            m.ftds,
            m.qualifiedCpa,
            m.depositAmount,
            m.commissionCpa,
            m.commissionRev,
        ]);

        // Create spreadsheet (cast to any to avoid strict type checking with jspreadsheet-ce)
        jspreadsheetInstance.current = jspreadsheet(spreadsheetRef.current, {
            data,
            columns: [
                { type: 'text', title: 'Data', width: 100, readOnly: true },
                { type: 'text', title: 'Afiliado', width: 150, readOnly: true },
                { type: 'text', title: 'Campanha', width: 120, readOnly: true },
                { type: 'numeric', title: 'Clicks', width: 70 },
                { type: 'numeric', title: 'Cadastros', width: 80 },
                { type: 'numeric', title: 'FTDs', width: 60 },
                { type: 'numeric', title: 'CPA Qual.', width: 80 },
                { type: 'numeric', title: 'Depósito', width: 100 },
                { type: 'numeric', title: 'Com. CPA', width: 100 },
                { type: 'numeric', title: 'Com. REV', width: 100 },
            ],
            tableOverflow: true,
            tableHeight: '500px',
            tableWidth: '100%',
            defaultColWidth: 80,
            minSpareRows: 0,
            allowInsertRow: false,
            allowInsertColumn: false,
            allowDeleteRow: false,
            allowDeleteColumn: false,
            columnSorting: true,
            search: true,
            onchange: handleCellChange,
        } as any);

        return () => {
            if (jspreadsheetInstance.current) {
                jspreadsheetInstance.current.destroy();
                jspreadsheetInstance.current = null;
            }
        };
    }, [metrics, handleCellChange]);

    // Save changes
    const handleSave = () => {
        if (changedRows.size === 0) {
            alert('Nenhuma alteração para salvar');
            return;
        }

        const updates = Array.from(changedRows.entries()).map(([id, data]) => ({
            id,
            data,
        }));

        bulkUpdateMutation.mutate(updates);
    };

    const handleFilterChange = () => {
        setFilters(prev => ({ ...prev, page: 1 }));
        refetch();
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Planilha de Métricas</h1>
                    <p className="text-slate-500 mt-1">
                        Edite métricas diretamente como uma planilha Excel
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {changedRows.size > 0 && (
                        <span className="text-sm text-orange-600 font-medium">
                            {changedRows.size} alteração(ões) pendente(s)
                        </span>
                    )}
                    <Button
                        onClick={handleSave}
                        disabled={changedRows.size === 0 || bulkUpdateMutation.isPending}
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {bulkUpdateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                    <Button variant="outline" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Atualizar
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filtros
                    </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                    <div className="flex items-end gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs">Data Início</Label>
                            <Input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                className="w-40"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Data Fim</Label>
                            <Input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                className="w-40"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Afiliado</Label>
                            <Select
                                value={filters.userId || 'all'}
                                onValueChange={(val) => setFilters(prev => ({ ...prev, userId: val === 'all' ? '' : val }))}
                            >
                                <SelectTrigger className="w-56">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Afiliados</SelectItem>
                                    {affiliates.map((aff) => (
                                        <SelectItem key={aff.id} value={aff.id}>
                                            {aff.name} ({aff.status})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleFilterChange}>
                            Aplicar Filtros
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Spreadsheet */}
            <Card>
                <CardContent className="p-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin h-8 w-8 border-4 border-slate-300 border-t-slate-900 rounded-full" />
                        </div>
                    ) : metrics.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <p className="text-lg font-medium">Nenhuma métrica encontrada</p>
                            <p className="text-sm mt-2">Ajuste os filtros acima para buscar métricas</p>
                        </div>
                    ) : (
                        <>
                            <div ref={spreadsheetRef} className="overflow-auto" />

                            {/* Pagination */}
                            <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                <div className="text-sm text-slate-500">
                                    Mostrando {metrics.length} de {pagination.total} registros
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                                        disabled={pagination.page <= 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Anterior
                                    </Button>
                                    <span className="text-sm text-slate-600">
                                        Página {pagination.page} de {pagination.totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                                        disabled={pagination.page >= pagination.totalPages}
                                    >
                                        Próxima
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Instructions */}
            <div className="mt-4 text-sm text-slate-500">
                <p><strong>Dica:</strong> Clique em uma célula para editar. Colunas cinzas são somente leitura.</p>
                <p>As alterações são salvas em lote ao clicar em "Salvar Alterações".</p>
            </div>
        </div>
    );
}
