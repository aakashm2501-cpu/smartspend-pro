import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Target, Settings as SettingsIcon, Plus, User } from 'lucide-react';
import { UniversalAddSheet } from './UniversalAddSheet';

const DashboardLayout: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Home', icon: (isActive: boolean) => <LayoutDashboard size={24} strokeWidth={isActive ? 2.5 : 2} /> },
    { to: '/transactions', label: 'Ledger', icon: (isActive: boolean) => <Receipt size={24} strokeWidth={isActive ? 2.5 : 2} /> },
    { to: '/plan', label: 'Plan', icon: (isActive: boolean) => <Target size={24} strokeWidth={isActive ? 2.5 : 2} /> },
    { to: '/debts', label: 'Debts', icon: (isActive: boolean) => <User size={24} strokeWidth={isActive ? 2.5 : 2} /> },
    { to: '/settings', label: 'Settings', icon: (isActive: boolean) => <SettingsIcon size={24} strokeWidth={isActive ? 2.5 : 2} /> },
  ];

  const [isAddOpen, setIsAddOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-[#000000] text-white overflow-hidden font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-[#000000] border-r border-[#18181B] z-10">
        <div className="p-8 pb-4">
          <h1 className="text-3xl font-outfit font-black tracking-tighter text-white">SmartSpend</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-8">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all duration-300 ${
                  isActive ? 'bg-[#18181B] text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-[#09090B]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {item.icon(isActive)}
                  <span className="font-semibold text-lg">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        
        {/* Desktop Add Button */}
        <div className="p-6">
           <button 
            onClick={() => setIsAddOpen(true)}
            className="w-full bg-white text-black py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 active:scale-95 transition-transform"
          >
            <Plus size={24} />
            <span>Add Transaction</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden bg-[#000000] pb-24 md:pb-0">
        <Outlet />
      </main>

      {/* Bottom Nav for Mobile - Glassmorphic */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-2xl border-t border-white/5 flex justify-between items-center px-6 py-4 z-50 pb-safe">
        <NavLink to="/" className={({ isActive }) => `flex flex-col items-center transition-all duration-300 ${isActive ? 'text-white scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-gray-600'}`}>
          {({ isActive }) => <LayoutDashboard size={24} strokeWidth={isActive ? 2.5 : 2} />}
        </NavLink>
        
        <NavLink to="/transactions" className={({ isActive }) => `flex flex-col items-center transition-all duration-300 ${isActive ? 'text-white scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-gray-600'}`}>
          {({ isActive }) => <Receipt size={24} strokeWidth={isActive ? 2.5 : 2} />}
        </NavLink>
        
        {/* Central Universal Add FAB */}
        <div className="relative -top-6">
          <button 
            onClick={() => setIsAddOpen(true)}
            className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-90 transition-transform duration-300"
          >
            <Plus size={32} strokeWidth={2.5} />
          </button>
        </div>

        <NavLink to="/plan" className={({ isActive }) => `flex flex-col items-center transition-all duration-300 ${isActive ? 'text-white scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-gray-600'}`}>
          {({ isActive }) => <Target size={24} strokeWidth={isActive ? 2.5 : 2} />}
        </NavLink>

        <NavLink to="/debts" className={({ isActive }) => `flex flex-col items-center transition-all duration-300 ${isActive ? 'text-white scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-gray-600'}`}>
          {({ isActive }) => <User size={24} strokeWidth={isActive ? 2.5 : 2} />}
        </NavLink>

        <NavLink to="/settings" className={({ isActive }) => `flex flex-col items-center transition-all duration-300 ${isActive ? 'text-white scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-gray-600'}`}>
          {({ isActive }) => <SettingsIcon size={24} strokeWidth={isActive ? 2.5 : 2} />}
        </NavLink>
      </nav>

      <UniversalAddSheet isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </div>
  );
};

export default DashboardLayout;
