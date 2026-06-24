import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import { useAuth } from './useAuth';
import type { User as DBUser } from '../types/database';

export const useUserRecord = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-record', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user!.id)
        .single();
        
      if (error) throw error;
      return data as DBUser;
    },
  });
};

export const useUpdateUserRecord = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates: Partial<DBUser>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
        
      if (error) throw error;
      return data as DBUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-record', user?.id] });
    },
  });
};
