import React, { useCallback, useState } from 'react';
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateAndUpload = (file: File) => {
    setError(null);
    if (file.type !== 'application/pdf') {
      setError("Please upload a valid PDF file.");
      return;
    }
    // Limit size if necessary (e.g., 20MB)
    if (file.size > 20 * 1024 * 1024) {
        setError("File size exceeds 20MB limit.");
        return;
    }
    onFileUpload(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  }, [onFileUpload]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndUpload(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4">
      <div 
        className={`relative group flex flex-col items-center justify-center w-full h-80 border-2 border-dashed rounded-3xl transition-all duration-300 ease-in-out
          ${dragActive ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02]' : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50'}
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            {isProcessing ? (
                <>
                    <Loader2 className="w-12 h-12 mb-4 text-indigo-600 animate-spin" />
                    <p className="text-lg font-medium text-slate-700">Reading Document...</p>
                    <p className="text-sm text-slate-500 mt-2">Extracting text for analysis</p>
                </>
            ) : (
                <>
                    <div className="w-16 h-16 mb-4 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                        <Upload className="w-8 h-8 text-indigo-600" />
                    </div>
                    <p className="mb-2 text-lg text-slate-700 font-medium">
                        <span className="font-bold text-indigo-600">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-sm text-slate-500">PDF files only (max 20MB)</p>
                </>
            )}
        </div>
        <input 
          id="dropzone-file" 
          type="file" 
          className="absolute w-full h-full opacity-0 cursor-pointer" 
          onChange={handleChange}
          accept="application/pdf"
          disabled={isProcessing}
        />
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-600 text-sm animate-fade-in">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
        </div>
      )}

      {/* Feature hints */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">Upload PDF</h3>
            <p className="text-xs text-slate-500">Drag & drop any PDF document to get started instantly.</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">Ask Questions</h3>
            <p className="text-xs text-slate-500">Chat naturally with your document to find specific information.</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">Instant Insights</h3>
            <p className="text-xs text-slate-500">Get summaries and extract key points in seconds.</p>
          </div>
      </div>
    </div>
  );
};

export default FileUpload;
