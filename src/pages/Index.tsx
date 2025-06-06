
import React, { useState } from 'react';
import { FileUploader, UploadedFileInfo } from '@/components/FileUploader';
import { uploadFile } from '@/services/fileService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  const [maxFileSize, setMaxFileSize] = useState<number>(5);
  const [fileTypes, setFileTypes] = useState<string[]>([
    'image/jpeg', 
    'image/png', 
    'application/pdf'
  ]);
  const [customFileType, setCustomFileType] = useState<string>('');

  const handleFileUpload = async (file: File): Promise<UploadedFileInfo> => {
    try {
      return await uploadFile(file);
    } catch (error) {
      throw error;
    }
  };

  const addCustomFileType = () => {
    if (customFileType && !fileTypes.includes(customFileType)) {
      setFileTypes([...fileTypes, customFileType]);
      setCustomFileType('');
    }
  };

  const removeFileType = (typeToRemove: string) => {
    setFileTypes(fileTypes.filter(type => type !== typeToRemove));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">File Upload System</h1>
        <p className="text-muted-foreground text-center mb-8">Upload, validate and download files with customizable constraints</p>

        <div className="grid gap-8">
          <Tabs defaultValue="uploader" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="uploader">File Uploader</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="uploader" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Files</CardTitle>
                  <CardDescription>
                    Upload your files with the current restrictions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FileUploader 
                    maxSizeInMB={maxFileSize}
                    allowedFileTypes={fileTypes}
                    onFileUpload={handleFileUpload}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Settings</CardTitle>
                  <CardDescription>
                    Customize file size limits and allowed file types
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="max-size">Maximum File Size (MB)</Label>
                    <Select
                      value={maxFileSize.toString()}
                      onValueChange={(value) => setMaxFileSize(Number(value))}
                    >
                      <SelectTrigger id="max-size">
                        <SelectValue placeholder="Select maximum file size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 MB</SelectItem>
                        <SelectItem value="5">5 MB</SelectItem>
                        <SelectItem value="10">10 MB</SelectItem>
                        <SelectItem value="20">20 MB</SelectItem>
                        <SelectItem value="50">50 MB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-4">
                    <Label>Allowed File Types</Label>
                    <div className="flex flex-wrap gap-2">
                      {fileTypes.map((type) => (
                        <div 
                          key={type}
                          className="flex items-center bg-primary/10 text-sm rounded-full px-3 py-1"
                        >
                          <span>{type}</span>
                          <button 
                            className="ml-2 text-muted-foreground hover:text-destructive"
                            onClick={() => removeFileType(type)}
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder="Add custom file type (e.g., application/json)"
                          value={customFileType}
                          onChange={(e) => setCustomFileType(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addCustomFileType()}
                        />
                      </div>
                      <button
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                        onClick={addCustomFileType}
                      >
                        Add
                      </button>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mt-2">
                      <p>Common file types examples:</p>
                      <ul className="list-disc list-inside space-y-1 mt-1">
                        <li>Images: image/jpeg, image/png, image/gif</li>
                        <li>Documents: application/pdf, application/msword</li>
                        <li>Data: application/json, text/csv</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;
