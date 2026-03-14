# 🗄️ Supabase File Upload Setup Guide

## 📋 Prerequisites
- Supabase account (free tier available)
- Netlify account for deployment

## 🚀 Step 1: Create Supabase Project

1. **Go to**: [supabase.com](https://supabase.com)
2. **Sign Up** or **Sign In**
3. **Click**: "New Project"
4. **Enter**: Project name (e.g., `asset-manager`)
5. **Choose**: Database password
6. **Select**: Region (closest to your users)
7. **Click**: "Create new project"

## 🗄️ Step 2: Set Up Storage

1. **Go to**: Storage section in Supabase dashboard
2. **Click**: "Create new bucket"
3. **Bucket name**: `documents`
4. **Public bucket**: ✅ Make public
5. **File size limit**: 50MB (adjust as needed)
6. **Allowed file types**: PDF, images, documents

## 🔑 Step 3: Get API Keys

1. **Go to**: Settings → API
2. **Copy**: Project URL
3. **Copy**: `anon public` key
4. **Save**: These values for environment variables

## ⚙️ Step 4: Configure Environment Variables

### **In Netlify Dashboard:**
```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
DATABASE_URL=postgresql://postgres:password@db.your-project-ref.supabase.co:5432/postgres
SESSION_SECRET=your-jwt-secret
NODE_ENV=production
```

### **In Local Development (.env):**
```
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-public-key
```

## 📁 Step 5: Update Frontend Code

### **File Upload Usage:**
```typescript
import { uploadFile, deleteFile } from '../utils/supabase-upload';

// Upload file
const fileInput = document.getElementById('file') as HTMLInputElement;
const file = fileInput.files[0];

const result = await uploadFile(file, 'documents');
if (result.success) {
  console.log('File uploaded:', result.publicUrl);
}

// Delete file
const deleteResult = await deleteFile('documents/filename.pdf');
if (deleteResult.success) {
  console.log('File deleted');
}
```

## 🔧 Step 6: Storage Policies (Optional)

For production, set up Row Level Security:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Users can upload files" ON storage.objects
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id = 'documents'
);

-- Allow public access to files
CREATE POLICY "Files are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'documents');
```

## 🎯 Features Available

### **✅ File Upload:**
- **📤 Upload**: PDF, images, documents
- **🔐 Secure**: JWT authentication required
- **🗄️ Storage**: Supabase cloud storage
- **🌐 Public URLs**: Direct file access

### **✅ File Management:**
- **📋 List**: View uploaded files
- **🗑️ Delete**: Remove files
- **🔗 Share**: Public URL generation
- **📊 Storage**: Usage tracking

## 🚀 Deployment

### **Automatic:**
1. **Push**: Code to GitHub
2. **Deploy**: Netlify auto-builds
3. **Configure**: Environment variables
4. **✅ Live**: File uploads working

### **Manual:**
1. **Build**: `npm run build`
2. **Deploy**: Netlify CLI
3. **Test**: File upload functionality

## 🔍 Testing

### **Local Testing:**
```bash
# Start local server
npm run dev

# Test file upload
# Navigate to upload page
# Select and upload file
```

### **Production Testing:**
1. **Visit**: Your Netlify site
2. **Login**: With valid credentials
3. **Upload**: Test file functionality
4. **Verify**: File appears in Supabase storage

## 📝 Notes

- **🗄️ Storage**: Files stored in Supabase cloud
- **🔐 Security**: JWT authentication required
- **📊 Limits**: Based on Supabase plan
- **🌐 URLs**: Publicly accessible files
- **💾 Backup**: Automatic with Supabase

## 🎉 Benefits

- **✅ Scalable**: Cloud-based storage
- **🚀 Fast**: CDN delivery
- **🔐 Secure**: Authentication required
- **💰 Cost-effective**: Generous free tier
- **🔧 Easy**: Simple API integration

Your Asset Manager now has professional file storage with Supabase! 🗄️✨
