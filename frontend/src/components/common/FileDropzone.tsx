'use client';

import { useCallback, useState } from 'react';

interface FileDropzoneProps {
    onFilesSelected: (files: File[]) => void;
    accept?: string;
    multiple?: boolean;
    maxSize?: number; // in MB
    title?: string;
    subtitle?: string;
}

export default function FileDropzone({
    onFilesSelected,
    accept = '.pdf',
    multiple = false,
    maxSize = 50,
    title = 'Drag & drop your file here',
    subtitle = 'or click to browse',
}: FileDropzoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const validateFiles = (files: File[]): boolean => {
        setError(null);

        for (const file of files) {
            // Check size
            if (file.size > maxSize * 1024 * 1024) {
                setError(`File "${file.name}" exceeds ${maxSize}MB limit`);
                return false;
            }
        }

        return true;
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (validateFiles(files)) {
            onFilesSelected(multiple ? files : [files[0]]);
        }
    }, [onFilesSelected, multiple, maxSize]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        if (files.length > 0 && validateFiles(files)) {
            onFilesSelected(files);
        }
        // Reset input
        e.target.value = '';
    }, [onFilesSelected, maxSize]);

    return (
        <div className="w-full">
            <label
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
          flex flex-col items-center justify-center
          w-full min-h-[280px] p-8
          border-2 border-dashed rounded-2xl
          cursor-pointer transition-all duration-200
          ${isDragging
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-gray-50'
                    }
        `}
            >
                <input
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleFileInput}
                    className="hidden"
                />

                {/* Icon */}
                <div className={`
          w-20 h-20 mb-6 rounded-2xl flex items-center justify-center transition-all duration-200
          ${isDragging ? 'bg-indigo-100' : 'bg-gray-100'}
        `}>
                    <svg
                        className={`w-10 h-10 transition-colors ${isDragging ? 'text-indigo-600' : 'text-gray-400'}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                    </svg>
                </div>

                {/* Text */}
                <p className="text-lg font-semibold text-gray-900 mb-1">{title}</p>
                <p className="text-gray-500 mb-4">{subtitle}</p>

                {/* File info */}
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Maximum file size: {maxSize}MB</span>
                </div>
            </label>

            {/* Error message */}
            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}
        </div>
    );
}
