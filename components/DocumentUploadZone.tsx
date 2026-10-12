import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X, RefreshCw, Loader2 } from 'lucide-react';
import { extractTextFromFile, ParsedDocument } from '../services/documentParser';

interface DocumentUploadZoneProps {
  label: string;
  sublabel?: string;
  acceptTypes?: string;
  onTextExtracted: (doc: ParsedDocument) => void;
  onClear?: () => void;
  className?: string;
}

export const DocumentUploadZone: React.FC<DocumentUploadZoneProps> = ({
  label,
  sublabel = 'PDF, DOCX, DOC, TXT, RTF, ODT (Max 10MB)',
  acceptTypes = '.pdf,.docx,.doc,.txt,.rtf,.odt',
  onTextExtracted,
  onClear,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedDoc, setUploadedDoc] = useState<ParsedDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setIsLoading(true);
    try {
      const doc = await extractTextFromFile(file);
      setUploadedDoc(doc);
      onTextExtracted(doc);
    } catch (err: any) {
      console.error('File parsing error:', err);
      setError(err.message || 'Failed to read file. Please check file format.');
      setUploadedDoc(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setUploadedDoc(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onClear) onClear();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`w-full ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptTypes}
        onChange={handleInputChange}
        className="hidden"
      />

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {uploadedDoc ? (
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-slate-800 truncate" title={uploadedDoc.filename}>
                {uploadedDoc.filename}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span className="font-semibold text-emerald-700">{uploadedDoc.format}</span>
                <span>•</span>
                <span>{formatFileSize(uploadedDoc.fileSize)}</span>
                <span>•</span>
                <span className="text-emerald-600 font-medium">Text Extracted</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg text-xs font-medium flex items-center gap-1 transition"
              title="Replace document"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Replace</span>
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition"
              title="Remove document"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={e => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isLoading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-blue-500 bg-blue-50/60 scale-[1.01]'
              : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/80 bg-slate-50/30'
          }`}
        >
          {isLoading ? (
            <div className="py-2 flex flex-col items-center justify-center gap-2 text-slate-600">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-xs font-semibold">Extracting and validating document text...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-full mb-1">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-800">{label}</p>
              <p className="text-[11px] text-slate-500">{sublabel}</p>
              <span className="mt-1 text-[11px] font-semibold text-blue-600 underline">
                Browse Files
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentUploadZone;
