import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import type { Transaction } from '../types/database';
import { useAuth } from './useAuth';

async function syncDebtBalance(debtId: string, amountChange: number) {
  if (!debtId || amountChange === 0) return;
  const { data: debt, error: fetchError } = await supabase
    .from('debts')
    .select('outstanding_balance, status')
    .eq('id', debtId)
    .single();
    
  if (fetchError || !debt) return;
  
  const newBalance = Math.max(0, Number(debt.outstanding_balance) + amountChange);
  const newStatus = newBalance === 0 ? 'completed' : debt.status === 'completed' ? 'active' : debt.status;
  
  await supabase
    .from('debts')
    .update({ outstanding_balance: newBalance, status: newStatus })
    .eq('id', debtId);
}

async function syncGoalAmount(goalId: string, amountChange: number) {
  if (!goalId || amountChange === 0) return;
  const { data: goal, error: fetchError } = await supabase
    .from('goals')
    .select('current_amount')
    .eq('id', goalId)
    .single();
    
  if (fetchError || !goal) return;
  
  const newBalance = Math.max(0, Number(goal.current_amount) + amountChange);
  
  await supabase
    .from('goals')
    .update({ current_amount: newBalance })
    .eq('id', goalId);
}

export const useTransactions = (cycleId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['transactions', cycleId],
    enabled: !!user?.id && !!cycleId,
    queryFn: async () => {
      if (!cycleId) return [] as Transaction[];

      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user!.id)
        // Ensure we fetch active and potentially reversed if needed by the UI, but usually engines filter out REVERSED
        .order('transaction_date', { ascending: false })
        .order('id', { ascending: false });

      if (cycleId) {
        query = query.eq('cycle_id', cycleId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Transaction[];
    },
  });
};

export const useCreateTransaction = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newTxn: Omit<Transaction, 'id' | 'user_id'>) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('transactions')
        .insert([{ ...newTxn, user_id: user.id, status: 'ACTIVE' }])
        .select()
        .single();

      if (error) throw error;

      // Sync Debt if linked
      if (newTxn.debt_id && newTxn.source_type !== 'Debt') {
        // Expense repayment -> reduce debt balance
        // Income received (loan payback) -> reduce debt balance
        await syncDebtBalance(newTxn.debt_id, -Number(newTxn.amount));
      }

      // Sync Goal if linked
      if (newTxn.goal_id) {
        // Expense goal contribution -> increase goal balance
        // Income goal reversal -> decrease goal balance
        const change = newTxn.type === 'expense' ? Number(newTxn.amount) : -Number(newTxn.amount);
        await syncGoalAmount(newTxn.goal_id, change);
      }

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      if (variables.debt_id || data?.debt_id) queryClient.invalidateQueries({ queryKey: ['debts'] });
      if (variables.goal_id || data?.goal_id) queryClient.invalidateQueries({ queryKey: ['goals'] });
      if (variables.bill_id || data?.bill_id) queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Transaction> & { id: string }) => {
      const { data: oldTxn, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();
        
      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Sync Debt
      const oldDebtId = oldTxn.debt_id;
      const newDebtId = data.debt_id;
      const oldAmount = Number(oldTxn.amount);
      const newAmount = Number(data.amount);
      const source = data.source_type;

      if (source !== 'Debt') {
        if (oldDebtId && newDebtId && oldDebtId === newDebtId) {
          // Both are repayments (since source !== 'Debt'), calculate net diff for debt balance
          await syncDebtBalance(oldDebtId, oldAmount - newAmount);
        } else {
          if (oldDebtId) await syncDebtBalance(oldDebtId, oldAmount); 
          if (newDebtId) await syncDebtBalance(newDebtId, -newAmount); 
        }
      }

      // Sync Goal
      const oldGoalId = oldTxn.goal_id;
      const newGoalId = data.goal_id;
      // Goal logic: expense = +amount to goal, income = -amount to goal
      const getGoalChange = (t: Transaction) => t.type === 'expense' ? Number(t.amount) : -Number(t.amount);
      const oldGoalChange = getGoalChange(oldTxn);
      const newGoalChange = getGoalChange(data);

      if (oldGoalId && newGoalId && oldGoalId === newGoalId) {
        await syncGoalAmount(oldGoalId, newGoalChange - oldGoalChange);
      } else {
        if (oldGoalId) await syncGoalAmount(oldGoalId, -oldGoalChange); // revert old
        if (newGoalId) await syncGoalAmount(newGoalId, newGoalChange); // apply new
      }

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      if (variables.debt_id || data?.debt_id) queryClient.invalidateQueries({ queryKey: ['debts'] });
      if (variables.goal_id || data?.goal_id) queryClient.invalidateQueries({ queryKey: ['goals'] });
      if (variables.bill_id || data?.bill_id) queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: oldTxn, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();
        
      if (fetchError) throw fetchError;

      // SOFT DELETE (ARCHIVED / REVERSED)
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'REVERSED' })
        .eq('id', id);

      if (error) throw error;

      if (oldTxn.debt_id && oldTxn.source_type !== 'Debt') {
        await syncDebtBalance(oldTxn.debt_id, Number(oldTxn.amount));
      }

      if (oldTxn.goal_id) {
        const change = oldTxn.type === 'expense' ? Number(oldTxn.amount) : -Number(oldTxn.amount);
        await syncGoalAmount(oldTxn.goal_id, -change);
      }
      return oldTxn;
    },
    onSuccess: (oldTxn) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      if (oldTxn?.debt_id) queryClient.invalidateQueries({ queryKey: ['debts'] });
      if (oldTxn?.goal_id) queryClient.invalidateQueries({ queryKey: ['goals'] });
      if (oldTxn?.bill_id) queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });
};
