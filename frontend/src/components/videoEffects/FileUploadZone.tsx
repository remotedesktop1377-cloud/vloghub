import React, { useCallback, useState } from 'react';
import { Upload, File, X, CheckCircle } from 'lucide-react';
import { MediaPlayer } from './MediaPlayer';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface FileUploadZoneProps {
  accept?: string;
  maxSize?: number; // in MB
  onFileUpload: (file: UploadedFile) => void;
  className?: string;
  label?: string;
}

export function FileUploadZone({ 
  accept = "video/*,image/*", 
  maxSize = 100, 
  onFileUpload, 
  className = "",
  label = "Upload File"
}: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const processFile = useCallback(async (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    setIsUploading(true);
    
    // Simulate file upload process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const uploadedFile: UploadedFile = {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file)
    };

    setUploadedFiles(prev => [...prev, uploadedFile]);
    onFileUpload(uploadedFile);
    setIsUploading(false);
  }, [maxSize, onFileUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(processFile);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(processFile);
  }, [processFile]);

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 ${
          isDragOver 
            ? 'border-cyan-400 bg-cyan-500/10' 
            : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
        }`}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          multiple
        />
        
        <div className="flex flex-col items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isDragOver ? 'bg-cyan-500/20' : 'bg-white/10'
          }`}>
            <Upload className={`w-6 h-6 transition-colors ${
              isDragOver ? 'text-cyan-400' : 'text-gray-400'
            }`} />
          </div>
          
          <div>
            <p className="text-white font-medium mb-1">{label}</p>
            <p className="text-gray-400 text-sm">
              Drag & drop files here or click to browse
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Max size: {maxSize}MB
            </p>
          </div>
        </div>

        {isUploading && (
          <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
            <div className="flex items-center gap-2 text-cyan-400">
              <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Uploading...</span>
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-gray-300">Uploaded Files</h5>
          {uploadedFiles.map((file) => (
            <div key={file.id} className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <MediaPlayer
                  src={file.url}
                  type={file.type.startsWith('video') ? 'video' : file.type.startsWith('image') ? 'image' : 'audio'}
                  className="w-full h-full"
                  controls={false}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{file.name}</p>
                <p className="text-gray-400 text-xs">{formatFileSize(file.size)}</p>
              </div>
              <div className="w-4 h-4 bg-green-500/20 rounded flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-green-400" />
              </div>
              <button
                onClick={() => removeFile(file.id)}
                className="p-1 text-gray-400 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}