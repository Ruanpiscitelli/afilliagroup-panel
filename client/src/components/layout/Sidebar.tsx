import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BarChart3, Link2, Settings, ChevronRight, Shield, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/avatar';

const navigation = [
    { name: 'Início', href: '/', icon: Home },
    { name: 'Resultados', href: '/resultados', icon: BarChart3 },
    { name: 'Meus Links', href: '/links', icon: Link2 },
];

export function Sidebar() {
    const { user, logout } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <aside className="fixed left-0 top-0 z-40 flex h-screen w-[250px] flex-col border-r border-slate-200 bg-white">
            {/* Logo */}
            <div className="flex h-16 items-center gap-2 px-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center">
                        <span className="text-white font-bold text-xs">OTG</span>
                    </div>
                    <span className="font-semibold text-slate-900">PARTNERS</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4">
                <p className="px-3 text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                    Geral
                </p>
                <ul className="space-y-1">
                    {navigation.map((item) => (
                        <li key={item.name}>
                            <NavLink
                                to={item.href}
                                className={({ isActive }) =>
                                    cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-slate-100 text-slate-900'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    )
                                }
                            >
                                <item.icon className="h-5 w-5" />
                                {item.name}
                            </NavLink>
                        </li>
                    ))}
                </ul>

                {/* Admin Section - only visible for admins */}
                {isAdmin && (
                    <>
                        <p className="px-3 text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 mt-6">
                            Administração
                        </p>
                        <ul className="space-y-1">
                            <li>
                                <NavLink
                                    to="/admin/requests"
                                    className={({ isActive }) =>
                                        cn(
                                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                            isActive
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                                        )
                                    }
                                >
                                    <Shield className="h-5 w-5" />
                                    Painel Admin
                                </NavLink>
                            </li>
                        </ul>
                    </>
                )}
            </nav>

            {/* Bottom section */}
            <div className="border-t border-slate-100 p-3">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 mb-1"
                >
                    <LogOut className="h-5 w-5" />
                    Sair
                </button>

                <NavLink
                    to="/configuracoes"
                    className={({ isActive }) =>
                        cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors mb-2',
                            isActive
                                ? 'bg-slate-100 text-slate-900'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        )
                    }
                >
                    <Settings className="h-5 w-5" />
                    Configurações
                </NavLink>

                {/* User profile */}
                <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                        <Avatar
                            src={user?.avatarUrl}
                            alt={user?.name}
                            fallback={user?.name?.substring(0, 2).toUpperCase() || 'AF'}
                            className="h-8 w-8"
                        />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900">{user?.name || 'AffiliaGroup'}</span>
                            <span className="text-xs text-slate-500">{user?.email || 'user@affilia.group'}</span>
                        </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
            </div>
        </aside>
    );
}
