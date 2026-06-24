import React, { useState, useMemo } from 'react';
import { Plus, Search, Loader2, ArrowUpRight, ArrowDownRight, Edit2, Trash2, Filter } from 'lucide-react';
import { toast } from 'sonner';
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
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const handleAdd = () => {
    setTxnToEdit(null);
    setIsModalOpen(true);
  };

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
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [txns, searchQuery, typeFilter, categoryFilter]);

  // Extract unique categories for the filter dropdown based on current txns
  const uniqueCategories = useMemo(() => {
    if (!txns) return [];
    return Array.from(new Set(txns.filter(t => t.status !== 'REVERSED' && t.status !== 'ARCHIVED').map(t => t.category))).sort();
  }, [txns]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center pt-20">
        <Loader2 className="animate-spin text-brand-orange" size={48} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 pb-24 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold">Ledger</h1>
          <p className="text-sm text-gray-400 mt-1">Track your income and expenses.</p>
        </div>
        <button 
          onClick={handleAdd}
          disabled={!activeCycle}
          className="bg-brand-orange hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors shrink-0"
        >
          <Plus size={20} />
          <span>Log Transaction</span>
        </button>
      </div>

      {!activeCycle ? (
        <div className="bg-brand-dark/50 border border-brand-orange/30 p-8 text-center rounded-xl">
          <p className="text-brand-orange font-medium text-lg">Please create an active salary cycle before logging transactions.</p>
          <p className="text-gray-400 mt-2 text-sm">You can create one in the Salary Cycles tab.</p>
        </div>
      ) : (
        <>
          {/* Filters Bar */}
          <div className="bg-brand-dark rounded-xl border border-gray-800 p-4 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text"
                placeholder="Search notes or category..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-brand-orange"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2 bg-gray-900 border border-gray-700 rounded-lg px-3">
                <Filter size={16} className="text-gray-500" />
                <select 
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="bg-transparent text-white py-2 outline-none cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2 bg-gray-900 border border-gray-700 rounded-lg px-3">
                <select 
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="bg-transparent text-white py-2 outline-none cursor-pointer w-32 md:w-auto"
                >
                  <option value="all">All Categories</option>
                  {uniqueCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Transaction List */}
          <div className="bg-brand-dark rounded-2xl border border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between text-sm font-medium text-gray-400 uppercase tracking-wider">
              <span>Transactions</span>
              <span>{filteredTxns.length} records</span>
            </div>

            {filteredTxns.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                {txns?.length === 0 ? 'No transactions logged in this cycle yet.' : 'No transactions match your filters.'}
              </div>
            ) : (
              <div className="divide-y divide-gray-800/50">
                {filteredTxns.map((t) => (
                  <div key={t.id} className="p-4 px-6 flex items-center justify-between hover:bg-gray-800/30 transition-colors group">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl ${
                        t.type === 'income' ? 'bg-green-500/10 text-green-400' : 
                        t.type === 'expense' ? 'bg-red-500/10 text-red-400' : 
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {t.type === 'income' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-100 flex items-center space-x-2">
                          <span>{t.category}</span>
                          {t.type === 'expense' && (
                            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${t.is_need ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-700 text-gray-300'}`}>
                              {t.is_need ? 'Need' : 'Want'}
                            </span>
                          )}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-400">
                            {new Date(t.transaction_date).toLocaleDateString()}
                          </span>
                          {t.notes && (
                            <>
                              <span className="text-gray-600">•</span>
                              <span className="text-xs text-gray-500 truncate max-w-[150px] md:max-w-xs">{t.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                        <button onClick={() => handleEdit(t)} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className={`font-bold ${t.type === 'income' ? 'text-green-400' : t.type === 'expense' ? 'text-gray-100' : 'text-blue-400'}`}>
                        {t.type === 'expense' ? '-' : '+'}{formatINR(Number(t.amount))}
                      </p>
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
