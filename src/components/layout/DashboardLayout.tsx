import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, CalendarClock, Target, Settings as SettingsIcon } from 'lucide-react';
import { useUserRecord } from '../../hooks/useUser';

const DashboardLayout: React.FC = () => {
  const { data: userRecord } = useUserRecord();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { to: '/cycles', label: 'Salary Cycles', icon: <CalendarClock size={20} /> },
    { to: '/transactions', label: 'Transactions', icon: <Receipt size={20} /> },
    { to: '/bills', label: 'Bills', icon: <CalendarClock size={20} /> },
    { to: '/debts', label: 'Debts', icon: <Target size={20} /> },
    { to: '/goals', label: 'Goals', icon: <Target size={20} /> },
    { to: '/settings', label: 'Settings', icon: <SettingsIcon size={20} /> },
  ];

  const displayName = userRecord?.first_name || 'SmartSpend User';
  const displayEmail = userRecord?.email || '';
  
  let initials = 'SU';
  if (userRecord?.first_name) {
    initials = userRecord.first_name.substring(0, 2).toUpperCase();
  } else if (userRecord?.email) {
    initials = userRecord.email.substring(0, 2).toUpperCase();
  }

  return (
    <div className="flex h-screen bg-brand-navy text-white overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-brand-dark border-r border-gray-800">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-brand-orange tracking-tight">SmartSpend Pro</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-brand-orange text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-brand-accent flex items-center justify-center text-sm font-bold shrink-0">
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-gray-400 truncate">{displayEmail}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden bg-brand-navy">
        <Outlet />
      </main>

      {/* Bottom Nav for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-dark border-t border-gray-800 flex justify-between px-6 py-3 z-50">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center p-2 rounded-lg ${
                isActive ? 'text-brand-orange' : 'text-gray-400'
              }`
            }
          >
            {item.icon}
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default DashboardLayout;
