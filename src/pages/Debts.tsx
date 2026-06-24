 { toast } from 'sonner';
import { Plus, Loader2, Edit2, Trash2, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight, IndianRupee } from 'lucide-react';
import { useDebts, useDeleteDebt } from '../hooks/useDebts';
import { DebtModal } from '../components/domain/debts/DebtModal';
import { RecordPaymentModal } from '../components/domain/debts/RecordPaymentModal';
import type { Debt } from '../types/database';

const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
};

const Debts: React.FC = () => {
  const { data: debts, isLoading } = useDebts();
  const deleteDebt = useDeleteDebt();

  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [debtToEdit, setDebtToEdit] = useState<Debt | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [debtToPay, setDebtToPay] = useState<Debt | null>(null);

  const handleAdd = () => {
    setDebtToEdit(null);
    setIsDebtModalOpen(true);
  };

  const handleEdit = (debt: Debt) => {
    setDebtToEdit(debt);
    setIsDebtModalOpen(true);
  };

  const handleRecordPayment = (debt: Debt) => {
    setDebtToPay(debt);
    setIsPaymentModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this debt? Note: You cannot delete a debt if it has existing transaction history.')) {
      try {
        await deleteDebt.mutateAsync(id);
      } catch (err: any) {
        toast.error();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center pt-20">
        <Loader2 className="animate-spin text-brand-orange" size={48} />
      </div>
    );
  }

  const oweDebts = debts?.filter(d => d.debt_type === 'owe_money') || [];
  const owedDebts = debts?.filter(d => d.debt_type === 'owed_money') || [];

  const totalIOwe = oweDebts.reduce((sum, d) => sum + d.outstanding_balance, 0);
  const totalOwedToMe = owedDebts.reduce((sum, d) => sum + d.outstanding_balance, 0);

  const DebtCard = ({ debt }: { debt: Debt }) => {
    const isOwe = debt.debt_type === 'owe_money';
    const isCompleted = debt.status === 'completed';
    const progress = Math.min(100, Math.max(0, ((debt.original_amount - debt.outstanding_balance) / debt.original_amount) * 100));

    return (
      <div className={`bg-brand-dark rounded-2xl p-6 border relative group transition-all ${
        isCompleted ? 'border-gray-800 opacity-70' : 
        debt.status === 'overdue' ? 'border-red-500/50' : 'border-gray-800'
      }`}>
        <div className="absolute top-4 right-4 flex space-x-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => handleEdit(debt)}
            className="p-1.5 bg-gray-800/80 hover:bg-gray-700 text-gray-300 rounded transition-colors"
          >
            <Edit2 size={14} />
          </button>
          <button 
            onClick={() => handleDelete(debt.id)}
            disabled={deleteDebt.isPending}
            className="p-1.5 bg-gray-800/80 hover:bg-red-500/20 text-red-400 rounded transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>

        <div className="flex items-start mb-4">
          <div className={`p-3 rounded-xl mr-4 ${isOwe ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
            {isOwe ? <ArrowUpRight className="text-red-400" size={24} /> : <ArrowDownRight className="text-green-400" size={24} />}
          </div>
          <div>
            <h3 className="font-semibold text-lg leading-tight flex items-center">
              {debt.person_name}
              {isCompleted && (
                <span className="ml-2 inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-800 text-gray-400">
                  <CheckCircle2 size={10} />
                  <span>Completed</span>
                </span>
              )}
              {debt.status === 'overdue' && (
                <span className="ml-2 inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400">
                  <AlertTriangle size={10} />
                  <span>Overdue</span>
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Original: {formatINR(debt.original_amount)} • {debt.repayment_frequency.replace('_', ' ')}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Outstanding</span>
            <span className="font-bold text-white">{formatINR(debt.outstanding_balance)}</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${isCompleted ? 'bg-gray-500' : isOwe ? 'bg-red-400' : 'bg-green-400'}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-right text-[10px] text-gray-500 mt-1">{progress.toFixed(0)}% paid</p>
        </div>

        {!isCompleted && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Installment</p>
              <p className="font-medium">{formatINR(debt.installment_amount)}</p>
            </div>
            <button 
              onClick={() => handleRecordPayment(debt)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Record Payment
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 md:p-10 pb-24 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl font-bold">Debt Management</h1>
          <p className="text-sm text-gray-400 mt-1">Track money you owe and money owed to you.</p>
        </div>
        <button 
          onClick={handleAdd}
          className="bg-brand-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <Plus size={20} />
          <span className="hidden md:inline">Add Debt</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
          <div className="flex items-center space-x-3 mb-2">
            <ArrowUpRight className="text-red-400" size={20} />
            <h3 className="text-red-400 font-medium">Total I Owe</h3>
          </div>
          <p className="text-4xl font-bold text-white">{formatINR(totalIOwe)}</p>
        </div>
        
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6">
          <div className="flex items-center space-x-3 mb-2">
            <ArrowDownRight className="text-green-400" size={20} />
            <h3 className="text-green-400 font-medium">Total Owed To Me</h3>
          </div>
          <p className="text-4xl font-bold text-white">{formatINR(totalOwedToMe)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-8">
        {/* Money I Owe Section */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <IndianRupee className="mr-2 text-gray-400" size={20}/>
            Money I Owe
          </h2>
          {oweDebts.length === 0 ? (
            <div className="p-8 text-center text-gray-500 border border-gray-800 rounded-2xl border-dashed">
              No active debts recorded.
            </div>
          ) : (
            <div className="space-y-4">
              {oweDebts.map(debt => <DebtCard key={debt.id} debt={debt} />)}
            </div>
          )}
        </div>

        {/* Money Owed To Me Section */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <IndianRupee className="mr-2 text-gray-400" size={20}/>
            Money Owed To Me
          </h2>
          {owedDebts.length === 0 ? (
            <div className="p-8 text-center text-gray-500 border border-gray-800 rounded-2xl border-dashed">
              No active loans recorded.
            </div>
          ) : (
            <div className="space-y-4">
              {owedDebts.map(debt => <DebtCard key={debt.id} debt={debt} />)}
            </div>
          )}
        </div>
      </div>

      <DebtModal 
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        debtToEdit={debtToEdit}
      />

      <RecordPaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        debt={debtToPay}
      />
    </div>
  );
};

export default Debts;
