import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useInvestorProfile } from './useInvestorData';

export function useInvestorRealtimeSubscriptions() {
  const queryClient = useQueryClient();
  const { data: profile } = useInvestorProfile();

  useEffect(() => {
    if (!profile?.id) return;

    // Subscribe to investor profile changes
    const profileChannel = supabase
      .channel('investor-profile')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'investors',
          filter: `id=eq.${profile.id}`,
        },
        () => {
          // Invalidate profile and stats queries
          queryClient.invalidateQueries({ queryKey: ['investor', 'profile'] });
          queryClient.invalidateQueries({ queryKey: ['investor', 'stats'] });
        }
      )
      .subscribe();

    // Subscribe to documents changes
    const documentsChannel = supabase
      .channel('investor-documents')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `investor_id=eq.${profile.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['investor', 'documents'] });
        }
      )
      .subscribe();

    // Subscribe to capital call items changes
    const capitalCallsChannel = supabase
      .channel('investor-capital-calls')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'capital_call_items',
          filter: `investor_id=eq.${profile.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['investor', 'capitalCalls'] });
          queryClient.invalidateQueries({ queryKey: ['investor', 'stats'] });
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(documentsChannel);
      supabase.removeChannel(capitalCallsChannel);
    };
  }, [profile?.id, queryClient]);
}


