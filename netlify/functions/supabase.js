import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// File upload utility
export async function uploadFile(file, bucket = 'documents') {
  try {
    // Generate unique filename
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileExt}`;
    
    // Convert file buffer to base64 if needed
    const fileBuffer = Buffer.isBuffer(file.buffer) ? file.buffer : Buffer.from(file.buffer);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return {
      success: true,
      fileName,
      publicUrl,
      path: `${bucket}/${fileName}`
    };
  } catch (error) {
    console.error('File upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// File delete utility
export async function deleteFile(filePath, bucket = 'documents') {
  try {
    const fileName = filePath.split('/').pop();
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([fileName]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error('File delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Get file URL utility
export function getFileUrl(fileName, bucket = 'documents') {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);
  
  return data.publicUrl;
}

export { supabase };
