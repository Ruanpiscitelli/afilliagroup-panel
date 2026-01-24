import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Ban, Check, X, ChevronRight, Save, Maximize2, Minimize2, Trash2 } from 'lucide-react';
import { adminApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Affiliate {
    id: string;
    name: string;
    email: string;
    whatsapp: string | null;
    instagram: string | null;
    projectedFtds: string | null;
    cpaAmount: number;
    createdAt: string;
    parentId?: string | null;
    parent?: { id: string; name: string };
    children?: { id: string; name: string }[];
}

interface Metric {
    id: string;
    date: string;
    clicks: number;
    registrations: number;
    ftds: number;
    qualifiedCpa: number;
    depositAmount: number;
    commissionCpa: number;
    commissionRev: number;
    campaign: string;
}

interface Campaign {
    id: number;
    name: string;
    slug: string;
}

export function AdminAffiliatesPage() {
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedAffiliate, setSelectedAffiliate] = useState<string | null>(null);
    const [isMaximized, setIsMaximized] = useState(false);
    const [editingMetric, setEditingMetric] = useState<string | null>(null);
    const [metricValues, setMetricValues] = useState<Partial<Metric>>({});
    const [userData, setUserData] = useState<Partial<Affiliate>>({});
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        whatsapp: '',
        instagram: '',
        projectedFtds: '0-50',
        cpaAmount: 0,
        parentId: '',
    });

    // Add Metric State
    const [isAddMetricOpen, setIsAddMetricOpen] = useState(false);
    const [newMetric, setNewMetric] = useState({
        date: new Date().toISOString().split('T')[0],
        campaignId: '',
        clicks: 0,
        registrations: 0,
        ftds: 0,
        qualifiedCpa: 0,
        depositAmount: 0,
        commissionCpa: 0,
        commissionRev: 0,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['admin-affiliates'],
        queryFn: async () => {
            const { data } = await adminApi.getAffiliates();
            return data;
        },
    });

    const { data: affiliateDetails, isLoading: isLoadingDetails } = useQuery({
        queryKey: ['admin-user', selectedAffiliate],
        queryFn: async () => {
            if (!selectedAffiliate) return null;
            const { data } = await adminApi.getUser(selectedAffiliate);
            return data;
        },
        enabled: !!selectedAffiliate,
    });

    const { data: campaignsData } = useQuery({
        queryKey: ['admin-campaigns'],
        queryFn: async () => {
            const { data } = await adminApi.getCampaigns();
            return data;
        },
    });
    const campaigns: Campaign[] = campaignsData?.campaigns || [];

    const { data: metricsData, isLoading: isLoadingMetrics } = useQuery({
        queryKey: ['admin-metrics', selectedAffiliate],
        queryFn: async () => {
            if (!selectedAffiliate) return null;
            const { data } = await adminApi.getMetrics(selectedAffiliate);
            return data;
        },
        enabled: !!selectedAffiliate,
    });

    const updateUserMutation = useMutation({
        mutationFn: ({ userId, data }: { userId: string; data: any }) =>
            adminApi.updateUser(userId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-user', selectedAffiliate] });
            queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
        },
    });

    const updateMetricMutation = useMutation({
        mutationFn: ({ metricId, data }: { metricId: string; data: Partial<Metric> }) =>
            adminApi.updateMetric(metricId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-metrics', selectedAffiliate] });
            setEditingMetric(null);
            setMetricValues({});
        },
    });

    const banUserMutation = useMutation({
        mutationFn: (userId: string) => adminApi.updateStatus(userId, 'BANNED'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
            setSelectedAffiliate(null);
        },
    });

    const deleteUserMutation = useMutation({
        mutationFn: (userId: string) => adminApi.deleteUser(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
            setSelectedAffiliate(null);
            setIsMaximized(false);
        },
    });

    const createUserMutation = useMutation({
        mutationFn: adminApi.createUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
            setIsCreateOpen(false);
            setNewUser({
                name: '',
                email: '',
                password: '',
                whatsapp: '',
                instagram: '',
                projectedFtds: '0-50',
                cpaAmount: 0,
                parentId: '',
            });
        },
    });

    const createMetricMutation = useMutation({
        mutationFn: (data: any) => adminApi.createMetric(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-metrics', selectedAffiliate] });
            queryClient.invalidateQueries({ queryKey: ['admin-user', selectedAffiliate] });
            setIsAddMetricOpen(false);
            setNewMetric({
                date: new Date().toISOString().split('T')[0],
                campaignId: '',
                clicks: 0,
                registrations: 0,
                ftds: 0,
                qualifiedCpa: 0,
                depositAmount: 0,
                commissionCpa: 0,
                commissionRev: 0,
            });
        },
    });

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        createUserMutation.mutate(newUser);
    };

    const handleSaveUser = () => {
        if (selectedAffiliate && Object.keys(userData).length > 0) {
            updateUserMutation.mutate({ userId: selectedAffiliate, data: userData });
            setUserData({});
        }
    };

    const handleCreateMetric = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAffiliate || !newMetric.campaignId) return;

        createMetricMutation.mutate({
            ...newMetric,
            userId: selectedAffiliate,
            campaignId: Number(newMetric.campaignId),
        });
    };

    const handleSaveMetric = (metricId: string) => {
        updateMetricMutation.mutate({ metricId, data: metricValues });
    };



    const startEditMetric = (metric: Metric) => {
        setEditingMetric(metric.id);
        setMetricValues({
            registrations: metric.registrations,
            ftds: metric.ftds,
            qualifiedCpa: metric.qualifiedCpa,
            depositAmount: metric.depositAmount,
            commissionCpa: metric.commissionCpa,
            commissionRev: metric.commissionRev,
        });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    const affiliates: Affiliate[] = data?.users || [];
    const metrics: Metric[] = metricsData?.metrics || [];

    return (
        <div className="flex h-full">
            {/* Main List */}
            <div className={`flex-1 p-8 transition-all ${selectedAffiliate ? 'pr-4' : ''}`}>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Base de Afiliados</h1>
                        <p className="text-slate-500 mt-1">
                            Clique em um afiliado para ver detalhes e métricas
                        </p>
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Criar Novo
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Criar Novo Afiliado</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateUser}>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Nome *</Label>
                                            <Input
                                                id="name"
                                                value={newUser.name}
                                                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email *</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={newUser.email}
                                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Senha *</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="whatsapp">WhatsApp</Label>
                                            <Input
                                                id="whatsapp"
                                                value={newUser.whatsapp}
                                                onChange={(e) => setNewUser({ ...newUser, whatsapp: e.target.value })}
                                                placeholder="+55 11 99999-9999"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="instagram">Instagram</Label>
                                            <Input
                                                id="instagram"
                                                value={newUser.instagram}
                                                onChange={(e) => setNewUser({ ...newUser, instagram: e.target.value })}
                                                placeholder="@username"
                                            />
                                        </div>
                                    </div>
                                    <Input
                                        id="cpa"
                                        type="number"
                                        step="0.01"
                                        value={newUser.cpaAmount}
                                        onChange={(e) => setNewUser({ ...newUser, cpaAmount: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="parent">Conta Principal (Opcional - Sub-conta)</Label>
                                    <Select
                                        value={newUser.parentId}
                                        onValueChange={(val) => setNewUser({ ...newUser, parentId: val === 'none' ? '' : val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione uma conta principal..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Nenhuma (Conta Independente)</SelectItem>
                                            {affiliates.map((aff) => (
                                                <SelectItem key={aff.id} value={aff.id}>
                                                    {aff.name} ({aff.email})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={createUserMutation.isPending}>
                                        {createUserMutation.isPending ? 'Criando...' : 'Criar Afiliado'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin h-8 w-8 border-4 border-slate-300 border-t-slate-900 rounded-full" />
                            </div>
                        ) : affiliates.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <p className="text-lg font-medium">Nenhum afiliado ativo</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>CPA</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {affiliates.map((user) => (
                                        <TableRow
                                            key={user.id}
                                            className={`cursor-pointer transition-colors ${selectedAffiliate === user.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                                            onClick={() => setSelectedAffiliate(user.id)}
                                        >
                                            <TableCell>
                                                <p className="font-medium text-slate-900">{user.name}</p>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm text-slate-600">{user.email}</p>
                                                {user.parent && (
                                                    <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full mt-1 inline-block">
                                                        Sub-conta de: {user.parent.name}
                                                    </span>
                                                )}
                                                {user.children && user.children.length > 0 && (
                                                    <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full mt-1 inline-block ml-2">
                                                        {user.children.length} sub-contas
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium text-slate-900">
                                                    {formatCurrency(user.cpaAmount)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <ChevronRight className="h-4 w-4 text-slate-400" />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Detail Panel */}
            {
                selectedAffiliate && (
                    <div className={`${isMaximized ? 'fixed inset-0 z-50 w-full h-full' : 'w-[800px] border-l'} border-slate-200 bg-white overflow-y-auto transition-all duration-200`}>
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
                            <h2 className="text-lg font-semibold text-slate-900">
                                {affiliateDetails?.user?.name || 'Carregando...'}
                            </h2>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsMaximized(!isMaximized)}
                                    title={isMaximized ? "Restaurar tamanho" : "Maximizar painel"}
                                >
                                    {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setIsMaximized(false);
                                        setSelectedAffiliate(null);
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {isLoadingDetails ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin h-8 w-8 border-4 border-slate-300 border-t-slate-900 rounded-full" />
                            </div>
                        ) : (
                            <Tabs defaultValue="dados" className="p-6">
                                <TabsList className="w-full">
                                    <TabsTrigger value="dados" className="flex-1">Dados Gerais</TabsTrigger>
                                    <TabsTrigger value="metricas" className="flex-1">Métricas</TabsTrigger>
                                </TabsList>

                                <TabsContent value="dados" className="space-y-4 mt-4">
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-slate-50 rounded-lg">
                                            <p className="text-xs text-slate-500">Cadastros</p>
                                            <p className="text-lg font-bold text-slate-900">{affiliateDetails?.metrics?.registrations || 0}</p>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-lg">
                                            <p className="text-xs text-slate-500">FTDs</p>
                                            <p className="text-lg font-bold text-slate-900">{affiliateDetails?.metrics?.ftds || 0}</p>
                                        </div>
                                        <div className="p-3 bg-green-50 rounded-lg">
                                            <p className="text-xs text-green-600">Comissão CPA</p>
                                            <p className="text-lg font-bold text-green-700">{formatCurrency(affiliateDetails?.metrics?.commissionCpa || 0)}</p>
                                        </div>
                                        <div className="p-3 bg-blue-50 rounded-lg">
                                            <p className="text-xs text-blue-600">Comissão REV</p>
                                            <p className="text-lg font-bold text-blue-700">{formatCurrency(affiliateDetails?.metrics?.commissionRev || 0)}</p>
                                        </div>
                                    </div>

                                    {/* Editable Fields */}
                                    <div className="space-y-3 pt-4">
                                        <div className="space-y-1.5">
                                            <Label>Nome</Label>
                                            <Input
                                                defaultValue={affiliateDetails?.user?.name}
                                                onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Email</Label>
                                            <Input
                                                defaultValue={affiliateDetails?.user?.email}
                                                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label>WhatsApp</Label>
                                                <Input
                                                    defaultValue={affiliateDetails?.user?.whatsapp || ''}
                                                    onChange={(e) => setUserData({ ...userData, whatsapp: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label>Instagram</Label>
                                                <Input
                                                    defaultValue={affiliateDetails?.user?.instagram || ''}
                                                    onChange={(e) => setUserData({ ...userData, instagram: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>CPA Fixo (R$)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                defaultValue={affiliateDetails?.user?.cpaAmount}
                                                onChange={(e) => setUserData({ ...userData, cpaAmount: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Conta Principal (Vincular a)</Label>
                                            <Select
                                                defaultValue={affiliateDetails?.user?.parentId || 'none'}
                                                onValueChange={(val) => setUserData({ ...userData, parentId: val === 'none' ? null : val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Nenhuma (Remover Vínculo)</SelectItem>
                                                    {affiliates
                                                        .filter(a => a.id !== selectedAffiliate) // Don't verify self
                                                        .map((aff) => (
                                                            <SelectItem key={aff.id} value={aff.id}>
                                                                {aff.name}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-4">
                                        <Button
                                            onClick={handleSaveUser}
                                            disabled={Object.keys(userData).length === 0 || updateUserMutation.isPending}
                                            className="flex-1"
                                        >
                                            <Save className="h-4 w-4 mr-2" />
                                            Salvar Alterações
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                if (confirm(`Deseja banir ${affiliateDetails?.user?.name}?`)) {
                                                    banUserMutation.mutate(selectedAffiliate);
                                                }
                                            }}
                                            className="text-orange-600 border-orange-200 hover:bg-orange-50"
                                        >
                                            <Ban className="h-4 w-4 mr-2" />
                                            Banir
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                if (confirm(`ATENÇÃO: Deseja EXCLUIR DEFINITIVAMENTE ${affiliateDetails?.user?.name}?\n\nIsso apagará TODOS os dados, métricas, links e histórico deste usuário.\n\nEsta ação NÃO pode ser desfeita.`)) {
                                                    deleteUserMutation.mutate(selectedAffiliate);
                                                }
                                            }}
                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Excluir
                                        </Button>
                                    </div>
                                </TabsContent>

                                <TabsContent value="metricas" className="mt-4">
                                    <div className="flex justify-end mb-4">
                                        <Dialog open={isAddMetricOpen} onOpenChange={setIsAddMetricOpen}>
                                            <DialogTrigger asChild>
                                                <Button size="sm">
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Adicionar Métrica
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Adicionar Métrica Manual</DialogTitle>
                                                </DialogHeader>
                                                <form onSubmit={handleCreateMetric}>
                                                    <div className="grid gap-4 py-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label>Data</Label>
                                                                <Input
                                                                    type="date"
                                                                    value={newMetric.date}
                                                                    onChange={(e) => setNewMetric({ ...newMetric, date: e.target.value })}
                                                                    required
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Campanha</Label>
                                                                <Select
                                                                    value={String(newMetric.campaignId)}
                                                                    onValueChange={(val) => setNewMetric({ ...newMetric, campaignId: val })}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Selecione..." />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {campaigns.map((c) => (
                                                                            <SelectItem key={c.id} value={String(c.id)}>
                                                                                {c.name}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">Clicks</Label>
                                                                <Input type="number" className="h-8" value={newMetric.clicks} onChange={(e) => setNewMetric({ ...newMetric, clicks: parseInt(e.target.value) || 0 })} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">Uds</Label>
                                                                <Input type="number" className="h-8" value={newMetric.registrations} onChange={(e) => setNewMetric({ ...newMetric, registrations: parseInt(e.target.value) || 0 })} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">FTDs</Label>
                                                                <Input type="number" className="h-8" value={newMetric.ftds} onChange={(e) => setNewMetric({ ...newMetric, ftds: parseInt(e.target.value) || 0 })} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">CPA Q</Label>
                                                                <Input type="number" className="h-8" value={newMetric.qualifiedCpa} onChange={(e) => setNewMetric({ ...newMetric, qualifiedCpa: parseInt(e.target.value) || 0 })} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">Depósito</Label>
                                                                <Input type="number" step="0.01" className="h-8" value={newMetric.depositAmount} onChange={(e) => setNewMetric({ ...newMetric, depositAmount: parseFloat(e.target.value) || 0 })} />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">Comissão CPA</Label>
                                                                <Input type="number" step="0.01" className="h-8" value={newMetric.commissionCpa} onChange={(e) => setNewMetric({ ...newMetric, commissionCpa: parseFloat(e.target.value) || 0 })} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">Comissão REV</Label>
                                                                <Input type="number" step="0.01" className="h-8" value={newMetric.commissionRev} onChange={(e) => setNewMetric({ ...newMetric, commissionRev: parseFloat(e.target.value) || 0 })} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button type="submit" disabled={createMetricMutation.isPending}>
                                                            {createMetricMutation.isPending ? 'Criando...' : 'Adicionar'}
                                                        </Button>
                                                    </DialogFooter>
                                                </form>
                                            </DialogContent>
                                        </Dialog>
                                    </div>

                                    {isLoadingMetrics ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="animate-spin h-6 w-6 border-4 border-slate-300 border-t-slate-900 rounded-full" />
                                        </div>
                                    ) : metrics.length === 0 ? (
                                        <div className="text-center py-8 text-slate-500">
                                            <p>Nenhuma métrica encontrada</p>
                                        </div>
                                    ) : (
                                        <div className="border rounded-md overflow-hidden">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-slate-100 hover:bg-slate-100 border-b">
                                                        <TableHead className="w-[100px] font-bold text-slate-900 border-r">Data</TableHead>
                                                        <TableHead className="text-right font-bold text-slate-900 border-r">Cadastros</TableHead>
                                                        <TableHead className="text-right font-bold text-slate-900 border-r">FTDs</TableHead>
                                                        <TableHead className="text-right font-bold text-slate-900 border-r">CPA Qual.</TableHead>
                                                        <TableHead className="text-right font-bold text-slate-900 border-r">Depósito</TableHead>
                                                        <TableHead className="text-right font-bold text-slate-900 border-r">Conv%</TableHead>
                                                        <TableHead className="text-right font-bold text-slate-900 border-r">CPA R$</TableHead>
                                                        <TableHead className="text-right font-bold text-slate-900 border-r">REV R$</TableHead>
                                                        <TableHead className="text-right font-bold text-slate-900">Total</TableHead>
                                                        <TableHead className="w-[80px]"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {metrics.slice(0, 50).map((metric) => {
                                                        const isEditing = editingMetric === metric.id;
                                                        const totalCommission = Number(metric.commissionCpa) + Number(metric.commissionRev);
                                                        const conversionRate = metric.registrations > 0
                                                            ? ((metric.ftds / metric.registrations) * 100).toFixed(1)
                                                            : '0.0';

                                                        return (
                                                            <TableRow
                                                                key={metric.id}
                                                                onDoubleClick={() => !isEditing && startEditMetric(metric)}
                                                                className={`${!isEditing ? "cursor-pointer hover:bg-slate-100 even:bg-slate-50" : "bg-blue-50"} border-b`}
                                                                title={!isEditing ? "Clique duas vezes para editar" : ""}
                                                            >
                                                                <TableCell className="font-medium text-xs border-r p-2">
                                                                    <div className="flex flex-col">
                                                                        <span>{formatDate(metric.date)}</span>
                                                                        <span className="text-slate-500 font-normal">{metric.campaign}</span>
                                                                    </div>
                                                                </TableCell>

                                                                {/* Cadastros */}
                                                                <TableCell className="text-right border-r p-2 font-mono">
                                                                    {isEditing ? (
                                                                        <Input
                                                                            type="number"
                                                                            className="h-8 w-16 ml-auto text-right bg-white"
                                                                            value={metricValues.registrations ?? 0}
                                                                            onChange={(e) => setMetricValues({ ...metricValues, registrations: parseInt(e.target.value) || 0 })}
                                                                        />
                                                                    ) : metric.registrations}
                                                                </TableCell>

                                                                {/* FTDs */}
                                                                <TableCell className="text-right border-r p-2 font-mono">
                                                                    {isEditing ? (
                                                                        <Input
                                                                            type="number"
                                                                            className="h-8 w-16 ml-auto text-right bg-white"
                                                                            value={metricValues.ftds ?? 0}
                                                                            onChange={(e) => setMetricValues({ ...metricValues, ftds: parseInt(e.target.value) || 0 })}
                                                                        />
                                                                    ) : metric.ftds}
                                                                </TableCell>

                                                                {/* CPA Qual */}
                                                                <TableCell className="text-right border-r p-2 font-mono">
                                                                    {isEditing ? (
                                                                        <Input
                                                                            type="number"
                                                                            className="h-8 w-16 ml-auto text-right bg-white"
                                                                            value={metricValues.qualifiedCpa ?? 0}
                                                                            onChange={(e) => setMetricValues({ ...metricValues, qualifiedCpa: parseInt(e.target.value) || 0 })}
                                                                        />
                                                                    ) : metric.qualifiedCpa}
                                                                </TableCell>

                                                                {/* Depósito */}
                                                                <TableCell className="text-right border-r p-2 font-mono">
                                                                    {isEditing ? (
                                                                        <Input
                                                                            type="number" step="0.01"
                                                                            className="h-8 w-20 ml-auto text-right bg-white"
                                                                            value={metricValues.depositAmount ?? 0}
                                                                            onChange={(e) => setMetricValues({ ...metricValues, depositAmount: parseFloat(e.target.value) || 0 })}
                                                                        />
                                                                    ) : formatCurrency(metric.depositAmount)}
                                                                </TableCell>

                                                                {/* Conv% */}
                                                                <TableCell className="text-right font-bold border-r p-2 font-mono">
                                                                    {conversionRate}%
                                                                </TableCell>

                                                                {/* Com CPA */}
                                                                <TableCell className="text-right">
                                                                    {isEditing ? (
                                                                        <Input
                                                                            type="number" step="0.01"
                                                                            className="h-8 w-20 ml-auto text-right"
                                                                            value={metricValues.commissionCpa ?? 0}
                                                                            onChange={(e) => setMetricValues({ ...metricValues, commissionCpa: parseFloat(e.target.value) || 0 })}
                                                                        />
                                                                    ) : formatCurrency(metric.commissionCpa)}
                                                                </TableCell>

                                                                {/* Com REV */}
                                                                <TableCell className="text-right">
                                                                    {isEditing ? (
                                                                        <Input
                                                                            type="number" step="0.01"
                                                                            className="h-8 w-20 ml-auto text-right"
                                                                            value={metricValues.commissionRev ?? 0}
                                                                            onChange={(e) => setMetricValues({ ...metricValues, commissionRev: parseFloat(e.target.value) || 0 })}
                                                                        />
                                                                    ) : formatCurrency(metric.commissionRev)}
                                                                </TableCell>

                                                                {/* Total */}
                                                                <TableCell className="text-right font-bold text-slate-900">
                                                                    {formatCurrency(totalCommission)}
                                                                </TableCell>

                                                                <TableCell>
                                                                    {isEditing ? (
                                                                        <div className="flex gap-1 justify-end">
                                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleSaveMetric(metric.id)}>
                                                                                <Check className="h-4 w-4" />
                                                                            </Button>
                                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => setEditingMetric(null)}>
                                                                                <X className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex justify-end">
                                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-900" onClick={() => startEditMetric(metric)}>
                                                                                <Pencil className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        )}
                    </div>
                )
            }
        </div>
    );
}
