'use client';

import { useState, useRef } from 'react';
import FileDropzone from '@/components/common/FileDropzone';
import Button from '@/components/common/Button';
import ProgressBar from '@/components/common/ProgressBar';
import { pdfToWord, downloadWord } from '@/lib/pdfToWord';

export default function PdfToWordPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [downloadReady, setDownloadReady] = useState(false);
    const [keepFormatting, setKeepFormatting] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pageCount, setPageCount] = useState<number>(0);
    const convertedBlobRef = useRef<Blob | null>(null);

    const handleFileSelect = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            setDownloadReady(false);
            setProgress(0);
            setError(null);
            convertedBlobRef.current = null;
        }
    };

    const handleConvert = async () => {
        if (!file) return;

        setIsProcessing(true);
        setProgress(0);
        setError(null);

        try {
            // Simulate progress while converting
            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 10, 85));
            }, 300);

            // Convert PDF to Word
            const result = await pdfToWord(file, { preserveFormatting: keepFormatting });

            clearInterval(progressInterval);

            if (result.success && result.blob) {
                setProgress(100);
                convertedBlobRef.current = result.blob;
                setPageCount(result.pageCount || 0);
                setDownloadReady(true);
            } else {
                throw new Error(result.error || 'Conversion failed');
            }
        } catch (err) {
            console.error('Conversion error:', err);
            setError(err instanceof Error ? err.message : 'Failed to convert PDF');
            setProgress(0);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (convertedBlobRef.current && file) {
            const wordFilename = file.name.replace(/\.pdf$/i, '.docx');
            downloadWord(convertedBlobRef.current, wordFilename);
        }
    };

    const handleReset = () => {
        setFile(null);
        setProgress(0);
        setDownloadReady(false);
        setError(null);
        convertedBlobRef.current = null;
    };

    return (
        <div className="pt-24 pb-16 min-h-screen">
            <div className="container mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        PDF to Word
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Convert PDF files to editable Word documents (.docx) with preserved formatting.
                    </p>
                </div>

                {/* Main Content */}
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        {!file ? (
                            /* Upload Section */
                            <FileDropzone
                                onFilesSelected={handleFileSelect}
                                accept=".pdf"
                                title="Drop your PDF here"
                                subtitle="or click to browse"
                            />
                        ) : (
                            /* File Info & Conversion */
                            <div>
                                {/* File Info */}
                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-6">
                                    <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
                                        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">{file.name}</p>
                                        <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                    {!isProcessing && !downloadReady && (
                                        <button
                                            onClick={handleReset}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                {/* Conversion Arrow */}
                                <div className="flex items-center justify-center gap-4 my-8">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg">
                                        <span className="font-medium text-red-600">PDF</span>
                                    </div>
                                    <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
                                        <span className="font-medium text-blue-600">DOCX</span>
                                    </div>
                                </div>

                                {/* Options */}
                                {!isProcessing && !downloadReady && (
                                    <div className="p-4 bg-gray-50 rounded-xl mb-6">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={keepFormatting}
                                                onChange={(e) => setKeepFormatting(e.target.checked)}
                                                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <div>
                                                <span className="font-medium text-gray-900">Preserve formatting</span>
                                                <p className="text-sm text-gray-500">Keep original layout, fonts, and styles</p>
                                            </div>
                                        </label>
                                    </div>
                                )}

                                {/* Error */}
                                {error && (
                                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Progress */}
                                {isProcessing && (
                                    <div className="mb-8">
                                        <ProgressBar progress={progress} />
                                        <p className="text-center text-sm text-gray-500 mt-2">
                                            Converting your PDF to Word...
                                        </p>
                                    </div>
                                )}

                                {/* Success State */}
                                {downloadReady && file && (
                                    <div className="text-center mb-8 p-8 bg-green-50 rounded-xl">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Conversion Complete!</h3>
                                        <p className="text-gray-600 mb-2">Your Word document is ready for download.</p>
                                        {pageCount > 0 && (
                                            <p className="text-sm text-gray-500 mb-2">{pageCount} page{pageCount > 1 ? 's' : ''} converted</p>
                                        )}
                                        <p className="text-sm font-medium text-gray-700">
                                            {file.name.replace('.pdf', '.docx')}
                                        </p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-4">
                                    {!downloadReady ? (
                                        <>
                                            <Button
                                                variant="ghost"
                                                onClick={handleReset}
                                                disabled={isProcessing}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                variant="primary"
                                                size="large"
                                                onClick={handleConvert}
                                                loading={isProcessing}
                                                className="flex-1"
                                            >
                                                {isProcessing ? 'Converting...' : 'Convert to Word'}
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                variant="ghost"
                                                onClick={handleReset}
                                            >
                                                Convert Another
                                            </Button>
                                            <Button
                                                variant="primary"
                                                size="large"
                                                onClick={handleDownload}
                                                className="flex-1"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                Download Word File
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Editable Output</h3>
                            <p className="text-sm text-gray-500">Get fully editable Word documents you can modify.</p>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Layout Preserved</h3>
                            <p className="text-sm text-gray-500">Maintain original document structure and formatting.</p>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Fast Conversion</h3>
                            <p className="text-sm text-gray-500">Convert most PDFs in just a few seconds.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
