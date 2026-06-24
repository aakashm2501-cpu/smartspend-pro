 { toast } from 'sonner';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import { useForm } from '../../../hooks/useForm';
import { useRecordPayment } from '../../../hooks/useDebts';
import type { Debt } from '../../../types/database';
import { Loader2 } from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: Debt | null;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, onClose, debt }) => {
  const recordPayment = useRecordPayment();

  const { values, errors, handleChange, validate, reset } = useForm({
    amount: debt?.installment_amount.toString() || '',
  }, {
    amount: { required: true, isNumeric: true, min: 1 },
  });

  React.useEffect(() => {
    if (isOpen && debt) {
      handleChange('amount', debt.installment_amount.toString());
    } else {
      reset();
    }
  }, [isOpen, debt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !debt) return;

    const amt = Number(values.amount);
    if (amt > debt.outstanding_balance) {
      toast.error();
      return;
    }

    try {
      await recordPayment.mutateAsync({ debt, amount: amt });
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error();
    }
  };

  if (!debt) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-800/50 p-4 rounded-lg mb-4">
          <p className="text-sm text-gray-400">Recording payment for:</p>
          <p className="font-semibold text-lg text-white">{debt.person_name}</p>
          <p className="text-sm text-gray-400 mt-1">Outstanding Balance: ₹{debt.outstanding_balance}</p>
        </div>

        <Input 
          label="Payment Amount (₹)"
          type="number"
          step="0.01"
          value={values.amount}
          onChange={e => handleChange('amount', e.target.value)}
          error={errors.amount}
          placeholder="0.00"
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
            disabled={recordPayment.isPending}
            className="bg-brand-orange hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            {recordPayment.isPending ? <Loader2 size={18} className="animate-spin" /> : 'Record Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
