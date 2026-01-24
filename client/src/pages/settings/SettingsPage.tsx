import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';

export function SettingsPage() {
    const { user, logout } = useAuth();

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-semibold text-slate-900">Configurações</h1>
                <p className="text-slate-500">Gerencie suas preferências e informações de conta.</p>
            </div>

            {/* Profile Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Perfil</CardTitle>
                    <CardDescription>Suas informações pessoais</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Avatar
                            src={user?.avatarUrl}
                            alt={user?.name}
                            fallback={user?.name?.substring(0, 2).toUpperCase() || 'AF'}
                            className="h-16 w-16"
                        />
                        <div>
                            <Button variant="outline" size="sm">Alterar foto</Button>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Nome</label>
                            <Input defaultValue={user?.name || ''} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Email</label>
                            <Input defaultValue={user?.email || ''} disabled />
                        </div>
                    </div>

                    <Button>Salvar alterações</Button>
                </CardContent>
            </Card>

            {/* Security Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Segurança</CardTitle>
                    <CardDescription>Gerencie sua senha e autenticação</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Senha atual</label>
                            <Input type="password" placeholder="••••••••" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Nova senha</label>
                            <Input type="password" placeholder="••••••••" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Confirmar nova senha</label>
                            <Input type="password" placeholder="••••••••" />
                        </div>
                    </div>
                    <Button variant="outline">Alterar senha</Button>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200">
                <CardHeader>
                    <CardTitle className="text-red-600">Zona de Perigo</CardTitle>
                    <CardDescription>Ações irreversíveis</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="destructive" onClick={logout}>
                        Sair da conta
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
