import { toast } from 'sonner';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { useForm } from '../../../hooks/useForm';
import { useCreateDebt, useUpdateDebt } from '../../../hooks/useDebts';
import type { Debt, DebtType, DebtRepaymentFrequency, DebtStatus } from '../../../types/database';
import { Loader2 } from 'lucide-react';

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debtToEdit?: Debt | null;
}

export const DebtModal: React.FC<DebtModalProps> = ({ isOpen, onClose, debtToEdit }) => {
  const createDebt = useCreateDebt();
  const updateDebt = useUpdateDebt();
  const isPending = createDebt.isPending || updateDebt.isPending;

  const { values, errors, handleChange, validate, reset, setValues } = useForm({
    person_name: '',
    debt_type: 'owe_money',
    original_amount: '',
    outstanding_balance: '',
    installment_amount: '',
    due_date: '',
    repayment_frequency: 'monthly',
    notes: '',
    status: 'active',
  }, {
    person_name: { required: true },
    debt_type: { required: true },
    original_amount: { required: true, isNumeric: true, min: 1 },
    outstanding_balance: { required: true, isNumeric: true, min: 0 },
    installment_amount: { required: true, isNumeric: true, min: 0 },
    repayment_frequency: { required: true },
    status: { required: true }
  });

  useEffect(() => {
    if (isOpen) {
      if (debtToEdit) {
        setValues({
          person_name: debtToEdit.person_name,
          debt_type: debtToEdit.debt_type,
          original_amount: debtToEdit.original_amount.toString(),
          outstanding_balance: debtToEdit.outstanding_balance.toString(),
          installment_amount: debtToEdit.installment_amount.toString(),
          due_date: debtToEdit.due_date || '',
          repayment_frequency: debtToEdit.repayment_frequency,
          notes: debtToEdit.notes || '',
          status: debtToEdit.status,
        });
      } else {
        reset();
      }
    }
  }, [isOpen, debtToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const payload = {
        person_name: values.person_name,
        debt_type: values.debt_type as DebtType,
        original_amount: Number(values.original_amount),
        outstanding_balance: Number(values.outstanding_balance),
        installment_amount: Number(values.installment_amount),
        due_date: values.due_date || null,
        repayment_frequency: values.repayment_frequency as DebtRepaymentFrequency,
        notes: values.notes || null,
        status: values.status as DebtStatus,
      };

      if (debtToEdit) {
        await updateDebt.mutateAsync({ id: debtToEdit.id, ...payload });
      } else {
        await createDebt.mutateAsync(payload);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={debtToEdit ? 'Edit Debt' : 'Add New Debt'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!debtToEdit && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-2">
            <p className="text-xs text-blue-400">
              <strong>Note:</strong> Creating a debt automatically generates a linked Transaction to adjust your Available Cash properly.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Person/Entity Name"
            value={values.person_name}
            onChange={e => handleChange('person_name', e.target.value)}
            error={errors.person_name}
          />
          <Select 
            label="Debt Type"
            value={values.debt_type}
            onChange={e => handleChange('debt_type', e.target.value)}
            error={errors.debt_type}
            options={[
              { value: 'owe_money', label: 'I Owe Money' },
              { value: 'owed_money', label: 'Money Owed To Me' },
            ]}
            disabled={!!debtToEdit} // Do not let user change type after creation because of the original transaction
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Original Amount (₹)"
            type="number"
            step="0.01"
            value={values.original_amount}
            onChange={e => handleChange('original_amount', e.target.value)}
            error={errors.original_amount}
            disabled={!!debtToEdit} // Keep original locked
          />
          <Input 
            label="Outstanding Balance (₹)"
            type="number"
            step="0.01"
            value={values.outstanding_balance}
            onChange={e => handleChange('outstanding_balance', e.target.value)}
            error={errors.outstanding_balance}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select 
            label="Repayment Frequency"
            value={values.repayment_frequency}
            onChange={e => handleChange('repayment_frequency', e.target.value)}
            error={errors.repayment_frequency}
            options={[
              { value: 'one_time', label: 'One Time' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
            ]}
          />
          <Input 
            label="Repayment Installment (₹)"
            type="number"
            step="0.01"
            value={values.installment_amount}
            onChange={e => handleChange('installment_amount', e.target.value)}
            error={errors.installment_amount}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Due Date"
            type="date"
            value={values.due_date}
            onChange={e => handleChange('due_date', e.target.value)}
            error={errors.due_date}
          />
          {debtToEdit && (
            <Select 
              label="Status"
              value={values.status}
              onChange={e => handleChange('status', e.target.value)}
              error={errors.status}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'completed', label: 'Completed' },
                { value: 'overdue', label: 'Overdue' },
              ]}
            />
          )}
        </div>

        <Input 
          label="Notes (Optional)"
          value={values.notes}
          onChange={e => handleChange('notes', e.target.value)}
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
            {isPending ? <Loader2 size={18} className="animate-spin" /> : 'Save Debt'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
