import { supabase, handleSupabaseError } from '@/lib/supabase';
import { Request } from '@/types';

export interface CreateRequestData {
  userId: string;
  type: Request['type'];
  title: string;
  description: string;
  startDate?: string;
  endDate?: string;
  amount?: number;
  attachments?: string[];
}

export const requestsService = {
  // Create new request
  async createRequest(data: CreateRequestData): Promise<{ request: Request | null; error: string | null }> {
    try {
      const { data: request, error } = await supabase
        .from('requests')
        .insert({
          user_id: data.userId,
          type: data.type,
          title: data.title,
          description: data.description,
          start_date: data.startDate,
          end_date: data.endDate,
          amount: data.amount,
          attachments: data.attachments ? JSON.stringify(data.attachments) : null,
        })
        .select()
        .single();

      if (error) {
        return { request: null, error: handleSupabaseError(error) };
      }

      return {
        request: this.mapRequestRecord(request),
        error: null,
      };
    } catch (error) {
      return { request: null, error: handleSupabaseError(error) };
    }
  },

  // Get user requests
  async getUserRequests(userId: string): Promise<{ requests: Request[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { requests: [], error: handleSupabaseError(error) };
      }

      const requests = data.map((request: any) => this.mapRequestRecord(request));
      return { requests, error: null };
    } catch (error) {
      return { requests: [], error: handleSupabaseError(error) };
    }
  },

  // Update request status (for managers/HR)
  async updateRequestStatus(
    requestId: string,
    status: Request['status'],
    reviewNotes?: string,
    reviewedBy?: string
  ): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('requests')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewedBy,
          review_notes: reviewNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      return { error: error ? handleSupabaseError(error) : null };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  },

  // Get pending requests (for managers/HR)
  async getPendingRequests(): Promise<{ requests: Request[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          profiles!requests_user_id_fkey (name, employee_id, department)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        return { requests: [], error: handleSupabaseError(error) };
      }

      const requests = data.map((request: any) => this.mapRequestRecord(request));
      return { requests, error: null };
    } catch (error) {
      return { requests: [], error: handleSupabaseError(error) };
    }
  },

  // Helper function to map database record to Request
  mapRequestRecord(data: any): Request {
    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      title: data.title,
      description: data.description,
      startDate: data.start_date,
      endDate: data.end_date,
      amount: data.amount,
      attachments: data.attachments ? JSON.parse(data.attachments) : [],
      status: data.status,
      submittedAt: new Date(data.submitted_at),
      reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : undefined,
      reviewedBy: data.reviewed_by,
      reviewNotes: data.review_notes,
    };
  },
};