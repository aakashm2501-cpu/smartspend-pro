import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import { useForm } from '../../../hooks/useForm';
import { useCreateCycle, useUpdateCycle } from '../../../hooks/useCycles';
import type { Cycle } from '../../../types/database';
import { Loader2 } from 'lucide-react';

interface CycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  cycleToEdit?: Cycle | null;
}

export const CycleModal: React.FC<CycleModalProps> = ({ isOpen, onClose, cycleToEdit }) => {
  const createCycle = useCreateCycle();
  const updateCycle = useUpdateCycle();
  const isPending = createCycle.isPending || updateCycle.isPending;
  const [isActiveCycle, setIsActiveCycle] = useState(false);

  const { values, errors, handleChange, validate, reset, setValues } = useForm({
    name: cycleToEdit?.name || '',
    start_date: cycleToEdit?.start_date || '',
    end_date: cycleToEdit?.end_date || '',
    starting_balance: cycleToEdit?.starting_balance !== null && cycleToEdit?.starting_balance !== undefined ? cycleToEdit.starting_balance.toString() : '',
    expected_income: cycleToEdit?.expected_income.toString() || '',
  }, {
    start_date: { required: true },
    end_date: { required: true },
    expected_income: { required: true, isNumeric: true, min: 0 },
  });

  useEffect(() => {
    if (isOpen) {
      if (cycleToEdit) {
        setValues({
          name: cycleToEdit.name || '',
          start_date: cycleToEdit.start_date,
          end_date: cycleToEdit.end_date,
          starting_balance: cycleToEdit.starting_balance !== null && cycleToEdit.starting_balance !== undefined ? cycleToEdit.starting_balance.toString() : '',
          expected_income: cycleToEdit.expected_income.toString(),
        });
        setIsActiveCycle(cycleToEdit.is_active);
      } else {
        reset();
        setIsActiveCycle(true);
      }
    }
  }, [isOpen, cycleToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (new Date(values.end_date) <= new Date(values.start_date)) {
      toast.error('An error occurred.');
      return;
    }
    
    if (!validate()) return;

    try {
      const startD = new Date(values.start_date);
      const generatedName = values.name || `${startD.toLocaleString('default', { month: 'long' })} ${startD.getFullYear()} Salary Cycle`;

      const payload = {
        name: generatedName,
        start_date: values.start_date,
        end_date: values.end_date,
        expected_income: values.expected_income ? Number(values.expected_income) : 0,
        starting_balance: values.starting_balance ? Number(values.starting_balance) : 0,
        is_active: isActiveCycle,
      };

      if (cycleToEdit) {
        await updateCycle.mutateAsync({ id: cycleToEdit.id, ...payload });
      } else {
        await createCycle.mutateAsync(payload);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error('An error occurred.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={cycleToEdit ? 'Edit Salary Cycle' : 'Add Salary Cycle'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input 
          label="Cycle Name (Optional)"
          value={values.name}
          onChange={e => handleChange('name', e.target.value)}
          error={errors.name}
          placeholder="e.g. October 2026"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Start Date"
            type="date"
            value={values.start_date}
            onChange={e => handleChange('start_date', e.target.value)}
            error={errors.start_date}
          />
          <Input 
            label="End Date"
            type="date"
            value={values.end_date}
            onChange={e => handleChange('end_date', e.target.value)}
            error={errors.end_date}
          />
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-4 mb-2">
          <p className="text-xs text-blue-400">
            <strong>Note:</strong> Expected Income is strictly for forecasting. Your Safe To Spend budget is purely driven by your Starting Balance and logged Income Transactions.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Starting Balance (₹) (Optional)"
            type="number"
            step="0.01"
            value={values.starting_balance}
            onChange={e => handleChange('starting_balance', e.target.value)}
            placeholder="0.00"
          />
          <Input 
            label="Expected Income (₹)"
            type="number"
            step="0.01"
            value={values.expected_income}
            onChange={e => handleChange('expected_income', e.target.value)}
            error={errors.expected_income}
            placeholder="0.00"
          />
        </div>

        <label className="flex items-center space-x-3 cursor-pointer mt-4 p-3 border border-gray-800 rounded-lg hover:bg-gray-800/50 transition-colors">
          <input
            type="checkbox"
            checked={isActiveCycle}
            onChange={(e) => setIsActiveCycle(e.target.checked)}
            className="w-5 h-5 rounded border-gray-600 text-brand-orange focus:ring-brand-orange bg-gray-700"
          />
          <span className="text-gray-300 font-medium">Set as Active Cycle</span>
        </label>

        <div className="pt-4 flex justify-end space-x-3 border-t border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="bg-brand-orange hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            {isPending ? <Loader2 size={18} className="animate-spin" /> : 'Save Cycle'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
