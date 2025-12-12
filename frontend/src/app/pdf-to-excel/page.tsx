'use client';

import { useState, useRef } from 'react';
import FileDropzone from '@/components/common/FileDropzone';
import Button from '@/components/common/Button';
import ProgressBar from '@/components/common/ProgressBar';
import { pdfToExcel, downloadExcel } from '@/lib/pdfToExcel';

export default function PdfToExcelPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [downloadReady, setDownloadReady] = useState(false);
    const [pageRange, setPageRange] = useState('all');
    const [customRange, setCustomRange] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [tableCount, setTableCount] = useState<number>(0);
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
                setProgress(prev => Math.min(prev + 8, 85));
            }, 400);

            // Convert PDF to Excel
            const result = await pdfToExcel(file, {
                pageRange: pageRange as 'all' | 'custom',
                customPages: customRange
            });

            clearInterval(progressInterval);

            if (result.success && result.blob) {
                setProgress(100);
                convertedBlobRef.current = result.blob;
                setTableCount(result.tableCount || 0);
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
            const excelFilename = file.name.replace(/\.pdf$/i, '.xlsx');
            downloadExcel(convertedBlobRef.current, excelFilename);
        }
    };

    const handleReset = () => {
        setFile(null);
        setProgress(0);
        setDownloadReady(false);
        setPageRange('all');
        setCustomRange('');
        setError(null);
        convertedBlobRef.current = null;
    };

    return (
        <div className="pt-24 pb-16 min-h-screen">
            <div className="container mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        PDF to Excel
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Extract tables from PDF and convert to editable Excel spreadsheets (.xlsx).
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
                                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg">
                                        <span className="font-medium text-green-600">XLSX</span>
                                    </div>
                                </div>

                                {/* Options */}
                                {!isProcessing && !downloadReady && (
                                    <div className="p-6 bg-gray-50 rounded-xl mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Pages to Convert
                                        </label>
                                        <div className="space-y-3">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="pageRange"
                                                    value="all"
                                                    checked={pageRange === 'all'}
                                                    onChange={(e) => setPageRange(e.target.value)}
                                                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="text-gray-900">All pages</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="pageRange"
                                                    value="custom"
                                                    checked={pageRange === 'custom'}
                                                    onChange={(e) => setPageRange(e.target.value)}
                                                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="text-gray-900">Specific pages</span>
                                            </label>
                                            {pageRange === 'custom' && (
                                                <input
                                                    type="text"
                                                    value={customRange}
                                                    onChange={(e) => setCustomRange(e.target.value)}
                                                    placeholder="e.g., 1-3, 5, 7-9"
                                                    className="ml-7 px-4 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                                />
                                            )}
                                        </div>
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
                                            Extracting tables from your PDF...
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
                                        <p className="text-gray-600 mb-2">Your Excel spreadsheet is ready for download.</p>
                                        {tableCount > 0 && (
                                            <p className="text-sm text-gray-500 mb-2">{tableCount} sheet{tableCount > 1 ? 's' : ''} created</p>
                                        )}
                                        <p className="text-sm font-medium text-gray-700">
                                            {file.name.replace('.pdf', '.xlsx')}
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
                                                {isProcessing ? 'Extracting Tables...' : 'Convert to Excel'}
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
                                                Download Excel File
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
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Table Detection</h3>
                            <p className="text-sm text-gray-500">Automatically detects and extracts tables from your PDF.</p>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Data Accuracy</h3>
                            <p className="text-sm text-gray-500">Precise extraction maintains your data integrity.</p>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Multiple Sheets</h3>
                            <p className="text-sm text-gray-500">Tables from different pages become separate sheets.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
