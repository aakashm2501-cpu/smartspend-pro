import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import { useAuth } from './useAuth';
import type { Goal } from '../types/database';

export const useGoals = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['goals', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_archived', false)
        .order('target_date', { ascending: true });

      if (error) throw error;
      return data as Goal[];
    },
  });
};

export const useCreateGoal = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newGoal: Omit<Goal, 'id' | 'user_id' | 'created_at'>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('goals')
        .insert([{ ...newGoal, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] });
    },
  });
};

export const useUpdateGoal = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Goal> & { id: string }) => {
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] });
    },
  });
};

export const useDeleteGoal = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: txns } = await supabase
        .from('transactions')
        .select('id')
        .eq('goal_id', id)
        .limit(1);

      if (txns && txns.length > 0) {
        // Soft delete if it has historical transactions
        const { error } = await supabase
          .from('goals')
          .update({ is_archived: true })
          .eq('id', id);
        if (error) throw error;
      } else {
        // Hard delete if it has never been used
        const { error } = await supabase
          .from('goals')
          .delete()
          .eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] });
    },
  });
};
