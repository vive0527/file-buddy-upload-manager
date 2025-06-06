
import { UploadedFileInfo } from '@/components/FileUploader';

// This is a simulated backend API response
// In a real application, you would replace this with actual API calls
export const uploadFile = async (file: File): Promise<UploadedFileInfo> => {
  // Simulate API request delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate server validation
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Server rejected the file: File too large");
  }
  
  // In a real implementation, you would send the file to your backend
  // const formData = new FormData();
  // formData.append('file', file);
  // const response = await fetch('/api/upload', {
  //   method: 'POST',
  //   body: formData,
  // });
  // if (!response.ok) throw new Error('Upload failed');
  // return await response.json();
  
  // For now, we'll create a mock response
  const mockResponse: UploadedFileInfo = {
    id: Math.random().toString(36).substring(2, 15),
    name: file.name,
    url: URL.createObjectURL(file),
    size: file.size,
    type: file.type,
  };
  
  return mockResponse;
};
