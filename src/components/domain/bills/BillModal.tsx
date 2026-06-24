import React, { useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { useForm } from '../../../hooks/useForm';
import { useCreateBill, useUpdateBill } from '../../../hooks/useBills';
import type { Bill } from '../../../types/database';
import { Loader2 } from 'lucide-react';

interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
  billToEdit?: Bill | null;
}

export const BillModal: React.FC<BillModalProps> = ({ isOpen, onClose, billToEdit }) => {
  const createBill = useCreateBill();
  const updateBill = useUpdateBill();
  const isPending = createBill.isPending || updateBill.isPending;

  const { values, errors, handleChange, validate, reset, setValues } = useForm({
    name: '',
    amount: '',
    due_day: '',
    category: '',
    frequency: 'monthly',
    is_auto_pay: false,
  }, {
    name: { required: true },
    amount: { required: true, isNumeric: true, min: 0 },
    due_day: { required: true, isNumeric: true, min: 1, max: 31 },
    category: { required: true },
    frequency: { required: true }
  });

  useEffect(() => {
    if (isOpen) {
      if (billToEdit) {
        setValues({
          name: billToEdit.name,
          amount: billToEdit.amount.toString(),
          due_day: billToEdit.due_day.toString(),
          category: billToEdit.category,
          frequency: billToEdit.frequency,
          is_auto_pay: billToEdit.is_auto_pay,
        });
      } else {
        reset();
      }
    }
  }, [isOpen, billToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const payload = {
        name: values.name,
        amount: Number(values.amount),
        due_day: Number(values.due_day),
        category: values.category,
        frequency: values.frequency as 'monthly' | 'quarterly' | 'yearly',
        is_auto_pay: values.is_auto_pay,
      };

      if (billToEdit) {
        await updateBill.mutateAsync({ id: billToEdit.id, ...payload });
      } else {
        await createBill.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save bill. See console for details.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={billToEdit ? 'Edit Bill' : 'Add New Bill'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input 
          label="Bill Name"
          value={values.name}
          onChange={e => handleChange('name', e.target.value)}
          error={errors.name}
          placeholder="e.g. Electricity, Rent"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Amount (₹)"
            type="number"
            step="0.01"
            value={values.amount}
            onChange={e => handleChange('amount', e.target.value)}
            error={errors.amount}
            placeholder="0.00"
          />
          <Input 
            label="Due Day (1-31)"
            type="number"
            value={values.due_day}
            onChange={e => handleChange('due_day', e.target.value)}
            error={errors.due_day}
            placeholder="15"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Category"
            value={values.category}
            onChange={e => handleChange('category', e.target.value)}
            error={errors.category}
            placeholder="e.g. Utilities"
          />
          <Select 
            label="Frequency"
            value={values.frequency}
            onChange={e => handleChange('frequency', e.target.value)}
            error={errors.frequency}
            options={[
              { value: 'monthly', label: 'Monthly' },
              { value: 'quarterly', label: 'Quarterly' },
              { value: 'yearly', label: 'Yearly' }
            ]}
          />
        </div>

        <div className="flex items-center space-x-3 mt-4 mb-6 px-1">
          <input
            type="checkbox"
            id="is_auto_pay"
            checked={values.is_auto_pay}
            onChange={e => handleChange('is_auto_pay', e.target.checked)}
            className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-brand-orange focus:ring-brand-orange focus:ring-offset-gray-900"
          />
          <label htmlFor="is_auto_pay" className="text-sm text-gray-300">
            This bill is paid automatically (Auto-Pay)
          </label>
        </div>

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
            {isPending ? <Loader2 size={18} className="animate-spin" /> : 'Save Bill'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
