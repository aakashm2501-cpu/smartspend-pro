import React, { useState } from 'react';
import { Target, Loader2, Plus, Edit2, Trash2, ShieldAlert, Plane, Car, Home, TrendingUp as InvestmentIcon } from 'lucide-react';
import { useGoals, useDeleteGoal } from '../hooks/useGoals';
import { useUserRecord } from '../hooks/useUser';
import { calculateSingleGoalContribution } from '../utils/engines';
import { GoalModal } from '../components/domain/goals/GoalModal';
import type { Goal } from '../types/database';

const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
};

const getIconForType = (type: string) => {
  switch(type) {
    case 'Emergency Fund': return <ShieldAlert className="text-red-400" size={24} />;
    case 'Vacation': return <Plane className="text-blue-400" size={24} />;
    case 'Vehicle': return <Car className="text-yellow-400" size={24} />;
    case 'Home': return <Home className="text-green-400" size={24} />;
    case 'Investment': return <InvestmentIcon className="text-purple-400" size={24} />;
    default: return <Target className="text-brand-orange" size={24} />;
  }
};

const getBgForType = (type: string) => {
  switch(type) {
    case 'Emergency Fund': return 'bg-red-500/10';
    case 'Vacation': return 'bg-blue-500/10';
    case 'Vehicle': return 'bg-yellow-500/10';
    case 'Home': return 'bg-green-500/10';
    case 'Investment': return 'bg-purple-500/10';
    default: return 'bg-brand-orange/10';
  }
};

const Goals: React.FC = () => {
  const { data: goals, isLoading } = useGoals();
  const { data: userRecord } = useUserRecord();
  const deleteGoal = useDeleteGoal();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);

  const handleAdd = () => {
    setGoalToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (goal: Goal) => {
    setGoalToEdit(goal);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      await deleteGoal.mutateAsync(id);
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
        <h1 className="text-3xl font-bold">Savings Goals</h1>
        <button 
          onClick={handleAdd}
          className="bg-brand-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <Plus size={20} />
          <span className="hidden md:inline">Add Goal</span>
        </button>
      </div>

      {!goals || goals.length === 0 ? (
        <div className="text-center text-gray-400 py-12 bg-brand-dark rounded-2xl border border-gray-800">
          <Target size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-lg">No goals found.</p>
          <p className="text-sm mt-1">Start tracking your financial milestones today!</p>
          <button 
            onClick={handleAdd}
            className="mt-6 text-brand-orange hover:underline font-medium"
          >
            + Add your first goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map(g => {
            const current = Number(g.current_amount);
            const target = Number(g.target_amount);
            const percent = Math.min((current / target) * 100, 100);
            const remaining = Math.max(target - current, 0);
            
            // Engine calculation
            const contribution = userRecord ? calculateSingleGoalContribution(g, userRecord) : 0;
            
            return (
              <div key={g.id} className="bg-brand-dark rounded-2xl p-6 border border-gray-800 group relative">
                
                <div className="absolute top-4 right-4 flex space-x-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEdit(g)}
                    className="p-1.5 bg-gray-800/80 hover:bg-gray-700 text-gray-300 rounded transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(g.id)}
                    disabled={deleteGoal.isPending}
                    className="p-1.5 bg-gray-800/80 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="flex items-start mb-6">
                  <div className={`p-3 rounded-xl mr-4 ${getBgForType(g.type)}`}>
                    {getIconForType(g.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg leading-tight">{g.name}</h3>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{g.type}</p>
                  </div>
                </div>
                
                <div className="mb-2 flex justify-between items-end">
                  <p className="text-2xl font-bold">{formatINR(current)}</p>
                  <p className="text-sm text-gray-400">/ {formatINR(target)}</p>
                </div>
                
                <div className="w-full bg-gray-800 rounded-full h-2 mb-3">
                  <div className="bg-brand-orange h-2 rounded-full" style={{ width: `${percent}%` }}></div>
                </div>
                
                <div className="flex justify-between items-center text-xs text-gray-400 pt-2 border-t border-gray-800/50">
                  <span>{percent.toFixed(1)}% funded</span>
                  <span>{formatINR(remaining)} left</span>
                </div>
                
                {contribution > 0 && remaining > 0 && (
                  <div className="mt-4 bg-gray-800/30 rounded-lg p-3 flex justify-between items-center border border-gray-800/50">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Req. Contribution</span>
                    <span className="font-medium text-brand-orange">{formatINR(contribution)} / cycle</span>
                  </div>
                )}
                {remaining === 0 && (
                  <div className="mt-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg p-3 text-center text-sm font-medium">
                    Goal Reached! 🎉
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <GoalModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        goalToEdit={goalToEdit}
      />
    </div>
  );
};

export default Goals;
