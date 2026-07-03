import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { OfflineBanner } from './components/OfflineBanner';
import { FinanceProvider } from './contexts/FinanceContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider } from './contexts/AuthContext';
import { AuthGuard } from './components/AuthGuard';
import { AccessCodeGate } from './components/AccessCodeGate';
import { useUIStore } from './store/uiStore';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import FixedDues from './pages/FixedDues';
import VibesSalary from './pages/VibesSalary';
import Salary from './pages/Salary';
import MoneyTracking from './pages/MoneyTracking';
import CurrencyCalculator from './pages/CurrencyCalculator';
import BullionTracking from './pages/BullionTracking';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import NotFound from './pages/NotFound';
import Test1 from './pages/Test1.tsx';
import Test2 from './pages/Test2.tsx';
import Test3 from './pages/Test3.tsx';
import NativeTest from './pages/NativeTest';
import Medications from './pages/Medications';
const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AccessCodeGate>
          <BrowserRouter>
            <AuthProvider>
              <FinanceProvider>
                <NotificationProvider>
                  <TooltipProvider>
                    <OfflineBanner />
                    <Toaster />
                    <Sonner />
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route element={<AuthGuard />}>
                        <Route element={<Layout />}>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/transactions" element={<Transactions />} />
                          <Route path="/fixed-dues" element={<FixedDues />} />
                          <Route path="/vibes-salary" element={<VibesSalary />} />
                          <Route path="/salary" element={<Salary />} />
                          <Route path="/money-tracking" element={<MoneyTracking />} />
                          <Route
                            path="/currency-calculator"
                            element={<CurrencyCalculator />}
                          />
                          <Route path="/bullion-tracking" element={<BullionTracking />} />
                          <Route path="/reports" element={<Reports />} />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="/test1" element={<Test1 />} />
                          <Route path="/test2" element={<Test2 />} />
                          <Route path="/test3" element={<Test3 />} />
                          <Route path="/native-test" element={<NativeTest />} />
                          <Route path="/medications/:profileId" element={<Medications />} />
                        </Route>
                      </Route>
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </TooltipProvider>
                </NotificationProvider>
              </FinanceProvider>
            </AuthProvider>
          </BrowserRouter>
        </AccessCodeGate>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

export default App;
