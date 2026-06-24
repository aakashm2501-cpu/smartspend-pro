import React, { useMemo, useRef, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, AlertCircle, Loader2, Plus } from 'lucide-react';
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
  calculateDailyAllowance,
  calculateProjectedEndBalance,
  calculateActualIncome,
  calculateIncomeVariance,
  getTransactionBehavior
} from '../utils/engines';

const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
};

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

const SafeToSpendHero = React.memo(({ safeToSpend, dailyAllowance, projectedEndBalance, onAddTransaction }: { safeToSpend: number, dailyAllowance: number, projectedEndBalance: number, onAddTransaction: () => void }) => {
  const safeToSpendParts = safeToSpend.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).split('.');
  return (
    <div className="flex flex-col items-center justify-center pt-16 pb-12 relative w-full border-b border-gray-800/50 bg-[#09090B]">
      <div className="absolute top-0 inset-x-0 h-40 bg-brand-orange/5 blur-[100px] pointer-events-none" />
      
      <p className="text-gray-500 font-medium uppercase tracking-[0.3em] text-xs mb-6">Safe to Spend</p>
      
      <h1 className="text-8xl md:text-[10rem] font-bold tracking-tighter text-white drop-shadow-lg flex items-start leading-none">
        <span className="text-5xl md:text-7xl text-gray-600 font-light mt-2 md:mt-4 mr-2">₹</span>
        {safeToSpendParts[0]}
        <span className="text-4xl md:text-6xl text-gray-500 font-medium mt-auto mb-2 md:mb-4 ml-1">.{safeToSpendParts[1] || '00'}</span>
      </h1>
      
      <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-md px-6">
        <div className="flex flex-col items-center justify-center p-4 rounded-3xl bg-[#18181B] border border-gray-800/60 shadow-inner">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Daily Allowance</p>
          <p className="text-xl font-semibold text-brand-orange">{formatINR(dailyAllowance)}</p>
        </div>
        <div className="flex flex-col items-center justify-center p-4 rounded-3xl bg-[#18181B] border border-gray-800/60 shadow-inner">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Projected End</p>
          <p className="text-xl font-semibold text-blue-400">{formatINR(projectedEndBalance)}</p>
        </div>
      </div>

      <button 
        onClick={onAddTransaction}
        className="mt-10 bg-brand-orange hover:bg-orange-600 text-white rounded-full px-8 py-4 font-semibold text-lg flex items-center shadow-lg shadow-brand-orange/20 transition-transform active:scale-95"
      >
        <Plus size={24} className="mr-2" />
        Add Transaction
      </button>
    </div>
  );
});

const ObligationSettlementEngine = React.memo(({ upcomingBills, requiredGoals, upcomingDebts }: any) => (
  <div className="bg-brand-dark rounded-2xl p-6 border border-gray-800 mt-8">
    <h2 className="text-lg font-bold mb-4 flex items-center">
      <AlertCircle className="text-gray-400 mr-2" size={20} />
      Obligation Settlement Engine
    </h2>
    <div className="space-y-4">
      {[
        { label: 'Bills', data: upcomingBills },
        { label: 'Goals', data: requiredGoals },
        { label: 'Debts', data: upcomingDebts }
      ].map(({ label, data }) => (
        <div key={label} className="flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg bg-gray-800/30 border border-gray-800/50">
          <div className="mb-2 md:mb-0 w-1/4">
            <span className="font-semibold text-white">{label}</span>
            <div className={`text-xs mt-0.5 font-bold uppercase tracking-wider ${
              data.status === 'Fully Paid' ? 'text-green-400' :
              data.status === 'Partially Paid' ? 'text-orange-400' : 'text-red-400'
            }`}>{data.status}</div>
          </div>
          <div className="flex justify-between md:justify-around w-full md:w-3/4 text-sm">
            <div className="text-center">
              <div className="text-gray-500 mb-1">Expected</div>
              <div className="font-medium text-white">{formatINR(data.expected)}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 mb-1">{label === 'Goals' ? 'Contributed' : 'Paid'}</div>
              <div className="font-medium text-blue-400">{formatINR(data.paid)}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 mb-1">Remaining</div>
              <div className="font-bold text-brand-orange">{formatINR(data.remaining)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
));

const IncomeTrackingPanel = React.memo(({ expectedIncome, actualIncomeTotal, incomeVariance }: any) => (
  <div className="mt-8 bg-brand-dark/30 rounded-2xl p-6 border border-gray-800">
    <h3 className="text-gray-400 font-medium mb-4 flex items-center">
      <Wallet className="mr-2 text-blue-400" size={18} />
      Income Tracking (Cycle)
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Expected Income</p>
        <p className="text-xl font-semibold text-gray-300">{formatINR(expectedIncome)}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Actual Received</p>
        <p className="text-xl font-semibold text-white">{formatINR(actualIncomeTotal)}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Income Variance</p>
        <div className="flex items-center space-x-2">
          <p className={`text-xl font-semibold ${incomeVariance >= 0 ? 'text-green-400' : 'text-brand-orange'}`}>
            {incomeVariance > 0 ? '+' : ''}{incomeVariance.toFixed(1)}%
          </p>
          <span className="text-xs text-gray-500">vs expected</span>
        </div>
      </div>
    </div>
  </div>
));

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

  console.time('Dashboard Render');

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
  const dailyAllowance = useMemo(() => hasCycle ? calculateDailyAllowance(safeToSpend, activeCycle) : 0, [hasCycle, safeToSpend, activeCycle]);
  const projectedEndBalance = useMemo(() => hasCycle ? calculateProjectedEndBalance(totalCash, activeCycle, txns, upcomingBills, requiredGoals, upcomingDebts) : 0, [hasCycle, totalCash, activeCycle, txns, upcomingBills, requiredGoals, upcomingDebts]);
  
  const spentSoFar = useMemo(() => {
    if (!hasCycle) return 0;
    return txns
      .filter(t => t.status !== 'REVERSED' && t.status !== 'ARCHIVED')
      .reduce((sum, t) => {
        const behavior = getTransactionBehavior(t);
        if (behavior.affectsAvailableCash && t.type === 'expense') {
          return sum + Number(t.amount);
        }
        return sum;
      }, 0);
  }, [hasCycle, txns]);

  const daysRemaining = useMemo(() => {
    if (!hasCycle) return 0;
    const today = new Date();
    const endDate = new Date(activeCycle.end_date);
    return Math.max(Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)), 0);
  }, [hasCycle, activeCycle]);

  const expectedIncome = useMemo(() => hasCycle ? Number(activeCycle.expected_income) : 0, [hasCycle, activeCycle]);
  const actualIncomeTotal = useMemo(() => hasCycle ? calculateActualIncome(txns) : 0, [hasCycle, txns]);
  const incomeVariance = useMemo(() => calculateIncomeVariance(expectedIncome, actualIncomeTotal), [expectedIncome, actualIncomeTotal]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center pt-20">
        <Loader2 className="animate-spin text-brand-orange" size={48} />
      </div>
    );
  }

  const isDev = import.meta.env.DEV;

  const renderContent = () => (
    <div className="w-full relative pb-24 md:pb-10">
      
      {isDev && (
        <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 p-4 rounded-lg shadow-xl text-xs z-50 text-gray-300 opacity-90 hover:opacity-100 transition-opacity pointer-events-none">
          <h4 className="font-bold text-white mb-2 pb-1 border-b border-gray-700">Diagnostics</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span>Renders:</span><span className="text-right text-brand-orange font-mono">{renderCount.current}</span>
            <span>Cycle:</span><span className="text-right text-brand-orange font-mono truncate w-20">{activeCycle?.id?.substring(0,6) || 'None'}</span>
            <span>Txns:</span><span className="text-right text-brand-orange font-mono">{txns.length}</span>
            <span>Bills:</span><span className="text-right text-brand-orange font-mono">{b.length}</span>
            <span>Goals:</span><span className="text-right text-brand-orange font-mono">{g.length}</span>
            <span>Debts:</span><span className="text-right text-brand-orange font-mono">{d.length}</span>
          </div>
        </div>
      )}

      {hasCycle ? (
        <SafeToSpendHero 
          safeToSpend={safeToSpend} 
          dailyAllowance={dailyAllowance} 
          projectedEndBalance={projectedEndBalance} 
          onAddTransaction={() => setIsTxnModalOpen(true)}
        />
      ) : (
        <div className="pt-20 px-6 max-w-7xl mx-auto">
          <CFOBriefing hasCycle={hasCycle} safeToSpend={safeToSpend} projectedEndBalance={projectedEndBalance} />
        </div>
      )}

      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#18181B] rounded-3xl p-6 border border-gray-800/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-gray-400 font-medium">Available Cash</h3>
              <div className="bg-green-500/10 p-2 rounded-xl">
                <ArrowUpRight className="text-green-400" size={20} />
              </div>
            </div>
            <p className="text-4xl font-bold tracking-tight">{formatINR(totalCash)}</p>
            <p className="text-sm text-green-400 mt-2 font-medium">{daysRemaining} days left in cycle</p>
          </div>

          <div className="bg-[#18181B] rounded-3xl p-6 border border-gray-800/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-gray-400 font-medium">Spent So Far</h3>
              <div className="bg-red-500/10 p-2 rounded-xl">
                <ArrowDownRight className="text-red-400" size={20} />
              </div>
            </div>
            <p className="text-4xl font-bold tracking-tight">{formatINR(spentSoFar)}</p>
            <p className="text-sm text-gray-500 mt-2">Based on {txns.length} transactions</p>
          </div>
        </div>

        {hasCycle && <ObligationSettlementEngine upcomingBills={upcomingBills} requiredGoals={requiredGoals} upcomingDebts={upcomingDebts} />}

        {hasCycle && <IncomeTrackingPanel expectedIncome={expectedIncome} actualIncomeTotal={actualIncomeTotal} incomeVariance={incomeVariance} />}
      </div>

      {hasCycle && (
        <TransactionModal 
          isOpen={isTxnModalOpen}
          onClose={() => setIsTxnModalOpen(false)}
          activeCycle={activeCycle}
        />
      )}
    </div>
  );

  console.timeEnd('Dashboard Render');
  return renderContent();
};

export default Dashboard;
