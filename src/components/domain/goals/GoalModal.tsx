import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { useForm } from '../../../hooks/useForm';
import { useCreateGoal, useUpdateGoal } from '../../../hooks/useGoals';
import type { Goal } from '../../../types/database';
import { Loader2 } from 'lucide-react';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalToEdit?: Goal | null;
}

export const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose, goalToEdit }) => {
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const isPending = createGoal.isPending || updateGoal.isPending;

  const { values, errors, handleChange, validate, reset, setValues } = useForm({
    name: '',
    type: 'Custom',
    target_amount: '',
    current_amount: '',
    target_date: '',
  }, {
    name: { required: true },
    type: { required: true },
    target_amount: { required: true, isNumeric: true, min: 1 },
    current_amount: { isNumeric: true, min: 0 },
    target_date: { required: true }
  });

  useEffect(() => {
    if (isOpen) {
      if (goalToEdit) {
        setValues({
          name: goalToEdit.name,
          type: goalToEdit.type,
          target_amount: goalToEdit.target_amount.toString(),
          current_amount: goalToEdit.current_amount.toString(),
          target_date: goalToEdit.target_date,
        });
      } else {
        reset();
      }
    }
  }, [isOpen, goalToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const payload = {
        name: values.name,
        type: values.type as Goal['type'],
        target_amount: Number(values.target_amount),
        current_amount: Number(values.current_amount) || 0,
        target_date: values.target_date,
      };

      if (goalToEdit) {
        await updateGoal.mutateAsync({ id: goalToEdit.id, ...payload });
      } else {
        await createGoal.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('An error occurred.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={goalToEdit ? 'Edit Goal' : 'Add Savings Goal'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input 
          label="Goal Name"
          value={values.name}
          onChange={e => handleChange('name', e.target.value)}
          error={errors.name}
          placeholder="e.g. New Car Fund"
        />

        <Select 
          label="Goal Type"
          value={values.type}
          onChange={e => handleChange('type', e.target.value)}
          error={errors.type}
          options={[
            { value: 'Emergency Fund', label: 'Emergency Fund' },
            { value: 'Vacation', label: 'Vacation' },
            { value: 'Vehicle', label: 'Vehicle' },
            { value: 'Home', label: 'Home' },
            { value: 'Investment', label: 'Investment' },
            { value: 'Custom', label: 'Custom' },
          ]}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Target Amount (₹)"
            type="number"
            step="0.01"
            value={values.target_amount}
            onChange={e => handleChange('target_amount', e.target.value)}
            error={errors.target_amount}
            placeholder="0.00"
          />
          <Input 
            label="Current Amount (₹)"
            type="number"
            step="0.01"
            value={values.current_amount}
            onChange={e => handleChange('current_amount', e.target.value)}
            error={errors.current_amount}
            placeholder="0.00"
          />
        </div>

        <Input 
          label="Target Date"
          type="date"
          value={values.target_date}
          onChange={e => handleChange('target_date', e.target.value)}
          error={errors.target_date}
        />

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
            {isPending ? <Loader2 size={18} className="animate-spin" /> : 'Save Goal'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
