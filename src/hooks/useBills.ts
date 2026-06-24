import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import { useAuth } from './useAuth';
import type { Bill } from '../types/database';

export const useBills = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bills', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_archived', false)
        .order('due_day', { ascending: true });

      if (error) throw error;
      return data as Bill[];
    },
  });
};

export const useCreateBill = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newBill: Omit<Bill, 'id' | 'user_id' | 'created_at'>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('bills')
        .insert([{ ...newBill, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills', user?.id] });
    },
  });
};

export const useUpdateBill = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Bill> & { id: string }) => {
      const { data, error } = await supabase
        .from('bills')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills', user?.id] });
    },
  });
};

export const useDeleteBill = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: txns } = await supabase
        .from('transactions')
        .select('id')
        .eq('bill_id', id)
        .limit(1);

      if (txns && txns.length > 0) {
        // Soft delete if it has historical transactions
        const { error } = await supabase
          .from('bills')
          .update({ is_archived: true })
          .eq('id', id);
        if (error) throw error;
      } else {
        // Hard delete if it has never been used
        const { error } = await supabase
          .from('bills')
          .delete()
          .eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills', user?.id] });
    },
  });
};
