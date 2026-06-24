import React, { useState } from 'react';
import { CalendarClock, Clock, Loader2, Plus, Edit2, Trash2, Repeat } from 'lucide-react';
import { useBills, useDeleteBill } from '../hooks/useBills';
import { BillModal } from '../components/domain/bills/BillModal';
import type { Bill } from '../types/database';

const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

const Bills: React.FC = () => {
  const { data: bills, isLoading } = useBills();
  const deleteBill = useDeleteBill();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [billToEdit, setBillToEdit] = useState<Bill | null>(null);

  const handleAdd = () => {
    setBillToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (bill: Bill) => {
    setBillToEdit(bill);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this bill?')) {
      await deleteBill.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center pt-20">
        <Loader2 className="animate-spin text-brand-orange" size={48} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 pb-24 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Cycle Bills</h1>
        <button 
          onClick={handleAdd}
          className="bg-brand-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <Plus size={20} />
          <span className="hidden md:inline">Add Bill</span>
        </button>
      </div>
      
      {!bills || bills.length === 0 ? (
        <div className="text-center text-gray-400 py-12 bg-brand-dark rounded-2xl border border-gray-800">
          <CalendarClock size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-lg">No bills found.</p>
          <p className="text-sm mt-1">Add a bill to start tracking your upcoming payments!</p>
          <button 
            onClick={handleAdd}
            className="mt-6 text-brand-orange hover:underline font-medium"
          >
            + Add your first bill
          </button>
        </div>
      ) : (
        <div className="bg-brand-dark rounded-2xl border border-gray-800 overflow-hidden">
          <div className="divide-y divide-gray-800/50">
            {bills.map(b => (
              <div key={b.id} className="p-5 flex items-center justify-between hover:bg-gray-800/30 transition-colors group">
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-800 p-3 rounded-xl flex-shrink-0">
                    <CalendarClock size={20} className="text-gray-300" />
                  </div>
                  <div>
                    <p className="font-semibold">{b.name}</p>
                    <div className="flex items-center space-x-3 mt-1">
                      <p className="text-sm text-gray-400 flex items-center">
                        <Clock size={14} className="text-brand-orange mr-1.5" />
                        Due on day {b.due_day}
                      </p>
                      <p className="text-xs text-gray-500 uppercase tracking-wider flex items-center">
                        <Repeat size={12} className="mr-1" />
                        {b.frequency}
                      </p>
                      {b.is_auto_pay && (
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded uppercase tracking-wider">
                          Auto-Pay
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <p className="font-bold text-lg">{formatINR(Number(b.amount))}</p>
                  
                  {/* Actions visible on hover (desktop) or always (mobile) */}
                  <div className="flex items-center space-x-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(b)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(b.id)}
                      disabled={deleteBill.isPending}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <BillModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        billToEdit={billToEdit}
      />
    </div>
  );
};

export default Bills;
