import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Phone, Instagram, ExternalLink } from 'lucide-react';
import { adminApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PendingUser {
    id: string;
    name: string;
    email: string;
    whatsapp: string | null;
    instagram: string | null;
    projectedFtds: string | null;
    createdAt: string;
}

export function AdminRequestsPage() {
    const queryClient = useQueryClient();
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['admin-requests'],
        queryFn: async () => {
            const { data } = await adminApi.getRequests();
            return data;
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ userId, status }: { userId: string; status: 'ACTIVE' | 'REJECTED' }) =>
            adminApi.updateStatus(userId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
            setActionInProgress(null);
        },
        onError: () => {
            setActionInProgress(null);
        },
    });

    const handleApprove = (userId: string) => {
        setActionInProgress(userId);
        updateStatusMutation.mutate({ userId, status: 'ACTIVE' });
    };

    const handleReject = (userId: string) => {
        setActionInProgress(userId);
        updateStatusMutation.mutate({ userId, status: 'REJECTED' });
    };

    const formatWhatsappLink = (whatsapp: string | null) => {
        if (!whatsapp) return null;
        const clean = whatsapp.replace(/\D/g, '');
        return `https://wa.me/${clean}`;
    };

    const pendingUsers: PendingUser[] = data?.users || [];

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Solicitações de Cadastro</h1>
                <p className="text-slate-500 mt-1">
                    Aprove ou rejeite novas solicitações de afiliados
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        Fila de Aprovação
                        {pendingUsers.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-sm bg-amber-100 text-amber-700 rounded-full">
                                {pendingUsers.length} pendente{pendingUsers.length > 1 ? 's' : ''}
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin h-8 w-8 border-4 border-slate-300 border-t-slate-900 rounded-full" />
                        </div>
                    ) : pendingUsers.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Check className="h-12 w-12 mx-auto mb-4 text-green-500" />
                            <p className="text-lg font-medium">Nenhuma solicitação pendente</p>
                            <p className="text-sm">Todas as solicitações foram processadas</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>WhatsApp</TableHead>
                                    <TableHead>Instagram</TableHead>
                                    <TableHead>FTDs Projetados</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingUsers.map((user) => (
                                    <TableRow
                                        key={user.id}
                                        className={actionInProgress === user.id ? 'opacity-50' : ''}
                                    >
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-slate-900">{user.name}</p>
                                                <p className="text-sm text-slate-500">{user.email}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {user.whatsapp ? (
                                                <a
                                                    href={formatWhatsappLink(user.whatsapp) || '#'}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-green-600 hover:text-green-700"
                                                >
                                                    <Phone className="h-4 w-4" />
                                                    <span className="text-sm">{user.whatsapp}</span>
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {user.instagram ? (
                                                <a
                                                    href={`https://instagram.com/${user.instagram.replace('@', '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-pink-600 hover:text-pink-700"
                                                >
                                                    <Instagram className="h-4 w-4" />
                                                    <span className="text-sm">{user.instagram}</span>
                                                </a>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-slate-600">
                                                {user.projectedFtds || '-'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleApprove(user.id)}
                                                    disabled={actionInProgress === user.id}
                                                    className="text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleReject(user.id)}
                                                    disabled={actionInProgress === user.id}
                                                    className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
