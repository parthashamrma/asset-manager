import { createClient } from '@supabase/supabase-js';

class SupabaseStorageManager {
  private supabase: any;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found in environment variables');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'uploads'): Promise<{
    success: boolean;
    fileName?: string;
    filePath?: string;
    publicUrl?: string;
    error?: string;
  }> {
    try {
      const timestamp = Date.now();
      const random = Math.round(Math.random() * 1E9);
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${file.fieldname}-${timestamp}-${random}.${fileExtension}`;
      const filePath = `${folder}/${fileName}`;
      
      // Read file buffer
      const fileBuffer = await this.readFileAsBuffer(file.path);
      
      const { data, error } = await this.supabase.storage
        .from('uploads')
        .upload(filePath, fileBuffer, {
          contentType: file.mimetype,
          upsert: false
        });
      
      if (error) {
        console.error('Supabase upload error:', error);
        return { success: false, error: error.message };
      }
      
      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);
      
      // Clean up local temp file
      await this.cleanupTempFile(file.path);
      
      return {
        success: true,
        fileName,
        filePath,
        publicUrl,
      };
    } catch (error) {
      console.error('Upload failed:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.storage
        .from('uploads')
        .remove([filePath]);
      
      return { success: !error, error: error?.message };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async getPublicUrl(filePath: string): Promise<string> {
    const { data } = await this.supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }

  private async readFileAsBuffer(filePath: string): Promise<Buffer> {
    const fs = await import('fs');
    return fs.promises.readFile(filePath);
  }

  private async cleanupTempFile(filePath: string): Promise<void> {
    const fs = await import('fs');
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      console.warn('Failed to cleanup temp file:', error);
    }
  }
}

export const supabaseStorage = new SupabaseStorageManager();
