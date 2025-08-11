import { supabase, handleSupabaseError } from '@/lib/supabase';
import { imageService } from './imageService';

export interface LeaveRequest {
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
  startDate: string;
  endDate: string;
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
          start_date: data.startDate,
          end_date: data.endDate,
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
          quality: 0.7,
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
    return {
      id: data.id,
      userId: data.user_id,
      leaveType: data.leave_type,
      startDate: data.start_date,
      endDate: data.end_date,
      description: data.description,
      attachments: data.attachments ? JSON.parse(data.attachments) : [],
      status: data.status,
      submittedAt: new Date(data.submitted_at),
      reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : undefined,
      reviewedBy: data.reviewed_by,
      reviewNotes: data.review_notes,
    };
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
