import { useQuery } from '@tanstack/react-query';
import { Link2, Copy, ExternalLink } from 'lucide-react';
import { linksApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function LinksPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['links'],
        queryFn: async () => {
            const { data } = await linksApi.getAll();
            return data;
        },
    });

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // TODO: Add toast notification
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    const links = data?.links || [];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-slate-900">Meus Links</h1>
                <Button className="gap-2">
                    <Link2 className="h-4 w-4" />
                    Novo Link
                </Button>
            </div>

            {/* Links Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-medium">Links de Rastreamento</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Código</TableHead>
                                <TableHead>Campanha</TableHead>
                                <TableHead>URL de Destino</TableHead>
                                <TableHead>Criado em</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {links.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                                        Nenhum link encontrado. Crie seu primeiro link de afiliado!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                links.map((link: any) => (
                                    <TableRow key={link.id}>
                                        <TableCell>
                                            <code className="px-2 py-1 bg-slate-100 rounded text-sm font-mono">
                                                {link.trackingCode}
                                            </code>
                                        </TableCell>
                                        <TableCell className="font-medium">{link.campaign.name}</TableCell>
                                        <TableCell className="text-slate-600 max-w-xs truncate">
                                            {link.platformUrl}
                                        </TableCell>
                                        <TableCell className="text-slate-500">
                                            {format(new Date(link.createdAt), "d 'de' MMM yyyy", { locale: ptBR })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => copyToClipboard(`${link.platformUrl}?ref=${link.trackingCode}`)}
                                                    title="Copiar link"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => window.open(link.platformUrl, '_blank')}
                                                    title="Abrir URL"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
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
