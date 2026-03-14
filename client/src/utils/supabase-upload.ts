// Supabase file upload utility for frontend

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

export interface UploadResult {
  success: boolean;
  fileName?: string;
  publicUrl?: string;
  error?: string;
}

// Upload file to Supabase Storage
export async function uploadFile(file: File, bucket: string = 'documents'): Promise<UploadResult> {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileExt}`;
    
    // Create FormData for API call
    const formData = new FormData();
    formData.append('file', file);
    formData.append('originalname', file.name);
    formData.append('mimetype', file.type);
    formData.append('base64', await fileToBase64(file));
    
    // Upload via Netlify function
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
    
    const result = await response.json();
    return {
      success: true,
      fileName: result.file.name,
      publicUrl: result.file.url
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message || 'Upload failed'
    };
  }
}

// Convert file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

// Delete file from Supabase Storage
export async function deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/upload/${filePath}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || 'Delete failed'
      };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error.message || 'Delete failed'
    };
  }
}

// Get public URL for file
export function getFileUrl(fileName: string, bucket: string = 'documents'): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${fileName}`;
}
