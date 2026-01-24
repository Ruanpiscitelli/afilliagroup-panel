import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/useAuth';
import { DateRangeProvider } from '@/hooks/useDateRange';
import { AdminLayout } from '@/components/layout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ResultsPage } from '@/pages/results/ResultsPage';
import { LinksPage } from '@/pages/links/LinksPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';

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
              <Route path="/login" element={<LoginPage />} />
              <Route element={<AdminLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/resultados" element={<ResultsPage />} />
                <Route path="/links" element={<LinksPage />} />
                <Route path="/configuracoes" element={<SettingsPage />} />
              </Route>
            </Routes>
          </DateRangeProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
