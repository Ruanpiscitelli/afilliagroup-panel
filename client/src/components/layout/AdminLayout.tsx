import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    Users,
    Bell,
    LogOut,
    ChevronLeft,
    Link2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { authApi, adminApi } from '@/services/api';
import { Button } from '@/components/ui/button';

export function AdminLayout() {
    const navigate = useNavigate();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const { data: statsData } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const { data } = await adminApi.getStats();
            return data;
        },
        refetchInterval: 30000,
    });

    const handleLogout = async () => {
        await authApi.logout();
        navigate('/login');
    };

    const navItems = [
        {
            label: 'Solicitações',
            href: '/admin/requests',
            icon: Bell,
            badge: statsData?.pending || 0,
        },
        {
            label: 'Base de Afiliados',
            href: '/admin/affiliates',
            icon: Users,
            badge: null,
        },
        {
            label: 'Gerenciar Links',
            href: '/admin/links',
            icon: Link2,
            badge: null,
        },
    ];

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Sidebar */}
            <aside
                className={`bg-slate-900 text-white flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'
                    }`}
            >
                {/* Logo */}
                <div className="p-4 flex items-center justify-between border-b border-slate-700">
                    {!sidebarCollapsed && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                                <span className="text-slate-900 text-xs font-bold">OTG</span>
                            </div>
                            <span className="font-semibold">Admin Panel</span>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="p-1 hover:bg-slate-700 rounded"
                    >
                        <ChevronLeft className={`h-5 w-5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                                    ? 'bg-white/10 text-white'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`
                            }
                        >
                            <item.icon className="h-5 w-5 shrink-0" />
                            {!sidebarCollapsed && (
                                <>
                                    <span className="flex-1">{item.label}</span>
                                    {item.badge !== null && item.badge > 0 && (
                                        <span className="px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
                                            {item.badge}
                                        </span>
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700">
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className={`w-full justify-start text-slate-400 hover:text-white hover:bg-white/5 ${sidebarCollapsed ? 'px-3' : ''
                            }`}
                    >
                        <LogOut className="h-5 w-5" />
                        {!sidebarCollapsed && <span className="ml-3">Sair</span>}
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
}
