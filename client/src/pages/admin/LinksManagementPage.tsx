import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link2, Plus, Trash2, Search, Copy } from 'lucide-react';
import { adminApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Link {
    id: number;
    platformUrl: string;
    trackingCode: string;
    campaign: {
        id: number;
        name: string;
    };
    user: {
        id: string;
        name: string;
        email: string;
    };
}

interface Affiliate {
    id: string;
    name: string;
    email: string;
}

interface Campaign {
    id: number;
    name: string;
    slug: string;
}

export function LinksManagementPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
    const [copiedId, setCopiedId] = useState<number | null>(null);

    // Form state for new link
    const [newLink, setNewLink] = useState({
        userId: '',
        campaignId: 0,
        platformUrl: '',
    });

    // Form state for new campaign
    const [newCampaign, setNewCampaign] = useState({
        name: '',
        slug: '',
    });

    // Fetch all links
    const { data: linksData, isLoading: isLoadingLinks } = useQuery({
        queryKey: ['admin-links'],
        queryFn: async () => {
            const { data } = await adminApi.getLinks();
            return data;
        },
    });

    // Fetch affiliates for dropdown
    const { data: affiliatesData } = useQuery({
        queryKey: ['admin-affiliates'],
        queryFn: async () => {
            const { data } = await adminApi.getAffiliates();
            return data;
        },
    });

    // Fetch campaigns for dropdown
    const { data: campaignsData, isLoading: isLoadingCampaigns } = useQuery({
        queryKey: ['admin-campaigns'],
        queryFn: async () => {
            const { data } = await adminApi.getCampaigns();
            return data;
        },
    });

    // Create link mutation
    const createLinkMutation = useMutation({
        mutationFn: (data: typeof newLink) => adminApi.createLink(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-links'] });
            setIsModalOpen(false);
            setNewLink({ userId: '', campaignId: 0, platformUrl: '' });
        },
    });

    // Create campaign mutation
    const createCampaignMutation = useMutation({
        mutationFn: (data: typeof newCampaign) => adminApi.createCampaign(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
            setIsCampaignModalOpen(false);
            setNewCampaign({ name: '', slug: '' });
        },
    });

    // Delete link mutation
    const deleteLinkMutation = useMutation({
        mutationFn: (linkId: number) => adminApi.deleteLink(linkId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-links'] });
        },
    });

    const handleCreateLink = () => {
        if (!newLink.userId || !newLink.campaignId || !newLink.platformUrl) return;
        createLinkMutation.mutate(newLink);
    };

    const handleCreateCampaign = () => {
        if (!newCampaign.name || !newCampaign.slug) return;
        createCampaignMutation.mutate(newCampaign);
    };

    const copyToClipboard = (link: Link) => {
        navigator.clipboard.writeText(link.platformUrl);
        setCopiedId(link.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (isLoadingLinks) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    const links: Link[] = linksData?.links || [];
    const affiliates: Affiliate[] = affiliatesData?.users || [];
    const campaigns: Campaign[] = campaignsData?.campaigns || [];

    // Filter links by search
    const filteredLinks = links.filter(
        (link) =>
            link.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            link.campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            link.platformUrl.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-slate-900">Gerenciar Links</h1>
                <div className="flex gap-2">
                    {/* Create Campaign Button */}
                    <Dialog open={isCampaignModalOpen} onOpenChange={setIsCampaignModalOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Plus className="h-4 w-4" />
                                Nova Campanha
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Nova Campanha</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div>
                                    <Label>Nome da Campanha</Label>
                                    <Input
                                        placeholder="Ex: Instagram Stories"
                                        value={newCampaign.name}
                                        onChange={(e) => setNewCampaign({
                                            ...newCampaign,
                                            name: e.target.value,
                                            slug: e.target.value.toLowerCase().replace(/\s+/g, '_')
                                        })}
                                    />
                                </div>
                                <div>
                                    <Label>Slug</Label>
                                    <Input
                                        placeholder="instagram_stories"
                                        value={newCampaign.slug}
                                        onChange={(e) => setNewCampaign({ ...newCampaign, slug: e.target.value })}
                                    />
                                </div>
                                <Button
                                    onClick={handleCreateCampaign}
                                    disabled={createCampaignMutation.isPending}
                                    className="w-full"
                                >
                                    Criar Campanha
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Create Link Button */}
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Link2 className="h-4 w-4" />
                                Adicionar Link
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Adicionar Novo Link</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div>
                                    <Label>Afiliado</Label>
                                    <Select
                                        value={newLink.userId}
                                        onValueChange={(value: string) => setNewLink({ ...newLink, userId: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o afiliado" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {affiliates.map((affiliate) => (
                                                <SelectItem key={affiliate.id} value={affiliate.id}>
                                                    {affiliate.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Campanha</Label>
                                    <Select
                                        value={newLink.campaignId.toString()}
                                        onValueChange={(value: string) => setNewLink({ ...newLink, campaignId: parseInt(value) })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a campanha" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {isLoadingCampaigns ? (
                                                <SelectItem value="loading" disabled>Carregando...</SelectItem>
                                            ) : campaigns.length === 0 ? (
                                                <SelectItem value="empty" disabled>Nenhuma campanha</SelectItem>
                                            ) : (
                                                campaigns.map((campaign) => (
                                                    <SelectItem key={campaign.id} value={campaign.id.toString()}>
                                                        {campaign.name}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Link (URL)</Label>
                                    <Input
                                        type="url"
                                        placeholder="https://brsuperbet.com/registro_1234"
                                        value={newLink.platformUrl}
                                        onChange={(e) => setNewLink({ ...newLink, platformUrl: e.target.value })}
                                    />
                                </div>
                                <Button
                                    onClick={handleCreateLink}
                                    disabled={createLinkMutation.isPending || !newLink.userId || !newLink.campaignId || !newLink.platformUrl}
                                    className="w-full"
                                >
                                    Adicionar Link
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Links Card */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium">Todos os Links</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Pesquisar"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="font-medium">Afiliado</TableHead>
                                <TableHead className="font-medium">Campanha</TableHead>
                                <TableHead className="font-medium">Link</TableHead>
                                <TableHead className="text-right font-medium w-32">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLinks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-slate-500 py-12">
                                        {links.length === 0
                                            ? "Nenhum link criado ainda. Clique em 'Adicionar Link' para começar."
                                            : "Nenhum link encontrado para essa busca."
                                        }
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLinks.map((link) => (
                                    <TableRow key={link.id} className="hover:bg-slate-50">
                                        <TableCell className="font-medium text-slate-900">
                                            {link.user.name}
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            {link.campaign.name}
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            <span className="font-mono text-sm truncate block max-w-xs">
                                                {link.platformUrl}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => copyToClipboard(link)}
                                                    className="gap-1"
                                                >
                                                    <Copy className="h-3.5 w-3.5" />
                                                    {copiedId === link.id ? 'Copiado!' : 'Copiar'}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        if (confirm('Deseja deletar este link?')) {
                                                            deleteLinkMutation.mutate(link.id);
                                                        }
                                                    }}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
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
