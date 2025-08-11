@@ .. @@
 import { supabase, handleSupabaseError } from '@/lib/supabase';
-import { imageService } from './imageService';
+import { leaveAttachmentService } from './leaveAttachmentService';
+import { imageCompressionService } from './imageCompressionService';

@@ .. @@
   async createLeaveRequest(data: CreateLeaveRequestData): Promise<{ request: LeaveRequest | null; error: string | null }> {
     try {
       console.log('Creating leave request:', data);

-      // Upload attachments first if provided
+      // Upload and compress attachments first if provided
       let uploadedAttachments: string[] = [];
       
       if (data.attachmentUris && data.attachmentUris.length > 0) {
-        console.log('Uploading attachments...');
+        console.log('Uploading and compressing attachments...');
         
-        for (const uri of data.attachmentUris) {
-          const uploadResult = await this.uploadAttachment(data.userId, uri);
+        // Use the new compression service for attachments
+        const uploadResults = await leaveAttachmentService.uploadMultipleAttachments(
+          data.userId,
+          data.attachmentUris,
+          {
+            compressionPreset: 'balanced',
+            generateThumbnail: true,
+            validateBeforeUpload: true,
+          }
+        );
+        
+        for (const uploadResult of uploadResults) {
           if (uploadResult.error) {
             return { request: null, error: `Failed to upload attachment: ${uploadResult.error}` };
           }
           
           if (uploadResult.url) {
             uploadedAttachments.push(uploadResult.url);
+            
+            // Log compression stats if available
+            if (uploadResult.compressionStats) {
+              console.log('📊 Attachment compression stats:', {
+                originalSize: `${Math.round(uploadResult.compressionStats.originalSize / 1024)}KB`,
+                compressedSize: `${Math.round(uploadResult.compressionStats.compressedSize / 1024)}KB`,
+                savings: `${Math.round(uploadResult.compressionStats.compressionRatio * 100)}%`,
+              });
+            }
           }
         }
       }

@@ .. @@
     }
   },

-  // Upload attachment file
-  async uploadAttachment(userId: string, fileUri: string): Promise<{ url: string | null; error: string | null }> {
-    try {
-      console.log('Uploading leave request attachment:', fileUri);
-
-      // Validate file first
-      const validation = await imageService.validateImageFile(fileUri);
-      if (!validation.isValid) {
-        return { url: null, error: validation.error || 'Invalid file' };
-      }
-
-      // Generate unique filename
-      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
-      const fileExtension = this.getFileExtension(fileUri);
-      const fileName = `${userId}/leave-requests/attachment_${timestamp}${fileExtension}`;
-
-      // Convert file to ArrayBuffer (reusing logic from imageService)
-      const response = await fetch(fileUri);
-      const arrayBuffer = await response.arrayBuffer();
-
-      if (arrayBuffer.byteLength === 0) {
-        return { url: null, error: 'File is empty' };
-      }
-
-      // Upload to Supabase Storage
-      const { data, error } = await supabase.storage
-        .from('leave-attachments')
-        .upload(fileName, arrayBuffer, {
-          contentType: this.getContentType(fileExtension),
-          upsert: false,
-        });
-
-      if (error) {
-        return { url: null, error: handleSupabaseError(error) };
-      }
-
-      // Get public URL
-      const { data: { publicUrl } } = supabase.storage
-        .from('leave-attachments')
-        .getPublicUrl(data.path);
-
-      return { url: publicUrl, error: null };
-    } catch (error) {
-      console.error('Error uploading attachment:', error);
-      return { url: null, error: handleSupabaseError(error) };
-    }
-  },
+  // Get compression statistics for analytics
+  async getCompressionStats(): Promise<{
+    totalSavingsMB: number;
+    averageCompressionPercentage: number;
+    processedCount: number;
+  }> {
+    const stats = imageCompressionService.getCompressionStats();
+    return {
+      totalSavingsMB: stats.totalSavingsMB,
+      averageCompressionPercentage: stats.averageCompressionPercentage,
+      processedCount: stats.processedCount,
+    };
+  },

@@ .. @@
   // Helper function to get file extension
   getFileExtension(uri: string): string {
     const parts = uri.split('.');
     return parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : '.jpg';
   },

@@ .. @@
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