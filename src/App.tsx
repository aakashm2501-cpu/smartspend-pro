import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Bills from './pages/Bills';
import Goals from './pages/Goals';
import Debts from './pages/Debts';
import Cycles from './pages/Cycles';
import Settings from './pages/Settings';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-navy flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-orange"></div>
      </div>
    );
  }

  const isAuthenticated = !!user;

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={!isAuthenticated ? <Auth /> : <Navigate to="/" />} />
        
        <Route path="/" element={isAuthenticated ? <DashboardLayout /> : <Navigate to="/auth" />}>
          <Route index element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="bills" element={<Bills />} />
          <Route path="debts" element={<Debts />} />
          <Route path="goals" element={<Goals />} />
          <Route path="cycles" element={<Cycles />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
