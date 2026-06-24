import React from 'react';
import { CalendarClock, Target, AlertCircle, Coffee, ArrowRight, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FeedItem {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  category: 'bills' | 'goals' | 'debts' | 'insights';
  title: string;
  description: string;
  actionLabel: string;
  route: string;
}

export const FinancialFeed: React.FC<{ safeToSpend: number, upcomingBills: any, requiredGoals: any, upcomingDebts: any }> = ({ 
  safeToSpend, 
  upcomingBills, 
  requiredGoals, 
  upcomingDebts,
}) => {
  const navigate = useNavigate();

  const getTopRecommendation = (): FeedItem | null => {
    // Priority 1: Critical safe to spend
    if (safeToSpend < 0) {
      return {
        id: 'critical-sts',
        type: 'critical',
        category: 'insights',
        title: 'Pause discretionary spending',
        description: 'You are currently over budget. Focus only on absolute needs.',
        actionLabel: 'Review Spend',
        route: '/transactions'
      };
    }

    // Priority 2: Overdue or upcoming bills
    if (upcomingBills.remaining > 0) {
      return {
        id: 'warn-bills',
        type: upcomingBills.status === 'Overdue' ? 'critical' : 'warning',
        category: 'bills',
        title: `Schedule ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(upcomingBills.remaining)} for bills`,
        description: 'You have outstanding required payments this cycle.',
        actionLabel: 'Manage Bills',
        route: '/plan'
      };
    }

    // Priority 3: Debts
    if (upcomingDebts.remaining > 0) {
      return {
        id: 'warn-debts',
        type: 'info',
        category: 'debts',
        title: `Settle your outstanding balances`,
        description: `You should pay ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(upcomingDebts.remaining)} to clear your debts.`,
        actionLabel: 'Settle Up',
        route: '/debts'
      };
    }

    // Priority 4: Goals
    if (requiredGoals.remaining > 0) {
      return {
        id: 'info-goals',
        type: 'info',
        category: 'goals',
        title: 'Fund your future goals',
        description: `Allocate ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(requiredGoals.remaining)} to stay on track.`,
        actionLabel: 'Fund Goals',
        route: '/plan'
      };
    }

    return null;
  };

  const item = getTopRecommendation();

  const getIcon = (category: string, type: string) => {
    const iconClass = type === 'critical' ? 'text-red-400' : 
                      type === 'warning' ? 'text-brand-orange' : 
                      type === 'success' ? 'text-emerald-400' : 'text-blue-400';
    
    switch (category) {
      case 'bills': return <CalendarClock className={iconClass} size={32} />;
      case 'goals': return <Target className={iconClass} size={32} />;
      case 'debts': return <Wallet className={iconClass} size={32} />;
      case 'insights': 
        return <AlertCircle className={iconClass} size={32} />;
      default: return <AlertCircle className={iconClass} size={32} />;
    }
  };

  if (!item) {
    return (
      <div className="w-full mt-4 flex flex-col items-center justify-center pt-8 pb-12">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
          <Coffee size={48} className="text-blue-400 relative z-10" />
        </div>
        <h3 className="text-xl font-bold text-white mt-6 mb-2 font-outfit">Clean slate today.</h3>
        <p className="text-gray-500 text-sm font-medium">No pending actions required. Enjoy your coffee.</p>
      </div>
    );
  }

  return (
    <div className="w-full mt-4">
      <p className="text-xs font-bold text-gray-600 uppercase tracking-[0.2em] mb-4 pl-2">Recommended Action</p>
      <div 
        onClick={() => navigate(item.route)}
        className="bg-transparent rounded-none p-2 flex flex-col group cursor-pointer"
      >
        <div className="flex items-start gap-5">
          <div className={`p-4 rounded-[28px] flex-shrink-0 transition-transform group-active:scale-95 ${
            item.type === 'critical' ? 'bg-red-500/10' :
            item.type === 'warning' ? 'bg-orange-500/10' :
            item.type === 'success' ? 'bg-emerald-500/10' : 'bg-blue-500/10'
          }`}>
            {getIcon(item.category, item.type)}
          </div>
          
          <div className="flex-1 pt-1">
            <h4 className="text-white font-bold text-xl leading-tight font-outfit">{item.title}</h4>
            <p className="text-gray-400 text-sm mt-2 leading-relaxed">{item.description}</p>
            
            <button 
              className={`mt-4 text-sm font-bold flex items-center transition-transform group-hover:translate-x-1 ${
                item.type === 'critical' ? 'text-red-400' :
                item.type === 'warning' ? 'text-brand-orange' :
                item.type === 'success' ? 'text-emerald-400' : 'text-blue-400'
              }`}
            >
              {item.actionLabel} <ArrowRight size={16} className="ml-1" strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
