import { supabase, handleSupabaseError } from '@/lib/supabase';
import { imageService } from './imageService';
import { validateDateArray, calculateLeaveDuration, debugDateSelection } from '@/utils/dateUtils';

export interface LeaveRequest {
  selectedDates: any;
  id: string;
  userId: string;
  leaveType: 'full_day' | 'half_day';
  startDate: string;
  endDate: string;
  description: string;
  attachments: string[];
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
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
  dateFrom?: string;
  dateTo?: string;
  leaveType?: 'full_day' | 'half_day';
}

export const leaveRequestsService = {
  // Create new leave request
  async createLeaveRequest(data: CreateLeaveRequestData): Promise<{ request: LeaveRequest | null; error: string | null }> {
    try {
      console.log('Creating leave request:', data);
      
      // Enhanced date validation
      const dateValidation = validateDateArray(data.selectedDates);
      if (!dateValidation.isValid) {
        console.error('Date validation failed:', dateValidation.errors);
        return { 
          request: null, 
          error: `Invalid dates: ${dateValidation.errors.join(', ')}` 
        };
      }
      
      // Use only valid dates
      const validDates = dateValidation.validDates.sort();
      const sortedDates = validDates;
      const startDate = sortedDates[0];
      const endDate = sortedDates[sortedDates.length - 1];
      
      // Calculate expected duration for verification
      const expectedDuration = calculateLeaveDuration(validDates, data.leaveType);
      
      console.log('Date processing:', {
        originalDates: data.selectedDates,
        validDates,
        sortedDates,
        startDate,
        endDate,
        totalDates: validDates.length,
        expectedDuration,
        leaveType: data.leaveType
      });

      // Upload attachments first if provided
      let uploadedAttachments: string[] = [];
      
      if (data.attachmentUris && data.attachmentUris.length > 0) {
        console.log('Uploading attachments...');
        
        for (const uri of data.attachmentUris) {
          const uploadResult = await this.uploadAttachment(data.userId, uri);
          
          if (uploadResult.error) {
            return { request: null, error: `Failed to upload attachment: ${uploadResult.error}` };
          }
          
          if (uploadResult.url) {
            uploadedAttachments.push(uploadResult.url);
          }
        }
      }

      // Create leave request record
      const { data: request, error } = await supabase
        .from('leave_requests')
        .insert({
          user_id: data.userId,
          leave_type: data.leaveType,
          start_date: startDate,
          end_date: endDate,
          selected_dates: data.selectedDates, // Store as proper JSONB array
          description: data.description,
          attachments: JSON.stringify(uploadedAttachments),
        })
        .select()
        .single();

      if (error) {
        return { request: null, error: handleSupabaseError(error) };
      }

      return {
        request: this.mapLeaveRequestRecord(request),
        error: null,
      };
    } catch (error) {
      console.error('Error creating leave request:', error);
      return { request: null, error: handleSupabaseError(error) };
    }
  },

  // Get user's leave requests
  async getUserLeaveRequests(
    userId: string,
    filters?: LeaveRequestFilters
  ): Promise<{ requests: LeaveRequest[]; error: string | null }> {
    try {
      let query = supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.leaveType) {
        query = query.eq('leave_type', filters.leaveType);
      }
      
      if (filters?.dateFrom) {
        query = query.gte('leave_date', filters.dateFrom);
      }
      
      if (filters?.dateTo) {
        query = query.lte('end_date', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) {
        return { requests: [], error: handleSupabaseError(error) };
      }

      const requests = data.map((request: any) => this.mapLeaveRequestRecord(request));
      return { requests, error: null };
    } catch (error) {
      return { requests: [], error: handleSupabaseError(error) };
    }
  },

  // Update leave request status (for managers/HR)
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
        })
        .eq('id', requestId);

      return { error: error ? handleSupabaseError(error) : null };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  },

  // Upload attachment file
  async uploadAttachment(userId: string, fileUri: string): Promise<{ url: string | null; error: string | null }> {
    try {
      console.log('Uploading leave request attachment:', fileUri);

      // Validate file first
      const validation = await imageService.validateImageFile(fileUri);
      if (!validation.isValid) {
        return { url: null, error: validation.error || 'Invalid file' };
      }

      let processedFileUri = fileUri;
      const fileExtension = this.getFileExtension(fileUri);
      const contentType = this.getContentType(fileExtension);

      // Compress image if it's a supported image type
      if (contentType.startsWith('image/')) {
        console.log('Attachment is an image, attempting compression...');
        const compressionResult = await imageService.compressImage(fileUri, {
          quality: 0.4,
          maxWidth: 1024,
          maxHeight: 1024,
          format: 'jpeg',
        });

        if (compressionResult.error || !compressionResult.uri) {
          console.warn('Image compression failed, uploading original file. Error:', compressionResult.error);
        } else {
          processedFileUri = compressionResult.uri;
          console.log('Image compressed successfully:', processedFileUri);
        }
      }

      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const finalFileExtension = this.getFileExtension(processedFileUri);
      const fileName = `${userId}/leave-requests/attachment_${timestamp}${finalFileExtension}`;

      // Convert file to ArrayBuffer
      const response = await fetch(processedFileUri);
      const arrayBuffer = await response.arrayBuffer();

      if (arrayBuffer.byteLength === 0) {
        return { url: null, error: 'File is empty' };
      }

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('leave-attachments')
        .upload(fileName, arrayBuffer, {
          contentType: this.getContentType(finalFileExtension),
          upsert: false,
        });

      if (error) {
        return { url: null, error: handleSupabaseError(error) };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('leave-attachments')
        .getPublicUrl(data.path);

      return { url: publicUrl, error: null };
    } catch (error) {
      console.error('Error uploading attachment:', error);
      return { url: null, error: handleSupabaseError(error) };
    }
  },

  // Delete leave request (only if pending)
  async deleteLeaveRequest(requestId: string, userId: string): Promise<{ error: string | null }> {
    try {
      // First check if request belongs to user and is pending
      const { data: request, error: fetchError } = await supabase
        .from('leave_requests')
        .select('status, attachments')
        .eq('id', requestId)
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        return { error: handleSupabaseError(fetchError) };
      }

      if (request.status !== 'pending') {
        return { error: 'Can only delete pending requests' };
      }

      // Delete attachments from storage
      if (request.attachments) {
        const attachmentUrls = JSON.parse(request.attachments);
        for (const url of attachmentUrls) {
          const path = this.extractPathFromUrl(url);
          if (path) {
            await supabase.storage.from('leave-attachments').remove([path]);
          }
        }
      }

      // Delete the request
      const { error } = await supabase
        .from('leave_requests')
        .delete()
        .eq('id', requestId)
        .eq('user_id', userId);

      return { error: error ? handleSupabaseError(error) : null };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  },

  // Helper function to map database record to LeaveRequest
  mapLeaveRequestRecord(data: any): LeaveRequest {
    // Enhanced handling for multiple date formats
    let selectedDates: string[] = [];
    
    // Priority 1: Use selected_dates if it's a proper array
    if (data.selected_dates && Array.isArray(data.selected_dates)) {
      selectedDates = data.selected_dates;
      console.log('Using selected_dates array:', selectedDates);
    } else if (data.selected_dates && typeof data.selected_dates === 'string') {
      // Handle string JSON format
      try {
        selectedDates = JSON.parse(data.selected_dates);
        console.log('Parsed selected_dates from JSON string:', selectedDates);
      } catch (error) {
        console.error('Error parsing selected_dates JSON:', error);
        selectedDates = [];
      }
    }
    
    // Priority 2: Fallback to start_date/end_date only if no selected_dates
    if (selectedDates.length === 0 && data.start_date) {
      console.log('Falling back to start_date/end_date format');
      selectedDates = [data.start_date];
      
      // Only generate range if it's actually a range (different dates)
      if (data.end_date && data.end_date !== data.start_date) {
        // For legacy records, check if this should be a range or individual dates
        // If duration_days matches the date range, it's likely a true range
        const daysDiff = Math.ceil((new Date(data.end_date).getTime() - new Date(data.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        if (data.duration_days && data.duration_days === daysDiff) {
          // This appears to be a legitimate date range, generate all dates
          selectedDates = this.generateDateRange(data.start_date, data.end_date);
        } else {
          // This might be individual dates stored incorrectly, just use start and end
          selectedDates = [data.start_date, data.end_date];
        }
      }
    }
    
    // Ensure we have valid dates
    if (selectedDates.length === 0) {
      console.warn('No valid dates found for leave request:', data.id);
      selectedDates = data.start_date ? [data.start_date] : [];
    }
        const start = new Date(data.start_date);
        const end = new Date(data.end_date);
        selectedDates = [];
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          selectedDates.push(d.toISOString().split('T')[0]);
        }
      }
    }

    return {
      id: data.id,
      userId: data.user_id,
      leaveType: data.leave_type,
      startDate: data.start_date,
      endDate: data.end_date,
      selectedDates: selectedDates,
      description: data.description,
      attachments: this.parseAttachments(data.attachments),
      status: data.status,
      submittedAt: new Date(data.submitted_at),
      reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : undefined,
      reviewedBy: data.reviewed_by,
      reviewNotes: data.review_notes,
    };
  },

  // Helper function to generate date range
  generateDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    
    return dates;
  },

  // Helper function to safely parse attachments
  parseAttachments(attachments: any): string[] {
    if (!attachments) return [];
    
    if (Array.isArray(attachments)) {
      return attachments;
    }
    
    if (typeof attachments === 'string') {
      try {
        const parsed = JSON.parse(attachments);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.error('Error parsing attachments:', error);
        return [];
      }
    }
    
    return [];
  },

  // Helper function to get file extension
  getFileExtension(uri: string): string {
    const parts = uri.split('.');
    return parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : '.jpg';
  },

  // Helper function to get content type
  getContentType(extension: string): string {
    const contentTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
    };
    
    return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
  },

  // Helper function to extract path from storage URL
  extractPathFromUrl(url: string): string | null {
    try {
      const urlParts = url.split('/storage/v1/object/public/leave-attachments/');
      return urlParts.length > 1 ? urlParts[1] : null;
    } catch (error) {
      return null;
    }
  },
};