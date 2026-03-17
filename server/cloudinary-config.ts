import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your-api-key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your-api-secret'
});

// Create Cloudinary storage for multer
export const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'asset-manager',
    resource_type: 'auto',
    allowed_formats: ['pdf', 'doc', 'docx', 'jpg', 'png', 'jpeg', 'txt'],
    max_file_size: 10485760, // 10MB
    public_id: (req: any, file: any) => {
      const timestamp = Date.now();
      const random = Math.round(Math.random() * 1E9);
      return `${file.fieldname}-${timestamp}-${random}`;
    }
  }
});

export { cloudinary };
