import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { FinanceProvider } from './context/FinanceContext';
import { TeamProvider } from './context/TeamContext';
import { ContractProvider } from './context/ContractContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CapitalGiroProvider } from './context/CapitalGiroContext';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import Lancamentos from './pages/Lancamentos';
import Custos from './pages/Custos';
import Clientes from './pages/Clientes';
import Projetos from './pages/Projetos';
import GestaoProjetos from './pages/GestaoProjetos';
import Equipe from './pages/Equipe';
import Contratos from './pages/Contratos';
import Config from './pages/Config';
import Login from './pages/Login';
import CapitalGiro from './pages/CapitalGiro';
import { Loader2 } from 'lucide-react';

// Protected Route Component
const ProtectedRoute = () => {
  const { user, isLoading, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#442685] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se assistente tentar acessar qualquer coisa diferente de lançamentos
  if (role === 'assistant' && location.pathname !== '/lancamentos') {
    return <Navigate to="/lancamentos" replace />;
  }

  return <Outlet />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TeamProvider>
          <FinanceProvider>
            <ContractProvider>
              <CapitalGiroProvider>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<Login />} />

                  {/* Protected Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<AppShell />}>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/lancamentos" element={<Lancamentos />} />
                      <Route path="/custos" element={<Custos />} />
                      <Route path="/clientes" element={<Clientes />} />
                      <Route path="/projetos" element={<Projetos />} />
                      <Route path="/gestao-projetos" element={<GestaoProjetos />} />
                      <Route path="/equipe" element={
                        <ErrorBoundary>
                          <Equipe />
                        </ErrorBoundary>
                      } />
                      <Route path="/contratos" element={<Contratos />} />
                      <Route path="/config" element={<Config />} />
                      <Route path="/capital-giro" element={<CapitalGiro />} />
                    </Route>
                  </Route>
                </Routes>
              </CapitalGiroProvider>
            </ContractProvider>
          </FinanceProvider>
        </TeamProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
