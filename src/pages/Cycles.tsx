import React, { useState } from 'react';
import { toast } from 'sonner';
import { CalendarClock, Loader2, Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { useCycles, useDeleteCycle } from '../hooks/useCycles';
import { CycleModal } from '../components/domain/cycles/CycleModal';
import type { Cycle } from '../types/database';

const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const Cycles: React.FC = () => {
  const { data: cycles, isLoading } = useCycles();
  const deleteCycle = useDeleteCycle();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cycleToEdit, setCycleToEdit] = useState<Cycle | null>(null);

  const handleAdd = () => {
    setCycleToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (cycle: Cycle) => {
    setCycleToEdit(cycle);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this cycle?')) {
      try {
        await deleteCycle.mutateAsync(id);
      } catch (err: any) {
        toast.error('An error occurred.');
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

  return (
    <div className="p-6 md:p-10 pb-24 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Salary Cycles</h1>
          <p className="text-sm text-gray-400 mt-1">Manage your financial timelines and forecasting periods.</p>
        </div>
        <button 
          onClick={handleAdd}
          className="bg-brand-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <Plus size={20} />
          <span className="hidden md:inline">Add Cycle</span>
        </button>
      </div>

      {!cycles || cycles.length === 0 ? (
        <div className="text-center text-gray-400 py-12 bg-brand-dark rounded-2xl border border-gray-800">
          <CalendarClock size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-lg">No salary cycles found.</p>
          <p className="text-sm mt-1">Start by creating an active cycle to begin planning.</p>
          <button 
            onClick={handleAdd}
            className="mt-6 text-brand-orange hover:underline font-medium"
          >
            + Create your first cycle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cycles.map(cycle => {
            return (
              <div 
                key={cycle.id} 
                className={`bg-brand-dark rounded-2xl p-6 border group relative transition-colors ${
                  cycle.is_active ? 'border-brand-orange/50 shadow-[0_0_15px_rgba(255,87,34,0.1)]' : 'border-gray-800'
                }`}
              >
                
                <div className="absolute top-4 right-4 flex space-x-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEdit(cycle)}
                    className="p-1.5 bg-gray-800/80 hover:bg-gray-700 text-gray-300 rounded transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(cycle.id)}
                    disabled={deleteCycle.isPending}
                    className="p-1.5 bg-gray-800/80 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="flex items-start mb-6">
                  <div className={`p-3 rounded-xl mr-4 ${cycle.is_active ? 'bg-brand-orange/20' : 'bg-gray-800'}`}>
                    <CalendarClock className={cycle.is_active ? 'text-brand-orange' : 'text-gray-400'} size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg leading-tight flex items-center">
                      {cycle.name || 'Unnamed Cycle'}
                      {cycle.is_active && (
                        <span className="ml-2 inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-orange/20 text-brand-orange">
                          <CheckCircle2 size={10} />
                          <span>Active</span>
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(cycle.start_date)} - {formatDate(cycle.end_date)}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-800/50">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Starting Balance</p>
                    <p className="font-medium">{formatINR(cycle.starting_balance || 0)}</p>
                  </div>
                  <div className="bg-blue-500/5 p-3 rounded-lg border border-blue-500/10">
                    <p className="text-xs text-blue-400/80 uppercase tracking-wider mb-1">Expected Income</p>
                    <p className="font-medium text-blue-400">{formatINR(cycle.expected_income)}</p>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      <CycleModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cycleToEdit={cycleToEdit}
      />
    </div>
  );
};

export default Cycles;
