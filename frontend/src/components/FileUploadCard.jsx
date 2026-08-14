import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
  Eye
} from 'lucide-react';

const FileUploadCard = ({
  id,
  label,
  helperText,
  sublabel,
  docTypes = [],
  selectedDocType,
  onDocTypeChange,
  acceptedFormatsText = "PDF, JPG, PNG, WEBP",
  acceptedMimeTypes = "application/pdf,image/jpeg,image/png,image/webp,image/*,video/*,.pdf,.jpg,.jpeg,.png,.webp",
  maxSizeMB = 10,
  isRequired = false,
  examples = [],
  fileData,
  file,
  onFileChange,
  onFileSelect,
  onFileRemove,
  error
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [localError, setLocalError] = useState('');
  const fileInputRef = useRef(null);

  const activeHelperText = helperText || sublabel;
  const activeFileData = fileData !== undefined ? fileData : file;
  const activeChangeHandler = onFileChange || onFileSelect;

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateAndProcessFile = (uploadFile) => {
    setLocalError('');
    if (!uploadFile) return;

    // Check size
    if (uploadFile.size > maxSizeBytes) {
      setLocalError(`File size exceeds maximum allowed limit of ${maxSizeMB} MB.`);
      return;
    }

    // Check extension / mime type
    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mov', '.avi'];
    const fileName = uploadFile.name.toLowerCase();
    const isValidExt = validExtensions.some(ext => fileName.endsWith(ext));
    const isValidMime = uploadFile.type.startsWith('image/') || uploadFile.type.startsWith('video/') || uploadFile.type === 'application/pdf';

    if (!isValidExt && !isValidMime) {
      setLocalError(`Invalid file format. Please upload ${acceptedFormatsText}.`);
      return;
    }

    // Simulate progress animation
    setUploadProgress(0);
    let current = 0;
    const interval = setInterval(() => {
      current += 25;
      if (current >= 100) {
        clearInterval(interval);
        setUploadProgress(null);

        const isImage = uploadFile.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(uploadFile.name);
        
        if (isImage) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target.result;
            const processedData = {
              name: uploadFile.name,
              size: uploadFile.size,
              type: uploadFile.type,
              isImage: true,
              previewUrl: dataUrl,
              dataUrl: dataUrl,
              fileObj: uploadFile
            };
            if (activeChangeHandler) activeChangeHandler(processedData);
          };
          reader.readAsDataURL(uploadFile);
        } else {
          const processedData = {
            name: uploadFile.name,
            size: uploadFile.size,
            type: uploadFile.type,
            isImage: false,
            previewUrl: null,
            fileObj: uploadFile
          };
          if (activeChangeHandler) activeChangeHandler(processedData);
        }
      } else {
        setUploadProgress(current);
      }
    }, 80);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    if (activeFileData?.previewUrl) {
      URL.revokeObjectURL(activeFileData.previewUrl);
    }
    if (onFileChange) onFileChange(null);
    if (onFileSelect) onFileSelect(null);
    if (onFileRemove) onFileRemove();
    setLocalError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="w-full bg-slate-900/90 rounded-2xl border border-slate-800 p-6 sm:p-7 shadow-lg transition-all duration-200 hover:border-emerald-500/30">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <label className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
            <span>{label}</span>
            {isRequired ? (
              <span className="text-emerald-400 font-extrabold text-base">*</span>
            ) : (
              <span className="text-emerald-300 text-xs font-bold uppercase tracking-wider bg-emerald-950 px-3 py-1 rounded-md border border-emerald-800">
                Optional
              </span>
            )}
          </label>
        </div>
        {activeHelperText && (
          <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed mt-2.5">{activeHelperText}</p>
        )}
      </div>

      {/* Select Document Type Dropdown (If provided e.g. for Govt ID) */}
      {docTypes.length > 0 && (
        <div className="mb-6 mt-2 pt-2">
          <label className="block text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">
            Select Document Type <span className="text-emerald-400">*</span>
          </label>
          <select
            value={selectedDocType || ''}
            onChange={(e) => onDocTypeChange && onDocTypeChange(e.target.value)}
            className="w-full form-input-56 bg-slate-950 border-slate-700 text-white font-semibold text-sm sm:text-base rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm"
          >
            <option value="" disabled className="bg-slate-900 text-slate-400">-- Select Identity Document Type --</option>
            {docTypes.map((type) => (
              <option key={type} value={type} className="bg-slate-900 text-white font-medium">
                {type}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Optional Document Examples List */}
      {examples.length > 0 && (
        <div className="mb-6 mt-2 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-3">
            Recommended Examples:
          </span>
          <div className="flex flex-wrap gap-2">
            {examples.map((ex, idx) => (
              <span
                key={idx}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 text-slate-200 border border-slate-700 inline-flex items-center gap-1.5 shadow-sm"
              >
                <span className="text-emerald-400 font-bold">•</span> {ex}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Upload Zone / Preview Card */}
      {!activeFileData && uploadProgress === null ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer group flex flex-col items-center justify-center ${
            isDragging
              ? 'border-emerald-500 bg-emerald-950/30 scale-[0.99]'
              : 'border-slate-700 hover:border-emerald-500/60 bg-slate-950/60 hover:bg-slate-950/90'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            id={id}
            accept={acceptedMimeTypes}
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-emerald-900/80 transition-all shadow-md">
            <UploadCloud size={24} />
          </div>

          <p className="text-xs sm:text-sm font-bold text-white mb-1">
            <span className="text-emerald-400 underline decoration-emerald-500/50 underline-offset-4 group-hover:text-emerald-300">
              Drag &amp; Drop file here
            </span>{' '}
            or click to browse
          </p>

          <p className="text-xs text-slate-300 mb-3 font-medium">
            Supported formats: <strong className="text-white font-bold">{acceptedFormatsText}</strong> • Max size: <strong className="text-white font-bold">{maxSizeMB} MB</strong>
          </p>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-emerald-600 hover:text-white text-white text-xs font-bold transition-all border border-slate-700 hover:border-emerald-500 shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <UploadCloud size={14} />
            <span>Browse Files</span>
          </button>
        </div>
      ) : uploadProgress !== null ? (
        /* Uploading Progress State */
        <div className="border border-emerald-500/40 rounded-xl p-5 bg-emerald-950/30 text-center">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-300 flex items-center gap-2">
              <UploadCloud size={16} className="animate-bounce text-emerald-400" />
              Processing document upload...
            </span>
            <span className="text-xs font-bold text-emerald-400">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-emerald-900">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-150 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      ) : (
        /* Uploaded File Preview State */
        <div className="border border-emerald-500/40 rounded-xl p-4 bg-slate-950/90 flex items-center justify-between gap-4 shadow-inner">
          <div className="flex items-center gap-3 overflow-hidden">
            {activeFileData?.isImage && activeFileData?.previewUrl ? (
              <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-700 flex-shrink-0 bg-slate-900 group">
                <img
                  src={activeFileData.previewUrl}
                  alt={activeFileData.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Eye size={14} className="text-white" />
                </div>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <FileText size={22} />
              </div>
            )}

            <div className="min-w-0 flex-grow">
              <div className="flex items-center gap-2">
                <p className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-[280px]">
                  {activeFileData?.name || 'Uploaded File'}
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 size={10} />
                  Ready
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">
                {activeFileData?.size ? formatFileSize(activeFileData.size) : 'File'} • {activeFileData?.type || 'Document'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRemoveFile}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all border border-slate-700 hover:border-red-500/40 cursor-pointer"
              title="Remove file"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Error Displays */}
      {(localError || error) && (
        <div className="mt-2.5 p-2.5 rounded-xl bg-red-950/40 border border-red-800/50 flex items-center gap-2 text-red-400 text-xs font-medium">
          <AlertCircle size={15} className="flex-shrink-0" />
          <span>{localError || error}</span>
        </div>
      )}
    </div>
  );
};

export default FileUploadCard;
