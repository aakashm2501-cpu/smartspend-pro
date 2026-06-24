import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import type { Debt, Transaction } from '../types/database';
import { useAuth } from './useAuth';
import { useActiveCycle } from './useCycles';

export const useDebts = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['debts', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Debt[];
    },
  });
};

export const useCreateDebt = () => {
  const { user } = useAuth();
  const { data: activeCycle } = useActiveCycle();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newDebt: Omit<Debt, 'id' | 'user_id'>) => {
      if (!user?.id) throw new Error('Not authenticated');
      if (!activeCycle) throw new Error('No active cycle found. Please create one before adding debts.');

      // 1. Insert Debt
      const { data: debt, error: debtError } = await supabase
        .from('debts')
        .insert([{ ...newDebt, user_id: user.id }])
        .select()
        .single();

      if (debtError) throw debtError;

      // 2. Insert Linking Transaction (Debt Origination)
      // Owe Money -> I received cash -> Income
      // Owed Money -> I lent cash -> Expense
      const isIncome = newDebt.debt_type === 'owe_money';
      
      const txn: Omit<Transaction, 'id' | 'user_id'> = {
        cycle_id: activeCycle.id,
        amount: newDebt.original_amount,
        type: isIncome ? 'income' : 'expense',
        category: 'Debt Origination',
        is_need: true,
        transaction_date: new Date().toISOString().split('T')[0],
        notes: `Original principal for debt with ${newDebt.person_name}`,
        source_type: 'Debt',
        debt_id: debt.id,
      };

      const { error: txnError } = await supabase
        .from('transactions')
        .insert([{ ...txn, user_id: user.id }]);

      if (txnError) {
        // Rollback debt if txn fails
        await supabase.from('debts').delete().eq('id', debt.id);
        throw txnError;
      }

      return debt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

export const useUpdateDebt = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Debt> & { id: string }) => {
      const { data, error } = await supabase
        .from('debts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
  });
};

export const useRecordPayment = () => {
  const { user } = useAuth();
  const { data: activeCycle } = useActiveCycle();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ debt, amount }: { debt: Debt, amount: number }) => {
      if (!user?.id) throw new Error('Not authenticated');
      if (!activeCycle) throw new Error('No active cycle found.');
      if (amount <= 0) throw new Error('Amount must be positive.');
      
      // Calculate new balance
      const newBalance = Math.max(debt.outstanding_balance - amount, 0);
      const newStatus = newBalance === 0 ? 'completed' : debt.status;

      // Update Debt
      const { error: debtError } = await supabase
        .from('debts')
        .update({ outstanding_balance: newBalance, status: newStatus })
        .eq('id', debt.id);

      if (debtError) throw debtError;

      // Insert linking transaction
      // Owe Money Repayment -> I pay cash -> Expense
      // Owed Money Received -> I get cash -> Income
      const isExpense = debt.debt_type === 'owe_money';

      const txn: Omit<Transaction, 'id' | 'user_id'> = {
        cycle_id: activeCycle.id,
        amount: amount,
        type: isExpense ? 'expense' : 'income',
        category: 'Debt Repayment',
        is_need: true,
        transaction_date: new Date().toISOString().split('T')[0],
        notes: `Repayment for debt with ${debt.person_name}`,
        source_type: 'Repayment',
        debt_id: debt.id,
      };

      const { error: txnError } = await supabase
        .from('transactions')
        .insert([{ ...txn, user_id: user.id }]);

      if (txnError) throw txnError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

export const useDeleteDebt = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Debt History Protection
      const { count, error: countError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('debt_id', id);

      if (countError) throw countError;

      if (count && count > 0) {
        // Soft delete if it has historical transactions
        const { error } = await supabase
          .from('debts')
          .update({ is_archived: true })
          .eq('id', id);
        if (error) throw error;
      } else {
        // Hard delete if it has never been used
        const { error } = await supabase
          .from('debts')
          .delete()
          .eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
  });
};
