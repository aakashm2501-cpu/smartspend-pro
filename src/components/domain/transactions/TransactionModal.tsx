import React, { useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { useForm } from '../../../hooks/useForm';
import { useCreateTransaction, useUpdateTransaction } from '../../../hooks/useTransactions';
import { useBills } from '../../../hooks/useBills';
import { useGoals } from '../../../hooks/useGoals';
import { useDebts } from '../../../hooks/useDebts';
import type { Transaction, Cycle } from '../../../types/database';
import { Loader2 } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
  activeCycle: Cycle;
}

const INCOME_CATEGORIES = [
  'Salary', 'Incentive', 'Commission', 'Bonus', 'Freelance', 'Interest', 'Refund', 'Other'
];

const EXPENSE_CATEGORIES = [
  'Rent', 'EMI', 'Utilities', 'Groceries', 'Food', 'Transport', 'Fuel', 
  'Healthcare', 'Insurance', 'Shopping', 'Entertainment', 'Travel', 'Education', 'Investments', 'Other'
];

export const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, transactionToEdit, activeCycle }) => {
  const createTxn = useCreateTransaction();
  const updateTxn = useUpdateTransaction();
  const isPending = createTxn.isPending || updateTxn.isPending;

  const { data: bills } = useBills();
  const { data: goals } = useGoals();
  const { data: debts } = useDebts();

  const { values, errors, handleChange, validate, reset, setValues } = useForm({
    type: 'expense',
    amount: '',
    category: '',
    transaction_date: new Date().toISOString().split('T')[0],
    is_need: 'true',
    notes: '',
    linked_bill: '',
    linked_goal: '',
    linked_debt: '',
  }, {
    type: { required: true },
    amount: { required: true, isNumeric: true, min: 1 },
    category: { required: true },
    transaction_date: { required: true }
  });

  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        setValues({
          type: transactionToEdit.type,
          amount: transactionToEdit.amount.toString(),
          category: transactionToEdit.category,
          transaction_date: transactionToEdit.transaction_date,
          is_need: transactionToEdit.is_need ? 'true' : 'false',
          notes: transactionToEdit.notes || '',
          linked_bill: transactionToEdit.bill_id || '',
          linked_goal: transactionToEdit.goal_id || '',
          linked_debt: transactionToEdit.debt_id || '',
        });
      } else {
        reset();
      }
    }
  }, [isOpen, transactionToEdit]);

  // Handle category reset when type changes
  const handleTypeChange = (newType: string) => {
    handleChange('type', newType);
    handleChange('category', ''); // Reset category when switching
  };

  const currentCategoryOptions = values.type === 'income' 
    ? INCOME_CATEGORIES.map(c => ({ value: c, label: c }))
    : values.type === 'transfer'
    ? [{ value: 'Transfer', label: 'Transfer' }]
    : EXPENSE_CATEGORIES.map(c => ({ value: c, label: c }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const payload = {
        type: values.type as Transaction['type'],
        amount: Number(values.amount),
        category: values.category,
        transaction_date: values.transaction_date,
        is_need: values.is_need === 'true',
        notes: values.notes || null,
        cycle_id: activeCycle.id,
        source_type: 'Manual', // Defaulting per requirements
        bill_id: values.linked_bill || null,
        goal_id: values.linked_goal || null,
        debt_id: values.linked_debt || null,
      };

      if (transactionToEdit) {
        await updateTxn.mutateAsync({ id: transactionToEdit.id, ...payload });
      } else {
        await createTxn.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save transaction. See console for details.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transactionToEdit ? 'Edit Transaction' : 'Log Transaction'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select 
          label="Transaction Type"
          value={values.type}
          onChange={e => handleTypeChange(e.target.value)}
          error={errors.type}
          options={[
            { value: 'expense', label: 'Expense' },
            { value: 'income', label: 'Income' },
            { value: 'transfer', label: 'Transfer' },
          ]}
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
            label="Date"
            type="date"
            value={values.transaction_date}
            onChange={e => handleChange('transaction_date', e.target.value)}
            error={errors.transaction_date}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select 
            label="Category"
            value={values.category}
            onChange={e => handleChange('category', e.target.value)}
            error={errors.category}
            options={[{ value: '', label: 'Select category...' }, ...currentCategoryOptions]}
          />
          
          {values.type === 'expense' && (
            <Select 
              label="Classification"
              value={values.is_need}
              onChange={e => handleChange('is_need', e.target.value)}
              options={[
                { value: 'true', label: 'Need (Essential)' },
                { value: 'false', label: 'Want (Discretionary)' },
              ]}
            />
          )}
        </div>

        <Input 
          label="Notes (Optional)"
          value={values.notes}
          onChange={e => handleChange('notes', e.target.value)}
          placeholder="e.g. Amazon shopping, Groceries at BigBazaar"
        />

        <div className="pt-4 border-t border-gray-800 space-y-4">
          <p className="text-sm font-semibold text-gray-300">Link to Obligation (Optional)</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select 
              label="Link to Bill"
              value={values.linked_bill}
              onChange={e => {
                handleChange('linked_bill', e.target.value);
                if (e.target.value) {
                  handleChange('linked_goal', '');
                  handleChange('linked_debt', '');
                  handleChange('type', 'expense');
                }
              }}
              options={[{ value: '', label: 'None' }, ...(bills || []).map(b => ({ value: b.id, label: b.name }))]}
              disabled={!!values.linked_goal || !!values.linked_debt}
            />
            <Select 
              label="Link to Goal"
              value={values.linked_goal}
              onChange={e => {
                handleChange('linked_goal', e.target.value);
                if (e.target.value) {
                  handleChange('linked_bill', '');
                  handleChange('linked_debt', '');
                  handleChange('type', 'expense'); // transfer/expense
                }
              }}
              options={[{ value: '', label: 'None' }, ...(goals || []).map(g => ({ value: g.id, label: g.name }))]}
              disabled={!!values.linked_bill || !!values.linked_debt}
            />
            <Select 
              label="Link to Debt"
              value={values.linked_debt}
              onChange={e => {
                handleChange('linked_debt', e.target.value);
                if (e.target.value) {
                  handleChange('linked_bill', '');
                  handleChange('linked_goal', '');
                }
              }}
              options={[{ value: '', label: 'None' }, ...(debts || []).map(d => ({ value: d.id, label: d.person_name }))]}
              disabled={!!values.linked_bill || !!values.linked_goal}
            />
          </div>
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
            {isPending ? <Loader2 size={18} className="animate-spin" /> : 'Save Transaction'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
