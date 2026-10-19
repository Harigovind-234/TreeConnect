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
  title,
  helperText,
  sublabel,
  description,
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
  selectedFile,
  onFileChange,
  onFileSelect,
  onFileRemove,
  error
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [localError, setLocalError] = useState('');
  const fileInputRef = useRef(null);

  const activeLabel = label || title || '';
  const activeHelperText = helperText || sublabel || description || '';
  const activeFileData = fileData !== undefined ? fileData : (file !== undefined ? file : selectedFile);
  const activeChangeHandler = onFileChange || onFileSelect;

  const normalizedFile = React.useMemo(() => {
    if (!activeFileData) return null;
    if (typeof activeFileData === 'string') {
      const isImg = activeFileData.startsWith('data:image/') || /\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(activeFileData) || activeFileData.includes('unsplash');
      return {
        name: 'Uploaded Photo / Document',
        size: null,
        type: isImg ? 'image/*' : 'document',
        isImage: isImg,
        previewUrl: activeFileData,
        dataUrl: activeFileData
      };
    }
    if (typeof File !== 'undefined' && activeFileData instanceof File && !activeFileData.previewUrl) {
      const isImg = activeFileData.type.startsWith('image/');
      return {
        name: activeFileData.name,
        size: activeFileData.size,
        type: activeFileData.type,
        isImage: isImg,
        previewUrl: isImg ? URL.createObjectURL(activeFileData) : null,
        fileObj: activeFileData
      };
    }
    return activeFileData;
  }, [activeFileData]);

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

  const handleRemoveFile = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (normalizedFile?.previewUrl && typeof normalizedFile.previewUrl === 'string' && normalizedFile.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(normalizedFile.previewUrl);
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
    if (!bytes || isNaN(bytes)) return 'File ready';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const hasError = Boolean(localError || error);

  return (
    <div
      className={`w-full rounded-2xl p-6 sm:p-7 shadow-lg transition-all duration-200 ${
        hasError
          ? 'bg-gradient-to-b from-[#180d11] to-[#0e1612] border-2 border-rose-500/70 shadow-[0_0_30px_rgba(244,63,94,0.18)] ring-1 ring-rose-500/40'
          : 'bg-[#0e1612] border border-emerald-500/15 hover:border-emerald-500/35'
      }`}
    >
      {/* Header Section */}
      {(activeLabel || activeHelperText) && (
        <div className="mb-5">
          {activeLabel && (
            <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
              <label className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                <span className={hasError ? 'text-rose-100' : 'text-white'}>{activeLabel}</span>
                {isRequired ? (
                  <span className={`${hasError ? 'text-rose-400' : 'text-emerald-400'} font-extrabold text-base`}>
                    *
                  </span>
                ) : (
                  <span className="text-emerald-300 text-xs font-bold uppercase tracking-wider bg-emerald-500/15 px-3 py-1 rounded-md border border-emerald-500/30">
                    Optional
                  </span>
                )}
              </label>

              {hasError && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                  <AlertCircle size={13} />
                  <span>Document Required</span>
                </span>
              )}
            </div>
          )}
          {activeHelperText && (
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed mt-1.5">{activeHelperText}</p>
          )}
        </div>
      )}

      {/* Select Document Type Dropdown (If provided e.g. for Govt ID) */}
      {docTypes.length > 0 && (
        <div className="mb-5 pt-3 border-t border-slate-800/60">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Select Document Type <span className={hasError ? 'text-rose-400' : 'text-emerald-400'}>*</span>
          </label>
          <select
            value={selectedDocType || ''}
            onChange={(e) => onDocTypeChange && onDocTypeChange(e.target.value)}
            className={`w-full form-input-56 text-white font-semibold text-sm rounded-xl shadow-sm transition-all ${
              hasError && !selectedDocType
                ? 'bg-rose-950/20 border-2 border-rose-500/80 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/30'
                : 'bg-[#0a0f0d] border border-emerald-500/20 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
            }`}
          >
            <option value="" disabled className="bg-[#0a0f0d] text-slate-400">
              -- Select Identity Document Type --
            </option>
            {docTypes.map((type) => (
              <option key={type} value={type} className="bg-[#0a0f0d] text-white font-medium">
                {type}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Optional Document Examples List */}
      {examples.length > 0 && (
        <div className="mb-5 p-3.5 sm:p-4 rounded-xl bg-[#0a0f0d] border border-emerald-500/15">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-2">
            Recommended Examples:
          </span>
          <div className="flex flex-wrap gap-2">
            {examples.map((ex, idx) => (
              <span
                key={idx}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#18241e] text-slate-200 border border-emerald-500/20 inline-flex items-center gap-1.5 shadow-sm"
              >
                <span className="text-emerald-400 font-bold">•</span> {ex}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Upload Zone / Preview Card */}
      {!normalizedFile && uploadProgress === null ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer group flex flex-col items-center justify-center ${
            hasError
              ? 'border-rose-500/80 bg-rose-500/5 hover:border-rose-400 hover:bg-rose-500/10'
              : isDragging
              ? 'border-emerald-500 bg-emerald-500/15 scale-[0.99]'
              : 'border-emerald-500/25 hover:border-emerald-500/60 bg-[#0a0f0d] hover:bg-[#0e1612]'
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

          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-all shadow-md ${
              hasError
                ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300'
                : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 group-hover:bg-emerald-500/25'
            }`}
          >
            <UploadCloud size={24} />
          </div>

          <p className="text-xs sm:text-sm font-bold text-white mb-1">
            <span
              className={
                hasError
                  ? 'text-rose-400 underline decoration-rose-500/50 underline-offset-4 group-hover:text-rose-300'
                  : 'text-emerald-400 underline decoration-emerald-500/50 underline-offset-4 group-hover:text-emerald-300'
              }
            >
              Drag &amp; Drop file here
            </span>{' '}
            or click to browse
          </p>

          <p className="text-xs text-slate-300 mb-3 font-medium">
            Supported formats: <strong className="text-white font-bold">{acceptedFormatsText}</strong> • Max size:{' '}
            <strong className="text-white font-bold">{maxSizeMB} MB</strong>
          </p>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm flex items-center gap-2 cursor-pointer ${
              hasError
                ? 'bg-rose-950/70 hover:bg-rose-500 hover:text-white text-rose-200 border-rose-500/40'
                : 'bg-[#18241e] hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 border-emerald-500/30'
            }`}
          >
            <UploadCloud size={14} />
            <span>Browse Files</span>
          </button>
        </div>
      ) : uploadProgress !== null ? (
        /* Uploading Progress State */
        <div className="border border-emerald-500/40 rounded-xl p-5 bg-emerald-500/10 text-center">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-300 flex items-center gap-2">
              <UploadCloud size={16} className="animate-bounce text-emerald-400" />
              Processing document upload...
            </span>
            <span className="text-xs font-bold text-emerald-400">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-[#0a0f0d] rounded-full h-2 overflow-hidden border border-emerald-500/20">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-150 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      ) : (
        /* Uploaded File Preview State */
        <div className="border border-emerald-500/30 rounded-xl p-4 bg-[#0a0f0d] flex items-center justify-between gap-4 shadow-inner">
          <div className="flex items-center gap-3 overflow-hidden">
            {normalizedFile?.isImage && normalizedFile?.previewUrl ? (
              <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-emerald-500/30 flex-shrink-0 bg-[#0e1612] group">
                <img
                  src={normalizedFile.previewUrl}
                  alt={normalizedFile.name || 'Uploaded File'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                  <Eye size={16} className="text-white" />
                </div>
              </div>
            ) : (
              <div className="w-14 h-14 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <FileText size={24} />
              </div>
            )}

            <div className="min-w-0 flex-grow">
              <div className="flex items-center gap-2">
                <p className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-[280px]">
                  {normalizedFile?.name || 'Uploaded File'}
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 size={10} />
                  Ready
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">
                {normalizedFile?.size ? formatFileSize(normalizedFile.size) : 'File ready'} •{' '}
                {normalizedFile?.type || 'Document'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRemoveFile}
              className="p-2.5 rounded-lg bg-[#18241e] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all border border-emerald-500/20 hover:border-rose-500/40 cursor-pointer"
              title="Remove file"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Error Displays with Distinct Inline Alert */}
      {hasError && (
        <div className="mt-3.5 p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/50 flex items-center gap-3 text-rose-200 text-xs font-semibold shadow-md animate-in fade-in duration-200">
          <div className="w-6 h-6 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center flex-shrink-0">
            <AlertCircle size={14} />
          </div>
          <span className="leading-relaxed">{localError || error}</span>
        </div>
      )}
    </div>
  );
};

export default FileUploadCard;
