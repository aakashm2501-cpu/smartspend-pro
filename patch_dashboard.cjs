const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Replace imports to include Plus and TransactionModal
content = content.replace(
  "import { ArrowUpRight, ArrowDownRight, Wallet, AlertCircle, Loader2 } from 'lucide-react';",
  "import { ArrowUpRight, ArrowDownRight, Wallet, AlertCircle, Loader2, Plus } from 'lucide-react';\nimport { TransactionModal } from '../components/domain/transactions/TransactionModal';"
);

// Replace SafeToSpendCard and the top section
const safeToSpendHeroRegex = /const SafeToSpendCard = React\.memo.*?\}\);/s;

const newSafeToSpendHero = `const SafeToSpendHero = React.memo(({ safeToSpend, dailyAllowance, projectedEndBalance, onAddTransaction }: { safeToSpend: number, dailyAllowance: number, projectedEndBalance: number, onAddTransaction: () => void }) => {
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
});`;

content = content.replace(safeToSpendHeroRegex, newSafeToSpendHero);

// Insert state for TransactionModal
content = content.replace(
  "const renderCount = useRef(0);",
  "const renderCount = useRef(0);\n  const [isTxnModalOpen, setIsTxnModalOpen] = React.useState(false);"
);

// Replace renderContent
const renderContentRegex = /const renderContent = \(\) => \((.*?)\);/s;

const newRenderContent = `const renderContent = () => (
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

      <TransactionModal 
        isOpen={isTxnModalOpen}
        onClose={() => setIsTxnModalOpen(false)}
        activeCycleId={activeCycle?.id}
      />
    </div>
  );`;

content = content.replace(renderContentRegex, newRenderContent);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
