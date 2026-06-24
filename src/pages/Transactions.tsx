import React, { useState, useMemo } from 'react';
import { Search, Loader2, ArrowUpRight, ArrowDownRight, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTransactions, useDeleteTransaction } from '../hooks/useTransactions';
import { useActiveCycle } from '../hooks/useCycles';
import { TransactionModal } from '../components/domain/transactions/TransactionModal';
import type { Transaction } from '../types/database';

const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
};

const Transactions: React.FC = () => {
  const { data: activeCycle, isLoading: isCycleLoading } = useActiveCycle();
  const { data: txns, isLoading: isTxnLoading } = useTransactions(activeCycle?.id);
  const deleteTxn = useDeleteTransaction();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txnToEdit, setTxnToEdit] = useState<Transaction | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');

  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (location.state?.openAddModal) {
      setTxnToEdit(null);
      setIsModalOpen(true);
      // Clear state so it doesn't reopen on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const handleEdit = (txn: Transaction) => {
    setTxnToEdit(txn);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTxn.mutateAsync(id);
        toast.success('Transaction deleted');
      } catch (err: any) {
        toast.error('Failed to delete transaction.');
      }
    }
  };

  const isLoading = isCycleLoading || isTxnLoading;

  const filteredTxns = useMemo(() => {
    if (!txns) return [];
    
    return txns.filter(t => {
      if (t.status === 'REVERSED' || t.status === 'ARCHIVED') return false;

      const matchesSearch = t.notes?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      
      return matchesSearch && matchesType;
    }).sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
  }, [txns, searchQuery, typeFilter]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center pt-20 bg-[#000000]">
        <Loader2 className="animate-spin text-brand-orange" size={48} />
      </div>
    );
  }

  return (
    <div className="relative p-6 pt-12 md:p-10 pb-32 max-w-4xl mx-auto space-y-6 bg-[#000000] min-h-screen text-white font-sans overflow-hidden">
      {/* Ambient Visual Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20 flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-brand-orange/30 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px] absolute top-10 right-10 animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 flex flex-col mb-4">
        <h1 className="text-5xl font-outfit font-black tracking-tighter">Ledger</h1>
        <p className="text-gray-500 mt-2 text-lg font-medium">Your financial story.</p>
      </div>

      {!activeCycle ? (
        <div className="bg-[#09090B] border border-[#18181B] p-8 text-center rounded-3xl">
          <p className="text-brand-orange font-medium text-lg">Please create an active salary cycle.</p>
        </div>
      ) : (
        <>
          {/* Controls Segment */}
          <div className="relative z-10 flex flex-col gap-4 sticky top-0 bg-[#000000] py-2 shadow-[0_10px_30px_-10px_rgba(0,0,0,1)]">
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input 
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#09090B] border border-[#18181B] rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-brand-orange/50 transition-colors shadow-inner"
              />
            </div>

            <div className="flex bg-[#09090B] border border-[#18181B] rounded-full p-1">
              {(['all', 'expense', 'income'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`flex-1 py-2.5 text-sm font-semibold capitalize rounded-full transition-all ${
                    typeFilter === type 
                      ? 'bg-[#18181B] text-white shadow-sm' 
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex flex-col">
            {filteredTxns.length === 0 ? (
              <div className="text-center py-20 relative">
                <div className="w-24 h-24 bg-white/5 rounded-full blur-xl absolute"></div>
                <p className="text-xl font-outfit font-bold text-white relative z-10 mt-6">
                  {txns?.length === 0 ? 'Your story begins here.' : 'No matches found.'}
                </p>
                <p className="text-gray-500 mt-2 relative z-10">Nothing logged yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTxns.map((t) => (
                  <div key={t.id} className="group relative flex items-center justify-between py-5 px-6 bg-transparent border-b border-[#18181B] hover:bg-[#09090B] transition-all cursor-pointer rounded-2xl active:scale-[0.98]">
                    <div className="flex items-center space-x-6">
                      <div className={`w-14 h-14 flex items-center justify-center rounded-full ${
                        t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 
                        t.type === 'expense' ? 'bg-[#18181B] text-white' : 
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {t.type === 'income' ? <ArrowDownRight size={28} /> : <ArrowUpRight size={28} />}
                      </div>
                      <div className="flex flex-col">
                        <p className="font-medium text-lg leading-tight text-white">
                          {t.notes || t.category}
                        </p>
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mt-1.5">
                          {new Date(t.transaction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <p className={`font-outfit font-bold text-[24px] tracking-tight ${t.type === 'income' ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]' : 'text-white'}`}>
                        {formatINR(Number(t.amount))}
                      </p>
                      
                      {/* Action Menu */}
                      <div className="flex space-x-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(t); }} className="text-gray-500 hover:text-white transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} className="text-gray-500 hover:text-rose-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeCycle && (
        <TransactionModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          transactionToEdit={txnToEdit}
          activeCycle={activeCycle}
        />
      )}
    </div>
  );
};

export default Transactions;
