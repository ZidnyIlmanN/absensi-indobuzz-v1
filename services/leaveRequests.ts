import { supabase, handleSupabaseError } from '@/lib/supabase';
import { uploadService } from './uploadService';

export interface LeaveRequest {
  id: string;
  userId: string;
  leaveType: 'full_day' | 'half_day';
  startDate: string;
  endDate: string;
  selectedDates: string[];
  description: string;
  attachments: string[];
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  durationDays: number;
}

export interface CreateLeaveRequestData {
  userId: string;
  leaveType: 'full_day' | 'half_day';
  selectedDates: string[];
  description: string;
  attachmentUris?: string[];
}

export interface LeaveRequestFilters {
  status?: 'pending' | 'approved' | 'rejected';
  startDate?: string;
  endDate?: string;
  leaveType?: 'full_day' | 'half_day';
}

export const leaveRequestsService = {
  /**
   * Create a new leave request with file uploads
   */
  async createLeaveRequest(data: CreateLeaveRequestData): Promise<{ 
    request: LeaveRequest | null; 
    error: string | null 
  }> {
    try {
      console.log('Creating leave request:', {
        userId: data.userId,
        leaveType: data.leaveType,
        selectedDatesCount: data.selectedDates.length,
        attachmentCount: data.attachmentUris?.length || 0,
        description: data.description.substring(0, 50) + '...'
      });

      // Validate input data
      if (!data.userId || !data.selectedDates || data.selectedDates.length === 0) {
        return { 
          request: null, 
          error: 'Missing required fields: userId or selectedDates' 
        };
      }

      if (!data.description || data.description.trim().length < 10) {
        return { 
          request: null, 
          error: 'Description must be at least 10 characters long' 
        };
      }

      // Validate dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const invalidDates = data.selectedDates.filter(dateString => {
        const date = new Date(dateString);
        return isNaN(date.getTime()) || date < today;
      });
      
      if (invalidDates.length > 0) {
        return { 
          request: null, 
          error: `Invalid or past dates detected: ${invalidDates.join(', ')}` 
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

      // Prepare dates for database
      const sortedDates = [...data.selectedDates].sort();
      const startDate = sortedDates[0];
      const endDate = sortedDates[sortedDates.length - 1];

      // Create leave request record
      const { data: leaveRequest, error } = await supabase
        .from('leave_requests')
        .insert({ 
          user_id: data.userId,
          leave_type: data.leaveType,
          start_date: startDate, // Min date of selected dates
          end_date: endDate,     // Max date of selected dates
          selected_dates: sortedDates, // Send as array for JSONB format
          description: data.description.trim(),
          attachments: uploadedAttachments, // Send as array for JSONB format
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        
        // Cleanup uploaded attachments on database error
        if (uploadedAttachments.length > 0) {
          console.log('Cleaning up uploaded attachments due to database error');
          // Note: In production, you might want to implement cleanup
        }
        
        return { request: null, error: handleSupabaseError(error) };
      }

      console.log('Leave request created successfully:', leaveRequest.id);

      return {
        request: this.mapLeaveRequestRecord(leaveRequest),
        error: null,
      };
    } catch (error) {
      console.error('Leave request creation error:', error);
      return { 
        request: null, 
        error: error instanceof Error ? error.message : 'Failed to create leave request' 
      };
    }
  },

  /**
   * Get leave requests for a specific user
   */
  async getUserLeaveRequests(
    userId: string,
    filters?: LeaveRequestFilters
  ): Promise<{ requests: LeaveRequest[]; error: string | null }> {
    try {
      let query = supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', userId);

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.leaveType) {
        query = query.eq('leave_type', filters.leaveType);
      }
      
      if (filters?.startDate) {
        query = query.gte('start_date', filters.startDate);
      }
      
      if (filters?.endDate) {
        query = query.lte('end_date', filters.endDate);
      }

      const { data, error } = await query.order('submitted_at', { ascending: false });

      if (error) {
        return { requests: [], error: handleSupabaseError(error) };
      }

      const requests = data.map((record: any) => this.mapLeaveRequestRecord(record));
      return { requests, error: null };
    } catch (error) {
      console.error('Error fetching user leave requests:', error);
      return { 
        requests: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch leave requests' 
      };
    }
  },

  /**
   * Get leave request by ID
   */
  async getLeaveRequestById(requestId: string): Promise<{ 
    request: LeaveRequest | null; 
    error: string | null 
  }> {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) {
        return { request: null, error: handleSupabaseError(error) };
      }

      return {
        request: this.mapLeaveRequestRecord(data),
        error: null,
      };
    } catch (error) {
      return { 
        request: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch leave request' 
      };
    }
  },

  /**
   * Update leave request status (for managers/HR)
   */
  async updateLeaveRequestStatus(
    requestId: string,
    status: 'approved' | 'rejected',
    reviewNotes?: string,
    reviewedBy?: string
  ): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('leave_requests')
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
   * Cancel leave request (only if pending)
   */
  async cancelLeaveRequest(requestId: string, userId: string): Promise<{ error: string | null }> {
    try {
      // First check if request exists and is pending
      const { data: existingRequest, error: fetchError } = await supabase
        .from('leave_requests')
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
        .from('leave_requests')
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
   * Get pending leave requests for managers/HR
   */
  async getPendingLeaveRequests(): Promise<{ 
    requests: LeaveRequest[]; 
    error: string | null 
  }> {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          profiles!leave_requests_user_id_fkey (name, employee_id, department, position)
        `)
        .eq('status', 'pending')
        .order('submitted_at', { ascending: false });

      if (error) {
        return { requests: [], error: handleSupabaseError(error) };
      }

      const requests = data.map((record: any) => this.mapLeaveRequestRecord(record));
      return { requests, error: null };
    } catch (error) {
      return { 
        requests: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch pending requests' 
      };
    }
  },

  /**
   * Get leave requests statistics for a user
   */
  async getUserLeaveStats(userId: string, year?: number): Promise<{
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
        .from('leave_requests')
        .select('status, duration_days')
        .eq('user_id', userId)
        .gte('start_date', startOfYear)
        .lte('end_date', endOfYear);

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
        acc.totalDaysRequested += request.duration_days || 0;
        
        switch (request.status) {
          case 'pending':
            acc.pendingRequests++;
            break;
          case 'approved':
            acc.approvedRequests++;
            acc.totalDaysApproved += request.duration_days || 0;
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
        error: error instanceof Error ? error.message : 'Failed to fetch leave stats' 
      };
    }
  },

  /**
   * Check for conflicting leave requests
   */
  async checkLeaveConflicts(
    userId: string,
    selectedDates: string[],
    excludeRequestId?: string
  ): Promise<{
    hasConflicts: boolean;
    conflictingDates: string[];
    conflictingRequests: LeaveRequest[];
    error: string | null;
  }> {
    try {
      const startDate = Math.min(...selectedDates.map(d => new Date(d).getTime()));
      const endDate = Math.max(...selectedDates.map(d => new Date(d).getTime()));
      
      let query = supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['pending', 'approved'])
        .or(`start_date.lte.${new Date(endDate).toISOString().split('T')[0]},end_date.gte.${new Date(startDate).toISOString().split('T')[0]}`);

      if (excludeRequestId) {
        query = query.neq('id', excludeRequestId);
      }

      const { data, error } = await query;

      if (error) {
        return {
          hasConflicts: false,
          conflictingDates: [],
          conflictingRequests: [],
          error: handleSupabaseError(error),
        };
      }

      const conflictingRequests = data.map(record => this.mapLeaveRequestRecord(record));
      const conflictingDates: string[] = [];

      // Check for actual date conflicts
      conflictingRequests.forEach(request => {
        const requestDates = request.selectedDates.length > 0 
          ? request.selectedDates 
          : this.generateDateRange(request.startDate, request.endDate);
        
        selectedDates.forEach(selectedDate => {
          if (requestDates.includes(selectedDate)) {
            conflictingDates.push(selectedDate);
          }
        });
      });

      return {
        hasConflicts: conflictingDates.length > 0,
        conflictingDates: [...new Set(conflictingDates)], // Remove duplicates
        conflictingRequests,
        error: null,
      };
    } catch (error) {
      return {
        hasConflicts: false,
        conflictingDates: [],
        conflictingRequests: [],
        error: error instanceof Error ? error.message : 'Failed to check conflicts',
      };
    }
  },

  /**
   * Get team leave requests (for managers)
   */
  async getTeamLeaveRequests(
    managerId: string,
    filters?: LeaveRequestFilters
  ): Promise<{ requests: LeaveRequest[]; error: string | null }> {
    try {
      // Get manager's department first
      const { data: managerProfile, error: managerError } = await supabase
        .from('profiles')
        .select('department')
        .eq('id', managerId)
        .single();

      if (managerError) {
        return { requests: [], error: handleSupabaseError(managerError) };
      }

      // Get all users in the same department
      const { data: teamMembers, error: teamError } = await supabase
        .from('profiles')
        .select('id')
        .eq('department', managerProfile.department);

      if (teamError) {
        return { requests: [], error: handleSupabaseError(teamError) };
      }

      const teamMemberIds = teamMembers.map(member => member.id);

      // Get leave requests for team members
      let query = supabase
        .from('leave_requests')
        .select(`
          *,
          profiles!leave_requests_user_id_fkey (name, employee_id, department, position)
        `)
        .in('user_id', teamMemberIds);

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.leaveType) {
        query = query.eq('leave_type', filters.leaveType);
      }
      
      if (filters?.startDate) {
        query = query.gte('start_date', filters.startDate);
      }
      
      if (filters?.endDate) {
        query = query.lte('end_date', filters.endDate);
      }

      const { data, error } = await query.order('submitted_at', { ascending: false });

      if (error) {
        return { requests: [], error: handleSupabaseError(error) };
      }

      const requests = data.map((record: any) => this.mapLeaveRequestRecord(record));
      return { requests, error: null };
    } catch (error) {
      return { 
        requests: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch team requests' 
      };
    }
  },

  /**
   * Helper function to map database record to LeaveRequest
   */
  mapLeaveRequestRecord(data: any): LeaveRequest {
    // Handle selected_dates - now stored as JSONB array
    let selectedDates: string[] = [];
    if (data.selected_dates) {
      if (Array.isArray(data.selected_dates)) {
        selectedDates = data.selected_dates;
      } else if (typeof data.selected_dates === 'string') {
        // Fallback for legacy string format
        try {
          selectedDates = JSON.parse(data.selected_dates);
        } catch (error) {
          console.error('Error parsing selected_dates:', error);
          selectedDates = this.generateDateRange(data.start_date, data.end_date);
        }
      }
    } else {
      // Fallback to generating range from start_date and end_date
      selectedDates = this.generateDateRange(data.start_date, data.end_date);
    }

    // Handle attachments - now stored as JSONB array
    let attachments: string[] = [];
    if (data.attachments) {
      if (Array.isArray(data.attachments)) {
        attachments = data.attachments;
      } else if (typeof data.attachments === 'string') {
        // Fallback for legacy string format
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
      leaveType: data.leave_type,
      startDate: data.start_date,
      endDate: data.end_date,
      selectedDates,
      description: data.description,
      attachments,
      status: data.status,
      submittedAt: new Date(data.submitted_at),
      reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : undefined,
      reviewedBy: data.reviewed_by,
      reviewNotes: data.review_notes,
      durationDays: data.duration_days || selectedDates.length,
    };
  },


  /**
   * Helper function to generate date range
   */
  generateDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return [startDate]; // Return single date if range is invalid
    }
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    
    return dates;
  },

  /**
   * Subscribe to real-time leave request updates
   */
  subscribeToLeaveRequests(userId: string, callback: (request: LeaveRequest) => void) {
    const subscription = supabase
      .channel('leave-requests-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leave_requests',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const request = this.mapLeaveRequestRecord(payload.new);
          callback(request);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leave_requests',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const request = this.mapLeaveRequestRecord(payload.new);
          callback(request);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  },

  /**
   * Get leave balance for user (mock implementation)
   */
  async getUserLeaveBalance(userId: string, year?: number): Promise<{
    balance: {
      annual: { used: number; total: number; remaining: number };
      sick: { used: number; total: number; remaining: number };
      personal: { used: number; total: number; remaining: number };
    };
    error: string | null;
  }> {
    try {
      const stats = await this.getUserLeaveStats(userId, year);
      
      if (stats.error) {
        return {
          balance: {
            annual: { used: 0, total: 20, remaining: 20 },
            sick: { used: 0, total: 12, remaining: 12 },
            personal: { used: 0, total: 5, remaining: 5 },
          },
          error: stats.error,
        };
      }

      // Mock calculation - in real app, this would be based on company policy
      const annualUsed = Math.min(stats.stats.totalDaysApproved, 20);
      const sickUsed = 0; // Would need to track sick leave separately
      const personalUsed = 0; // Would need to track personal leave separately

      return {
        balance: {
          annual: { used: annualUsed, total: 20, remaining: 20 - annualUsed },
          sick: { used: sickUsed, total: 12, remaining: 12 - sickUsed },
          personal: { used: personalUsed, total: 5, remaining: 5 - personalUsed },
        },
        error: null,
      };
    } catch (error) {
      return {
        balance: {
          annual: { used: 0, total: 20, remaining: 20 },
          sick: { used: 0, total: 12, remaining: 12 },
          personal: { used: 0, total: 5, remaining: 5 },
        },
        error: error instanceof Error ? error.message : 'Failed to fetch leave balance',
      };
    }
  },
};