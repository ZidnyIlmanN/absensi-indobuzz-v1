import { supabase, handleSupabaseError } from '@/lib/supabase';
import { uploadService } from './uploadService';

export interface SickLeaveRequest {
  id: string;
  userId: string;
  selectedDate: string;
  reason: string;
  attachments: string[];
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface CreateSickLeaveRequestData {
  userId: string;
  selectedDate: string;
  reason: string;
  attachmentUris?: string[];
}

export interface SickLeaveRequestFilters {
  status?: 'pending' | 'approved' | 'rejected';
  startDate?: string;
  endDate?: string;
}

export const sickLeaveService = {
  /**
   * Create a new sick leave request with file uploads
   */
  async createSickLeaveRequest(data: CreateSickLeaveRequestData): Promise<{ 
    request: SickLeaveRequest | null; 
    error: string | null 
  }> {
    try {
      console.log('Creating sick leave request:', {
        userId: data.userId,
        selectedDate: data.selectedDate,
        attachmentCount: data.attachmentUris?.length || 0,
        reason: data.reason.substring(0, 50) + '...'
      });

      // Validate input data
      if (!data.userId || !data.selectedDate) {
        return { 
          request: null, 
          error: 'Missing required fields: userId or selectedDate' 
        };
      }

      if (!data.reason || data.reason.trim().length < 10) {
        return { 
          request: null, 
          error: 'Reason must be at least 10 characters long' 
        };
      }

      // Validate date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const selectedDate = new Date(data.selectedDate);
      if (isNaN(selectedDate.getTime()) || selectedDate < today) {
        return { 
          request: null, 
          error: 'Invalid or past date selected' 
        };
      }

      // Upload attachments if provided
      let uploadedAttachments: string[] = [];
      if (data.attachmentUris && data.attachmentUris.length > 0) {
        console.log('Uploading attachments...');
        
        for (let i = 0; i < data.attachmentUris.length; i++) {
          const uri = data.attachmentUris[i];
          console.log(`Uploading attachment ${i + 1}/${data.attachmentUris.length}: ${uri}`);
          
          const uploadResult = await uploadService.uploadLeaveAttachment(data.userId, uri, {
            quality: 0.8,
            maxWidth: 1920,
            maxHeight: 1080,
            maxFileSize: 5, // 5MB max
          });
          
          if (uploadResult.error) {
            console.error(`Failed to upload attachment ${i + 1}:`, uploadResult.error);
            return { 
              request: null, 
              error: `Failed to upload attachment ${i + 1}: ${uploadResult.error}` 
            };
          }
          
          if (uploadResult.url) {
            uploadedAttachments.push(uploadResult.url);
            console.log(`Attachment ${i + 1} uploaded successfully: ${uploadResult.url}`);
          }
        }
      }

      // Create sick leave request record
      const { data: sickLeaveRequest, error } = await supabase
        .from('sick_leave_requests')
        .insert({ 
          user_id: data.userId,
          sick_date: data.selectedDate,
          reason: data.reason.trim(),
          attachments: uploadedAttachments,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        
        // Cleanup uploaded attachments on database error
        if (uploadedAttachments.length > 0) {
          console.log('Cleaning up uploaded attachments due to database error');
        }
        
        return { request: null, error: handleSupabaseError(error) };
      }

      console.log('Sick leave request created successfully:', sickLeaveRequest.id);

      return {
        request: this.mapSickLeaveRequestRecord(sickLeaveRequest),
        error: null,
      };
    } catch (error) {
      console.error('Sick leave request creation error:', error);
      return { 
        request: null, 
        error: error instanceof Error ? error.message : 'Failed to create sick leave request' 
      };
    }
  },

  /**
   * Get sick leave requests for a specific user
   */
  async getUserSickLeaveRequests(
    userId: string,
    filters?: SickLeaveRequestFilters
  ): Promise<{ requests: SickLeaveRequest[]; error: string | null }> {
    try {
      let query = supabase
        .from('sick_leave_requests')
        .select('*')
        .eq('user_id', userId);

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.startDate) {
        query = query.gte('sick_date', filters.startDate);
      }
      
      if (filters?.endDate) {
        query = query.lte('sick_date', filters.endDate);
      }

      const { data, error } = await query.order('submitted_at', { ascending: false });

      if (error) {
        return { requests: [], error: handleSupabaseError(error) };
      }

      const requests = data.map((record: any) => this.mapSickLeaveRequestRecord(record));
      return { requests, error: null };
    } catch (error) {
      console.error('Error fetching user sick leave requests:', error);
      return { 
        requests: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch sick leave requests' 
      };
    }
  },

  /**
   * Get sick leave request by ID
   */
  async getSickLeaveRequestById(requestId: string): Promise<{ 
    request: SickLeaveRequest | null; 
    error: string | null 
  }> {
    try {
      const { data, error } = await supabase
        .from('sick_leave_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) {
        return { request: null, error: handleSupabaseError(error) };
      }

      return {
        request: this.mapSickLeaveRequestRecord(data),
        error: null,
      };
    } catch (error) {
      return { 
        request: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch sick leave request' 
      };
    }
  },

  /**
   * Update sick leave request status (for managers/HR)
   */
  async updateSickLeaveRequestStatus(
    requestId: string,
    status: 'approved' | 'rejected',
    reviewNotes?: string,
    reviewedBy?: string
  ): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('sick_leave_requests')
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

  /**
   * Cancel sick leave request (only if pending)
   */
  async cancelSickLeaveRequest(requestId: string, userId: string): Promise<{ error: string | null }> {
    try {
      // First check if request exists and is pending
      const { data: existingRequest, error: fetchError } = await supabase
        .from('sick_leave_requests')
        .select('status, user_id')
        .eq('id', requestId)
        .single();

      if (fetchError) {
        return { error: handleSupabaseError(fetchError) };
      }

      if (existingRequest.user_id !== userId) {
        return { error: 'Unauthorized: You can only cancel your own requests' };
      }

      if (existingRequest.status !== 'pending') {
        return { error: 'Cannot cancel: Request has already been reviewed' };
      }

      // Update status to rejected with cancellation note
      const { error } = await supabase
        .from('sick_leave_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          review_notes: 'Cancelled by user',
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      return { error: error ? handleSupabaseError(error) : null };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  },

  /**
   * Get pending sick leave requests for managers/HR
   */
  async getPendingSickLeaveRequests(): Promise<{ 
    requests: SickLeaveRequest[]; 
    error: string | null 
  }> {
    try {
      const { data, error } = await supabase
        .from('sick_leave_requests')
        .select(`
          *,
          profiles!sick_leave_requests_user_id_fkey (name, employee_id, department, position)
        `)
        .eq('status', 'pending')
        .order('submitted_at', { ascending: false });

      if (error) {
        return { requests: [], error: handleSupabaseError(error) };
      }

      const requests = data.map((record: any) => this.mapSickLeaveRequestRecord(record));
      return { requests, error: null };
    } catch (error) {
      return { 
        requests: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch pending requests' 
      };
    }
  },

  /**
   * Get sick leave requests statistics for a user
   */
  async getUserSickLeaveStats(userId: string, year?: number): Promise<{
    stats: {
      totalRequests: number;
      pendingRequests: number;
      approvedRequests: number;
      rejectedRequests: number;
      totalDaysRequested: number;
      totalDaysApproved: number;
    };
    error: string | null;
  }> {
    try {
      const currentYear = year || new Date().getFullYear();
      const startOfYear = `${currentYear}-01-01`;
      const endOfYear = `${currentYear}-12-31`;

      const { data, error } = await supabase
        .from('sick_leave_requests')
        .select('status')
        .eq('user_id', userId)
        .gte('sick_date', startOfYear)
        .lte('sick_date', endOfYear);

      if (error) {
        return { 
          stats: {
            totalRequests: 0,
            pendingRequests: 0,
            approvedRequests: 0,
            rejectedRequests: 0,
            totalDaysRequested: 0,
            totalDaysApproved: 0,
          }, 
          error: handleSupabaseError(error) 
        };
      }

      const stats = data.reduce((acc, request) => {
        acc.totalRequests++;
        acc.totalDaysRequested += 1; // Each sick leave request is for 1 day
        
        switch (request.status) {
          case 'pending':
            acc.pendingRequests++;
            break;
          case 'approved':
            acc.approvedRequests++;
            acc.totalDaysApproved += 1;
            break;
          case 'rejected':
            acc.rejectedRequests++;
            break;
        }
        
        return acc;
      }, {
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        totalDaysRequested: 0,
        totalDaysApproved: 0,
      });

      return { stats, error: null };
    } catch (error) {
      return { 
        stats: {
          totalRequests: 0,
          pendingRequests: 0,
          approvedRequests: 0,
          rejectedRequests: 0,
          totalDaysRequested: 0,
          totalDaysApproved: 0,
        }, 
        error: error instanceof Error ? error.message : 'Failed to fetch sick leave stats' 
      };
    }
  },

  /**
   * Check for conflicting sick leave requests
   */
  async checkSickLeaveConflicts(
    userId: string,
    selectedDate: string,
    excludeRequestId?: string
  ): Promise<{
    hasConflicts: boolean;
    conflictingRequests: SickLeaveRequest[];
    error: string | null;
  }> {
    try {
      let query = supabase
        .from('sick_leave_requests')
        .select('*')
        .eq('user_id', userId)
        .eq('sick_date', selectedDate)
        .in('status', ['pending', 'approved']);

      if (excludeRequestId) {
        query = query.neq('id', excludeRequestId);
      }

      const { data, error } = await query;

      if (error) {
        return {
          hasConflicts: false,
          conflictingRequests: [],
          error: handleSupabaseError(error),
        };
      }

      const conflictingRequests = data.map(record => this.mapSickLeaveRequestRecord(record));

      return {
        hasConflicts: conflictingRequests.length > 0,
        conflictingRequests,
        error: null,
      };
    } catch (error) {
      return {
        hasConflicts: false,
        conflictingRequests: [],
        error: error instanceof Error ? error.message : 'Failed to check conflicts',
      };
    }
  },

  /**
   * Helper function to map database record to SickLeaveRequest
   */
  mapSickLeaveRequestRecord(data: any): SickLeaveRequest {
    // Handle attachments - stored as JSONB array
    let attachments: string[] = [];
    if (data.attachments) {
      if (Array.isArray(data.attachments)) {
        attachments = data.attachments;
      } else if (typeof data.attachments === 'string') {
        try {
          attachments = JSON.parse(data.attachments);
        } catch (error) {
          console.error('Error parsing attachments:', error);
          attachments = [];
        }
      }
    }

    return {
      id: data.id,
      userId: data.user_id,
      selectedDate: data.sick_date,
      reason: data.reason,
      attachments,
      status: data.status,
      submittedAt: new Date(data.submitted_at),
      reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : undefined,
      reviewedBy: data.reviewed_by,
      reviewNotes: data.review_notes,
    };
  },

  /**
   * Subscribe to real-time sick leave request updates
   */
  subscribeToSickLeaveRequests(userId: string, callback: (request: SickLeaveRequest) => void) {
    const subscription = supabase
      .channel('sick-leave-requests-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sick_leave_requests',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const request = this.mapSickLeaveRequestRecord(payload.new);
          callback(request);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sick_leave_requests',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const request = this.mapSickLeaveRequestRecord(payload.new);
          callback(request);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  },
};