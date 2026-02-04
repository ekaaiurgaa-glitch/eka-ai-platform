import React, { useState, useRef, useCallback, useEffect } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File, previewUrl: string) => void;
  onUploadComplete?: (fileUrl: string) => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
  disabled?: boolean;
}

interface UploadState {
  isDragging: boolean;
  isUploading: boolean;
  progress: number;
  error: string | null;
  preview: string | null;
  fileName: string | null;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onUploadComplete,
  accept = 'image/*,video/*',
  maxSizeMB = 2,
  className = '',
  disabled = false,
}) => {
  const [state, setState] = useState<UploadState>({
    isDragging: false,
    isUploading: false,
    progress: 0,
    error: null,
    preview: null,
    fileName: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup upload interval on unmount
  useEffect(() => {
    return () => {
      if (uploadIntervalRef.current) {
        clearInterval(uploadIntervalRef.current);
      }
    };
  }, []);

  // Compress image client-side
  const compressImage = useCallback(async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/')) return file;
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          
          // Max dimensions
          const maxDim = 1920;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = (height / width) * maxDim;
              width = maxDim;
            } else {
              width = (width / height) * maxDim;
              height = maxDim;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            0.8
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const processFile = useCallback(async (file: File) => {
    setState(prev => ({ ...prev, error: null }));

    // Validate file size
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      // Try to compress if it's an image
      if (file.type.startsWith('image/')) {
        const compressed = await compressImage(file);
        if (compressed.size > maxBytes) {
          setState(prev => ({
            ...prev,
            error: `File too large. Max ${maxSizeMB}MB after compression.`,
          }));
          return;
        }
        file = compressed;
      } else {
        setState(prev => ({
          ...prev,
          error: `File too large. Max ${maxSizeMB}MB.`,
        }));
        return;
      }
    } else if (file.type.startsWith('image/')) {
      // Compress even if under size limit
      file = await compressImage(file);
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setState(prev => ({
      ...prev,
      preview: previewUrl,
      fileName: file.name,
    }));

    onFileSelect(file, previewUrl);

    // Simulate upload progress (in real implementation, this would be actual upload)
    setState(prev => ({ ...prev, isUploading: true, progress: 0 }));
    
    // Clear any existing interval
    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current);
    }
    
    let progress = 0;
    uploadIntervalRef.current = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        if (uploadIntervalRef.current) {
          clearInterval(uploadIntervalRef.current);
          uploadIntervalRef.current = null;
        }
        setState(prev => ({ ...prev, isUploading: false, progress: 100 }));
        onUploadComplete?.(previewUrl);
      } else {
        setState(prev => ({ ...prev, progress }));
      }
    }, 200);
  }, [maxSizeMB, compressImage, onFileSelect, onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState(prev => ({ ...prev, isDragging: false }));

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [disabled, processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setState(prev => ({ ...prev, isDragging: true }));
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState(prev => ({ ...prev, isDragging: false }));
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleClick = () => {
    if (!disabled) fileInputRef.current?.click();
  };

  const clearFile = useCallback(() => {
    if (state.preview) URL.revokeObjectURL(state.preview);
    setState({
      isDragging: false,
      isUploading: false,
      progress: 0,
      error: null,
      preview: null,
      fileName: null,
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [state.preview]);

  return (
    <div className={`${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
      />

      {state.preview ? (
        // Preview state
        <div className="bg-[#0a0a0a] border-2 border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            {state.preview && (
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 flex-shrink-0">
                <img 
                  src={state.preview} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-white font-mono truncate">
                {state.fileName}
              </p>
              {state.isUploading ? (
                <div className="mt-2">
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#f18a22] transition-all duration-200 rounded-full"
                      style={{ width: `${state.progress}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-zinc-500 font-mono mt-1">
                    Uploading... {Math.round(state.progress)}%
                  </p>
                </div>
              ) : (
                <p className="text-[9px] text-green-500 font-mono mt-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Upload complete
                </p>
              )}
            </div>
            <button
              onClick={clearFile}
              className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
              title="Remove file"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        // Upload zone
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
            ${disabled ? 'opacity-50 cursor-not-allowed border-zinc-800 bg-zinc-900/50' : ''}
            ${state.isDragging 
              ? 'border-[#f18a22] bg-[#f18a22]/5 scale-[1.02]' 
              : 'border-zinc-800 hover:border-zinc-700 bg-[#0a0a0a]'
            }
          `}
        >
          <div className="flex flex-col items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              state.isDragging ? 'bg-[#f18a22]/20 text-[#f18a22]' : 'bg-zinc-800 text-zinc-500'
            }`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold text-zinc-400 font-mono">
                {state.isDragging ? 'Drop file here' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-[9px] text-zinc-600 font-mono mt-1">
                Images/Video • Max {maxSizeMB}MB
              </p>
            </div>
          </div>

          {state.error && (
            <div className="mt-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-[10px] text-red-500 font-mono">{state.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
