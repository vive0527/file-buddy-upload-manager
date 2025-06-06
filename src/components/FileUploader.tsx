import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileUp, AlertCircle, Check, X, Download, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  const [warnings, setWarnings] = useState<string[]>([]);
  const [fileContents, setFileContents] = useState<{ [key: string]: string }>({});
  const [showPreview, setShowPreview] = useState<{ [key: string]: boolean }>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    const newWarnings: string[] = [];
    
    if (file.size > maxSizeInMB * 1024 * 1024) {
      setError(`文件大小超过 ${maxSizeInMB}MB 限制`);
      return false;
    }

    if (allowedFileTypes.length > 0 && !allowedFileTypes.includes(file.type)) {
      setError(`不支持的文件类型。支持的类型: ${allowedFileTypes.join(', ')}`);
      return false;
    }

    // 添加警告检查
    if (file.size > (maxSizeInMB * 0.8) * 1024 * 1024) {
      newWarnings.push(`文件大小接近限制 (${formatFileSize(file.size)} / ${maxSizeInMB}MB)`);
    }

    if (file.name.length > 50) {
      newWarnings.push('文件名过长，建议使用较短的文件名');
    }

    if (!file.name.includes('.')) {
      newWarnings.push('文件没有扩展名，可能会影响识别');
    }

    setWarnings(newWarnings);
    setError(null);
    return true;
  };

  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      if (file.type.startsWith('image/')) {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      } else if (file.type === 'text/plain' || file.type === 'application/json' || file.type === 'text/csv') {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(file);
      } else if (file.type === 'application/pdf') {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        resolve('无法预览此文件类型');
      }
      
      reader.onerror = () => reject(new Error('读取文件失败'));
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!validateFile(file)) return;

    setIsUploading(true);
    try {
      // 读取文件内容
      const content = await readFileContent(file);
      
      const uploadedFileInfo = await onFileUpload(file);
      setUploadedFiles((prev) => [...prev, uploadedFileInfo]);
      setFileContents((prev) => ({ ...prev, [uploadedFileInfo.id]: content }));
      setShowPreview((prev) => ({ ...prev, [uploadedFileInfo.id]: false }));
      setWarnings([]);
      toast({
        title: "文件上传成功",
        description: `${file.name} 已成功上传。`,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : '文件上传失败');
      toast({
        variant: "destructive",
        title: "上传失败",
        description: error instanceof Error ? error.message : '文件上传失败',
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
    setFileContents((prev) => {
      const { [fileId]: removed, ...rest } = prev;
      return rest;
    });
    setShowPreview((prev) => {
      const { [fileId]: removed, ...rest } = prev;
      return rest;
    });
  };

  const togglePreview = (fileId: string) => {
    setShowPreview((prev) => ({ ...prev, [fileId]: !prev[fileId] }));
  };

  const renderFileContent = (file: UploadedFileInfo) => {
    const content = fileContents[file.id];
    if (!content) return null;

    if (file.type.startsWith('image/')) {
      return (
        <div className="mt-3 p-3 bg-gray-50 rounded-md">
          <img 
            src={content} 
            alt={file.name}
            className="max-w-full max-h-64 object-contain rounded"
          />
        </div>
      );
    }

    if (file.type === 'application/pdf') {
      return (
        <div className="mt-3 p-3 bg-gray-50 rounded-md">
          <iframe
            src={content}
            className="w-full h-64 border rounded"
            title={file.name}
          />
        </div>
      );
    }

    if (file.type === 'text/plain' || file.type === 'application/json' || file.type === 'text/csv') {
      return (
        <div className="mt-3 p-3 bg-gray-50 rounded-md">
          <pre className="text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
            {content}
          </pre>
        </div>
      );
    }

    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-md text-center text-muted-foreground">
        {content}
      </div>
    );
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
            拖拽文件到这里
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            或点击选择文件
          </p>
          <Button
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                上传中...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                选择文件
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
            <p>最大文件大小: {maxSizeInMB}MB</p>
            <p>支持的文件类型: {allowedFileTypes.join(', ')}</p>
          </div>
        </div>
      </div>

      {/* 错误警告 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 一般警告 */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((warning, index) => (
            <Alert key={index} className="border-yellow-500/50 bg-yellow-50 text-yellow-800">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>{warning}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium mb-3">已上传文件</h3>
          <div className="space-y-4">
            {uploadedFiles.map((file) => (
              <div 
                key={file.id}
                className="bg-background p-4 rounded-md border"
              >
                <div className="flex items-center justify-between">
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
                      onClick={() => togglePreview(file.id)}
                    >
                      {showPreview[file.id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
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
                
                {showPreview[file.id] && renderFileContent(file)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
