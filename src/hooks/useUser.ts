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
      let { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user!.id)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') {
          // No user record found, try to create one
          const { data: newData, error: insertError } = await supabase
            .from('users')
            .insert([{ id: user!.id, email: user!.email }])
            .select('*')
            .single();
            
          if (insertError) throw insertError;
          return newData as DBUser;
        }
        throw error;
      }
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
