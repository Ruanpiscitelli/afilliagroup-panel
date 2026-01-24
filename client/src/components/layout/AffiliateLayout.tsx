import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AffiliateProvider } from '@/contexts/AffiliateContext';

export function AffiliateLayout() {
    return (
        <AffiliateProvider>
            <div className="flex h-screen bg-slate-50">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden ml-[250px]">
                    <Header />
                    <main className="flex-1 overflow-auto p-6">
                        <Outlet />
                    </main>
                </div>
            </div>
        </AffiliateProvider>
    );
}

