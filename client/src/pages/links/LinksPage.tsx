import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Copy, Search } from 'lucide-react';
import { linksApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface Link {
    id: number;
    platformUrl: string;
    trackingCode: string;
    campaign: {
        name: string;
    };
}

export function LinksPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['my-links'],
        queryFn: async () => {
            const { data } = await linksApi.getAll();
            return data;
        },
    });

    const copyToClipboard = (link: Link) => {
        navigator.clipboard.writeText(link.platformUrl);
        setCopiedId(link.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    const links: Link[] = data?.links || [];

    // Filter links by search
    const filteredLinks = links.filter(
        (link) =>
            link.campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            link.platformUrl.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-slate-900">Meus Links</h1>
            </div>

            {/* Links Card */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium">Lista de links</CardTitle>
                    <p className="text-sm text-slate-500">
                        Estes são os links padrão disponibilizados pela equipe. Alguns dos seus links de campanha podem não aparecer aqui, dependendo de como foram gerados.
                    </p>
                </CardHeader>
                <CardContent className="pt-0">
                    {/* Search */}
                    <div className="flex justify-end mb-4">
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

                    {/* Table */}
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="font-medium">Campanha</TableHead>
                                <TableHead className="font-medium">Link</TableHead>
                                <TableHead className="text-right font-medium w-24"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLinks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-slate-500 py-12">
                                        {links.length === 0
                                            ? "Nenhum link disponível ainda. Entre em contato com a equipe."
                                            : "Nenhum link encontrado para essa busca."
                                        }
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLinks.map((link) => (
                                    <TableRow key={link.id} className="hover:bg-slate-50">
                                        <TableCell className="font-medium text-slate-900">
                                            {link.campaign.name}
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            <span className="font-mono text-sm">
                                                {link.platformUrl}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => copyToClipboard(link)}
                                                className="gap-2"
                                            >
                                                <Copy className="h-3.5 w-3.5" />
                                                {copiedId === link.id ? 'Copiado!' : 'Copiar'}
                                            </Button>
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
