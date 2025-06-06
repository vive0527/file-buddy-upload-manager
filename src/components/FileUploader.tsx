
import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileUp, AlertCircle, Check, X, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export interface FileUploaderProps {
  maxSizeInMB?: number;
  allowedFileTypes?: string[];
  onFileUpload: (file: File) => Promise<UploadedFileInfo>;
  className?: string;
}

export interface UploadedFileInfo {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  maxSizeInMB = 5,
  allowedFileTypes = ['image/jpeg', 'image/png', 'application/pdf'],
  onFileUpload,
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    if (file.size > maxSizeInMB * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeInMB}MB`);
      return false;
    }

    if (allowedFileTypes.length > 0 && !allowedFileTypes.includes(file.type)) {
      setError(`File type not allowed. Allowed types: ${allowedFileTypes.join(', ')}`);
      return false;
    }

    setError(null);
    return true;
  };

  const handleFileUpload = async (file: File) => {
    if (!validateFile(file)) return;

    setIsUploading(true);
    try {
      const uploadedFileInfo = await onFileUpload(file);
      setUploadedFiles((prev) => [...prev, uploadedFileInfo]);
      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been uploaded.`,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upload file');
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Failed to upload file',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileUpload(e.dataTransfer.files[0]);
      }
    },
    [handleFileUpload]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const downloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 transition-all duration-150 ease-in-out",
          "flex flex-col items-center justify-center gap-4 text-center",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
          error ? "border-destructive/50 bg-destructive/5" : ""
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleFileDrop}
      >
        <div className="bg-primary/10 p-4 rounded-full">
          <FileUp className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold mb-1 text-lg">
            Drag & drop your file here
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            or click to browse your files
          </p>
          <Button
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Select File
              </>
            )}
          </Button>
          <input
            type="file"
            ref={inputRef}
            onChange={handleFileInput}
            className="hidden"
            disabled={isUploading}
          />
          
          <div className="mt-4 text-xs text-muted-foreground">
            <p>Maximum file size: {maxSizeInMB}MB</p>
            <p>Allowed file types: {allowedFileTypes.join(', ')}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive p-2 bg-destructive/5 rounded-md text-sm">
          <AlertCircle className="h-4 w-4" />
          <p>{error}</p>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium mb-3">Uploaded Files</h3>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div 
                key={file.id}
                className="flex items-center justify-between bg-background p-3 rounded-md border"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="bg-primary/10 p-1 rounded">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <div className="truncate">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.type} • {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => downloadFile(file.url, file.name)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeFile(file.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
