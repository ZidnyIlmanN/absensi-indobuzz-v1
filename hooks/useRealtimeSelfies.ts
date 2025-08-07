import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { imageService } from '@/services/imageService';
import { useAppContext } from '@/context/AppContext';

interface SelfieItem {
  url: string;
  fileName: string;
  timestamp: Date;
  type: string;
}

interface RealtimeSelfiesState {
  selfies: SelfieItem[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

/**
 * Custom hook for real-time selfie management
 * Provides automatic updates when new selfies are uploaded
 */
export function useRealtimeSelfies() {
  const { user, currentAttendance, todayActivities } = useAppContext();
  const [state, setState] = useState<RealtimeSelfiesState>({
    selfies: [],
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  // Load initial selfies
  const loadSelfies = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('🔄 [useRealtimeSelfies] Loading selfies for user:', user.id);
      
      const { urls, error } = await imageService.getUserSelfies(user.id);
      
      if (error) {
        setState(prev => ({ ...prev, error, isLoading: false }));
        return;
      }

      // Parse selfie information from URLs
      const selfieItems: SelfieItem[] = urls.map(url => {
        const fileName = url.split('/').pop() || '';
        const parts = fileName.split('_');
        const type = parts[0] || 'general';
        const timestampStr = parts.slice(1).join('_').replace('.jpg', '');
        const timestamp = new Date(timestampStr.replace(/-/g, ':'));
        
        return {
          url,
          fileName,
          timestamp: isNaN(timestamp.getTime()) ? new Date() : timestamp,
          type,
        };
      });

      // Sort by timestamp (newest first)
      selfieItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setState({
        selfies: selfieItems,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      });

      console.log('📸 [useRealtimeSelfies] Loaded selfies:', selfieItems.length);
    } catch (error) {
      console.error('❌ [useRealtimeSelfies] Error loading selfies:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load selfies',
        isLoading: false,
      }));
    }
  }, [user]);

  // Add new selfie to state (called by real-time subscription)
  const addNewSelfie = useCallback((selfieUrl: string, type: string, timestamp?: Date) => {
    const fileName = selfieUrl.split('/').pop() || '';
    const newSelfie: SelfieItem = {
      url: selfieUrl,
      fileName,
      timestamp: timestamp || new Date(),
      type,
    };

    setState(prev => {
      // Check for duplicates
      const exists = prev.selfies.some(selfie => selfie.url === newSelfie.url);
      if (exists) {
        console.log('📸 [useRealtimeSelfies] Selfie already exists, skipping');
        return prev;
      }

      console.log('📸 [useRealtimeSelfies] Adding new selfie:', type);
      
      // Add to beginning and re-sort
      const updatedSelfies = [newSelfie, ...prev.selfies]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return {
        ...prev,
        selfies: updatedSelfies,
        lastUpdated: new Date(),
      };
    });
  }, []);

  // Remove selfie from state
  const removeSelfie = useCallback((selfieUrl: string) => {
    setState(prev => ({
      ...prev,
      selfies: prev.selfies.filter(selfie => selfie.url !== selfieUrl),
      lastUpdated: new Date(),
    }));
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    console.log('🔄 [useRealtimeSelfies] Setting up real-time subscription');

    // Subscribe to activity records for break selfies
    const activitySubscription = supabase
      .channel(`activity-selfies-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_records',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('📸 [useRealtimeSelfies] New activity detected:', payload.new);
          
          if (payload.new.selfie_url) {
            addNewSelfie(
              payload.new.selfie_url,
              payload.new.type,
              new Date(payload.new.timestamp)
            );
          }
        }
      )
      .subscribe();

    // Subscribe to attendance records for clock in/out selfies
    const attendanceSubscription = supabase
      .channel(`attendance-selfies-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('📸 [useRealtimeSelfies] Attendance update detected:', payload);
          
          if (payload.new?.selfie_url) {
            // Determine type based on whether it's insert or update
            const type = payload.eventType === 'INSERT' ? 'clock_in' : 'clock_out';
            const timestamp = payload.eventType === 'INSERT' 
              ? new Date(payload.new.clock_in)
              : new Date(payload.new.clock_out || payload.new.updated_at);
            
            addNewSelfie(payload.new.selfie_url, type, timestamp);
          }
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      console.log('🔄 [useRealtimeSelfies] Cleaning up subscriptions');
      supabase.removeChannel(activitySubscription);
      supabase.removeChannel(attendanceSubscription);
    };
  }, [user, addNewSelfie]);

  // Load selfies on mount and when user changes
  useEffect(() => {
    loadSelfies();
  }, [loadSelfies]);

  return {
    ...state,
    loadSelfies,
    addNewSelfie,
    removeSelfie,
    refreshSelfies: loadSelfies,
  };
}