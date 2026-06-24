import React, { useMemo, useRef, useEffect } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { TransactionModal } from '../components/domain/transactions/TransactionModal';
import { useActiveCycle } from '../hooks/useCycles';
import { useTransactions } from '../hooks/useTransactions';
import { useBills } from '../hooks/useBills';
import { useGoals } from '../hooks/useGoals';
import { useDebts } from '../hooks/useDebts';
import { useUserRecord } from '../hooks/useUser';
import { 
  calculateUpcomingCycleBills, 
  calculateRequiredGoalContributions, 
  calculateUpcomingDebtObligations,
  calculateAvailableCash,
  calculateSafeToSpend,
  calculateProjectedEndBalance
} from '../utils/engines';

const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
};

import { motion } from 'framer-motion';

// --- Memoized Subcomponents ---

const CFOBriefing = React.memo(({ hasCycle, safeToSpend, projectedEndBalance }: { hasCycle: boolean, safeToSpend: number, projectedEndBalance: number }) => (
  <div className="bg-brand-dark/50 border border-brand-orange/30 rounded-xl p-4 flex items-start space-x-4">
    <AlertCircle className="text-brand-orange mt-1 flex-shrink-0" size={24} />
    <div>
      <h3 className="font-semibold text-brand-orange">CFO Briefing</h3>
      <p className="text-sm text-gray-300 mt-1">
        {hasCycle 
          ? `You have ${formatINR(safeToSpend)} Safe to Spend. You are projected to end the cycle with ${formatINR(projectedEndBalance)}.`
          : 'Create your first salary cycle to begin planning.'}
      </p>
    </div>
  </div>
));

const OrbitNode = ({ action, angleOffset }: { action: any, angleOffset: number }) => {
  // Simple circular orbit motion
  return (
    <motion.div
      className="absolute top-1/2 left-1/2 pointer-events-auto cursor-pointer flex items-center justify-center group"
      initial={{ rotate: angleOffset }}
      animate={{ rotate: angleOffset + 360 }}
      transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      onClick={() => window.location.href = action.route} // Basic routing since we don't have navigate here
    >
      <motion.div 
        style={{ marginTop: -160 }} // Orbit radius
        initial={{ rotate: -angleOffset }}
        animate={{ rotate: -(angleOffset + 360) }} // counter-rotate to keep text upright
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="flex flex-col items-center justify-center relative"
      >
        <div className={`w-16 h-16 rounded-full flex items-center justify-center bg-[#09090B] border border-white/10 shadow-2xl relative z-10 transition-transform group-hover:scale-110`}>
          <div className={`absolute inset-0 rounded-full blur-md opacity-30 -z-10 ${action.color}`} />
          {action.icon}
        </div>
        <div className="absolute top-full mt-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10">
            {action.label}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};

const TheOrbit = React.memo(({ safeToSpend, recommendations }: { safeToSpend: number, recommendations: any[] }) => {
  const safeToSpendParts = safeToSpend.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).split('.');
  
  let state: 'success' | 'warning' | 'risk' | 'recovery' = 'success';
  if (safeToSpend < 0) state = 'risk';
  else if (safeToSpend < 2000) state = 'warning';
  else if (safeToSpend < 5000) state = 'recovery';
  
  const stateConfig = {
    success: { glow: "bg-emerald-500/15", textColor: "text-emerald-400" },
    recovery: { glow: "bg-teal-500/15", textColor: "text-teal-400" },
    warning: { glow: "bg-orange-500/15", textColor: "text-brand-orange" },
    risk: { glow: "bg-rose-500/15", textColor: "text-rose-500" },
  };

  const current = stateConfig[state];

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative w-full bg-[#000000] overflow-hidden min-h-screen">
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none`}>
         <div className={`w-96 h-96 ${current.glow} blur-[120px] rounded-full transition-colors duration-1000`} />
      </div>
      
      {/* Central Hero */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="flex flex-col items-center relative z-10 pointer-events-none"
      >
        <p className={`font-bold uppercase tracking-[0.3em] text-xs mb-4 ${current.textColor} drop-shadow-md`}>
          Safe To Spend
        </p>
        <h1 className="text-[100px] md:text-[140px] font-outfit font-black tracking-tighter text-white drop-shadow-2xl flex items-start leading-none">
          <span className="text-5xl md:text-7xl text-white/40 font-light mt-4 md:mt-8 mr-2">₹</span>
          {safeToSpendParts[0]}
        </h1>
      </motion.div>

      {/* Orbiting Elements */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {recommendations.map((rec, i) => (
          <OrbitNode key={rec.id} action={rec} angleOffset={i * (360 / Math.max(1, recommendations.length))} />
        ))}
      </div>
    </div>
  );
});



const Dashboard: React.FC = () => {
  console.time('Dashboard Load');
  const renderCount = useRef(0);
  const [isTxnModalOpen, setIsTxnModalOpen] = React.useState(false);
  renderCount.current += 1;

  const { data: userRecord, isLoading: isUserLoading } = useUserRecord();
  const { data: activeCycle, isLoading: isCycleLoading } = useActiveCycle();
  const { data: transactions, isLoading: isTxnLoading } = useTransactions(activeCycle?.id);
  const { data: bills, isLoading: isBillsLoading } = useBills();
  const { data: goals, isLoading: isGoalsLoading } = useGoals();
  const { data: debts, isLoading: isDebtsLoading } = useDebts();

  const isLoading = isCycleLoading || isTxnLoading || isUserLoading || isBillsLoading || isGoalsLoading || isDebtsLoading;

  useEffect(() => {
    if (!isLoading) {
      console.timeEnd('Dashboard Load');
    }
  }, [isLoading]);

  const hasCycle = !!activeCycle && !!userRecord;
  const txns = useMemo(() => transactions || [], [transactions]);
  const b = useMemo(() => bills || [], [bills]);
  const g = useMemo(() => goals || [], [goals]);
  const d = useMemo(() => debts || [], [debts]);

  const upcomingBills = useMemo(() => hasCycle ? calculateUpcomingCycleBills(activeCycle, b, txns) : { expected: 0, paid: 0, remaining: 0, status: 'Unpaid' as any }, [hasCycle, activeCycle, b, txns]);
  const requiredGoals = useMemo(() => hasCycle ? calculateRequiredGoalContributions(activeCycle, g, userRecord, txns) : { expected: 0, paid: 0, remaining: 0, status: 'Unpaid' as any }, [hasCycle, activeCycle, g, userRecord, txns]);
  const upcomingDebts = useMemo(() => hasCycle ? calculateUpcomingDebtObligations(activeCycle, d, txns) : { expected: 0, paid: 0, remaining: 0, status: 'Unpaid' as any }, [hasCycle, activeCycle, d, txns]);
  
  const totalCash = useMemo(() => hasCycle ? calculateAvailableCash(activeCycle, txns) : 0, [hasCycle, activeCycle, txns]);
  const safeToSpend = useMemo(() => hasCycle ? calculateSafeToSpend(totalCash, upcomingBills, requiredGoals, upcomingDebts, userRecord) : 0, [hasCycle, totalCash, upcomingBills, requiredGoals, upcomingDebts, userRecord]);
  const projectedEndBalance = useMemo(() => hasCycle ? calculateProjectedEndBalance(totalCash, activeCycle, txns, upcomingBills, requiredGoals, upcomingDebts) : 0, [hasCycle, totalCash, activeCycle, txns, upcomingBills, requiredGoals, upcomingDebts]);

  // Extract Top 2 Recommendations
  const recommendations = useMemo(() => {
    const recs = [];
    if (safeToSpend < 0) {
      recs.push({ id: 'critical', label: 'Over Budget', color: 'bg-red-500', route: '/transactions', icon: <AlertCircle className="text-red-400" size={24} /> });
    }
    if (upcomingBills.remaining > 0) {
      recs.push({ id: 'bills', label: 'Manage Bills', color: 'bg-brand-orange', route: '/plan', icon: <AlertCircle className="text-brand-orange" size={24} /> });
    }
    if (recs.length < 2 && upcomingDebts.remaining > 0) {
      recs.push({ id: 'debts', label: 'Settle Debts', color: 'bg-blue-500', route: '/debts', icon: <AlertCircle className="text-blue-400" size={24} /> });
    }
    if (recs.length < 2 && requiredGoals.remaining > 0) {
      recs.push({ id: 'goals', label: 'Fund Goals', color: 'bg-emerald-500', route: '/plan', icon: <AlertCircle className="text-emerald-400" size={24} /> });
    }
    return recs.slice(0, 2);
  }, [safeToSpend, upcomingBills, upcomingDebts, requiredGoals]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center pt-20">
        <Loader2 className="animate-spin text-brand-orange" size={48} />
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative flex flex-col">
      {hasCycle ? (
        <TheOrbit safeToSpend={safeToSpend} recommendations={recommendations} />
      ) : (
        <div className="pt-24 px-6 max-w-5xl mx-auto flex-1">
          <CFOBriefing hasCycle={hasCycle} safeToSpend={safeToSpend} projectedEndBalance={projectedEndBalance} />
        </div>
      )}

      {hasCycle && (
        <TransactionModal 
          isOpen={isTxnModalOpen}
          onClose={() => setIsTxnModalOpen(false)}
          activeCycle={activeCycle}
        />
      )}
    </div>
  );
};

export default Dashboard;
