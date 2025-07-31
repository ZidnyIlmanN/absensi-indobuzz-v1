import { useState, useEffect, useCallback } from 'react';
import { requestsService } from '@/services/requests';
import { Request } from '@/types';

interface RequestsState {
  requests: Request[];
  isLoading: boolean;
  error: string | null;
}

export function useRequests(userId: string | null) {
  const [requestsState, setRequestsState] = useState<RequestsState>({
    requests: [],
    isLoading: true,
    error: null,
  });

  const loadRequests = useCallback(async () => {
    if (!userId) return;

    setRequestsState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { requests, error } = await requestsService.getUserRequests(userId);
      
      if (error) {
        setRequestsState(prev => ({ ...prev, error, isLoading: false }));
        return;
      }

      setRequestsState({
        requests,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setRequestsState(prev => ({
        ...prev,
        error: 'Failed to load requests',
        isLoading: false,
      }));
    }
  }, [userId]);

  const createRequest = async (
    type: Request['type'],
    title: string,
    description: string,
    options?: {
      startDate?: string;
      endDate?: string;
      amount?: number;
      attachments?: string[];
    }
  ) => {
    if (!userId) return { error: 'No user logged in' };

    setRequestsState(prev => ({ ...prev, isLoading: true, error: null }));

    const { request, error } = await requestsService.createRequest({
      userId,
      type,
      title,
      description,
      ...options,
    });

    if (error) {
      setRequestsState(prev => ({ ...prev, error, isLoading: false }));
      return { error };
    }

    if (request) {
      setRequestsState(prev => ({
        ...prev,
        requests: [request, ...prev.requests],
        isLoading: false,
      }));
    }

    return { error: null };
  };

  useEffect(() => {
    if (userId) {
      loadRequests();
    }
  }, [userId, loadRequests]);

  return {
    ...requestsState,
    createRequest,
    refreshRequests: loadRequests,
  };
}