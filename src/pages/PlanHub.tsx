import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useActiveCycle } from '../hooks/useCycles';
import { useTransactions } from '../hooks/useTransactions';
import { useBills } from '../hooks/useBills';
import { useGoals } from '../hooks/useGoals';
import { useDebts } from '../hooks/useDebts';
import { useUserRecord } from '../hooks/useUser';
import { calculateAvailableCash } from '../utils/engines';
import { BillModal } from '../components/domain/bills/BillModal';
import { GoalModal } from '../components/domain/goals/GoalModal';
import type { Bill, Goal } from '../types/database';

const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

interface TimelineNode {
  id: string;
  date: Date;
  type: 'bill' | 'goal' | 'debt' | 'paycheck';
  title: string;
  amount: number;
  status: 'pending' | 'resolved';
}

const PlanHub: React.FC = () => {
  const { data: activeCycle } = useActiveCycle();
  const { data: txns } = useTransactions(activeCycle?.id);
  const { data: bills } = useBills();
  const { data: goals } = useGoals();
  const { data: debts } = useDebts();
  const { data: userRecord } = useUserRecord();

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.openAddModal) {
      if (location.state.defaultType === 'bill') {
        setSelectedBill(null);
        setIsBillModalOpen(true);
      } else if (location.state.defaultType === 'goal') {
        setSelectedGoal(null);
        setIsGoalModalOpen(true);
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const handleNodeClick = (node: TimelineNode) => {
    if (node.type === 'bill') {
      const bill = bills?.find(b => `bill-${b.id}` === node.id);
      if (bill) {
        setSelectedBill(bill);
        setIsBillModalOpen(true);
      }
    } else if (node.type === 'goal') {
      const goal = goals?.find(g => `goal-${g.id}` === node.id);
      if (goal) {
        setSelectedGoal(goal);
        setIsGoalModalOpen(true);
      }
    }
  };

  // Generate timeline nodes
  const nodes = useMemo(() => {
    if (!activeCycle || !userRecord) return [];
    
    let items: TimelineNode[] = [];
    
    // Base paycheck node (next cycle start)
    const cycleEnd = new Date(activeCycle.end_date);
    items.push({
      id: 'paycheck-1',
      date: cycleEnd,
      type: 'paycheck',
      title: 'Next Paycheck',
      amount: userRecord.base_salary,
      status: 'pending'
    });

    // Add bills
    bills?.forEach(b => {
      const billDate = new Date(activeCycle.start_date);
      billDate.setDate(b.due_day);
      if (billDate < new Date(activeCycle.start_date)) billDate.setMonth(billDate.getMonth() + 1);
      
      items.push({
        id: `bill-${b.id}`,
        date: billDate,
        type: 'bill',
        title: b.name,
        amount: b.amount,
        status: 'pending'
      });
    });

    // Add goals
    goals?.forEach(g => {
      items.push({
        id: `goal-${g.id}`,
        date: cycleEnd, // typically due by end of cycle
        type: 'goal',
        title: g.name,
        amount: g.target_amount,
        status: 'pending'
      });
    });

    // Add debts
    debts?.filter(d => d.debt_type === 'owe_money' && d.status !== 'completed').forEach(d => {
      items.push({
        id: `debt-${d.id}`,
        date: cycleEnd, // arbitrary for now without due dates on debts
        type: 'debt',
        title: d.person_name,
        amount: d.outstanding_balance,
        status: 'pending'
      });
    });

    return items.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [activeCycle, userRecord, bills, goals, debts]);

  // Handle scroll to calculate active nodes and update safe to spend projection
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      const progress = scrollLeft / (scrollWidth - clientWidth);
      setScrollProgress(progress);
    }
  };

  const currentCash = useMemo(() => activeCycle && txns ? calculateAvailableCash(activeCycle, txns) : 0, [activeCycle, txns]);
  
  // Calculate dynamic safe to spend based on scroll progress.
  // The further we scroll, the more future liabilities we subtract.
  const visibleNodesCount = Math.max(0, Math.floor(scrollProgress * nodes.length) + 1);
  const activeNodes = nodes.slice(0, visibleNodesCount);
  
  const projectedLiabilities = activeNodes.reduce((sum, n) => {
    if (n.type === 'paycheck') return sum - n.amount; // Negative liability (income)
    return sum + n.amount;
  }, 0);

  const projectedSafeToSpend = currentCash - projectedLiabilities;

  return (
    <div className="h-screen w-full bg-[#000000] text-white flex flex-col overflow-hidden font-sans pt-16 md:pt-0">
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 md:p-10 z-30 flex justify-between items-start pointer-events-none">
        <div>
          <h1 className="text-4xl md:text-5xl font-outfit font-black tracking-tighter mb-1 drop-shadow-2xl">The Horizon</h1>
          <p className="text-gray-500 font-medium pointer-events-auto">Your financial future.</p>
        </div>
        <div className="flex gap-2 pointer-events-auto">
           <button 
            onClick={() => { setSelectedBill(null); setIsBillModalOpen(true); }}
            className="px-4 py-2 rounded-full bg-[#18181B] text-white text-sm font-bold active:scale-95 transition-transform"
          >
            + Bill
          </button>
          <button 
            onClick={() => { setSelectedGoal(null); setIsGoalModalOpen(true); }}
            className="px-4 py-2 rounded-full bg-[#18181B] text-white text-sm font-bold active:scale-95 transition-transform"
          >
            + Goal
          </button>
        </div>
      </div>

      {/* Sky / Projection Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative p-6 mt-12 md:mt-0">
        <div className="absolute inset-0 bg-emerald-500/10 blur-[150px] opacity-50" />
        
        <motion.div 
          className="relative z-10 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-6 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
            Projected Safe To Spend
          </p>
          <h1 className="text-[100px] md:text-[140px] font-outfit font-black tracking-tighter leading-none drop-shadow-2xl flex items-start justify-center">
            <span className="text-5xl md:text-7xl text-white/40 font-light mt-4 md:mt-8 mr-2">₹</span>
            {formatINR(projectedSafeToSpend).replace('₹', '')}
          </h1>
          
          <div className="mt-8 flex items-center justify-center gap-2 text-gray-500">
            <span className="text-sm font-medium">Swipe horizon to travel in time</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </motion.div>
      </div>

      {/* Horizon Track */}
      <div className="h-[40vh] md:h-[45vh] w-full relative border-t border-[#18181B] bg-gradient-to-b from-[#09090B] to-[#000000]">
        {/* The Track Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#18181B] to-transparent z-0"></div>

        <div 
          ref={containerRef}
          onScroll={handleScroll}
          className="w-full h-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory flex items-end pb-8 pt-8 hide-scrollbar px-[50vw]"
        >
          <div className="flex items-end gap-32 relative z-10 h-full">
            {nodes.map((node, i) => {
              const isIncome = node.type === 'paycheck';
              const colorClass = isIncome ? 'bg-emerald-400' : 'bg-brand-orange';
              const shadowClass = isIncome ? 'shadow-[0_0_30px_rgba(52,211,153,0.3)]' : 'shadow-[0_0_30px_rgba(249,115,22,0.3)]';
              
              // Map amount to height (arbitrary scale for visual effect)
              const heightStr = `${Math.max(20, Math.min(100, (node.amount / 5000) * 100))}%`;

              return (
                <div 
                  key={`${node.id}-${i}`} 
                  onClick={() => handleNodeClick(node)}
                  className="snap-center flex flex-col items-center justify-end h-full group shrink-0 w-32 cursor-pointer"
                >
                  
                  {/* Floating Metadata */}
                  <div className="opacity-50 group-hover:opacity-100 transition-opacity flex flex-col items-center mb-4 text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">
                      {node.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-sm font-medium text-white whitespace-nowrap">{node.title}</p>
                    <p className={`text-lg font-outfit font-bold tracking-tight ${isIncome ? 'text-emerald-400' : 'text-white'}`}>
                      {isIncome ? '+' : '-'}{formatINR(node.amount)}
                    </p>
                  </div>

                  {/* Monolith */}
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: heightStr }}
                    transition={{ type: "spring", stiffness: 100, delay: i * 0.1 }}
                    className={`w-3 rounded-t-full ${colorClass} ${shadowClass} relative`}
                  >
                    <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent" />
                  </motion.div>
                  
                  {/* Node Base / Reflection */}
                  <div className={`w-8 h-2 rounded-full ${colorClass} blur-md mt-2 opacity-50`}></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <BillModal 
        isOpen={isBillModalOpen}
        onClose={() => setIsBillModalOpen(false)}
        billToEdit={selectedBill || undefined}
      />

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        goalToEdit={selectedGoal || undefined}
      />
    </div>
  );
};

export default PlanHub;
