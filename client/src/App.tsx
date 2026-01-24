import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/useAuth';
import { DateRangeProvider } from '@/hooks/useDateRange';
import { AdminLayout, AffiliateLayout } from '@/components/layout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ResultsPage } from '@/pages/results/ResultsPage';
import { LinksPage } from '@/pages/links/LinksPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { AdminRequestsPage } from '@/pages/admin/RequestsPage';
import { AdminAffiliatesPage } from '@/pages/admin/AffiliatesPage';
import { LinksManagementPage } from '@/pages/admin/LinksManagementPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <DateRangeProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />

              {/* Affiliate routes */}
              <Route element={<AffiliateLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/resultados" element={<ResultsPage />} />
                <Route path="/links" element={<LinksPage />} />
                <Route path="/configuracoes" element={<SettingsPage />} />
              </Route>

              {/* Admin routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="requests" element={<AdminRequestsPage />} />
                <Route path="affiliates" element={<AdminAffiliatesPage />} />
                <Route path="links" element={<LinksManagementPage />} />
              </Route>
            </Routes>
          </DateRangeProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
