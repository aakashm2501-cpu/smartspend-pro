import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import type { Cycle } from '../types/database';
import { useAuth } from './useAuth';

export const useActiveCycle = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['active-cycle', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cycles')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 is no rows returned
        throw error;
      }
      return (data as Cycle) || null;
    },
  });
};

export const useCycles = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['cycles', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cycles')
        .select('*')
        .eq('user_id', user!.id)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data as Cycle[];
    },
  });
};

export const useCreateCycle = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newCycle: Omit<Cycle, 'id' | 'user_id' | 'actual_income'>) => {
      if (!user?.id) throw new Error('Not authenticated');

      if (newCycle.is_active) {
        await supabase
          .from('cycles')
          .update({ is_active: false })
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase
        .from('cycles')
        .insert([{ ...newCycle, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['active-cycle', user?.id] });
    },
  });
};

export const useUpdateCycle = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Cycle> & { id: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      if (updates.is_active) {
        await supabase
          .from('cycles')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .neq('id', id);
      }

      const { data, error } = await supabase
        .from('cycles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['active-cycle', user?.id] });
    },
  });
};

export const useDeleteCycle = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Deletion Protection Check
      const { count, error: countError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('cycle_id', id);

      if (countError) throw countError;

      if (count && count > 0) {
        throw new Error('This cycle contains transactions and cannot be deleted until all associated transactions are removed.');
      }

      const { error } = await supabase
        .from('cycles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['active-cycle', user?.id] });
    },
  });
};
