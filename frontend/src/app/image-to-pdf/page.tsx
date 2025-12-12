'use client';

import { useState } from 'react';
import FileDropzone from '@/components/common/FileDropzone';
import Button from '@/components/common/Button';
import ProgressBar from '@/components/common/ProgressBar';
import { imagesToPdf, downloadBlob } from '@/lib/pdfUtils';

export default function ImageToPdfPage() {
    const [images, setImages] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'legal' | 'fit'>('a4');
    const [orientation, setOrientation] = useState<'portrait' | 'landscape' | 'auto'>('portrait');
    const [error, setError] = useState<string | null>(null);

    const handleFilesSelect = (files: File[]) => {
        setImages(prev => [...prev, ...files]);
        setError(null);
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const moveImage = (fromIndex: number, direction: 'up' | 'down') => {
        const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
        if (toIndex < 0 || toIndex >= images.length) return;

        const newImages = [...images];
        [newImages[fromIndex], newImages[toIndex]] = [newImages[toIndex], newImages[fromIndex]];
        setImages(newImages);
    };

    const handleConvert = async () => {
        if (images.length === 0) return;

        setIsProcessing(true);
        setProgress(0);
        setError(null);

        try {
            // Simulate progress while converting
            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 15, 85));
            }, 200);

            // Convert images to PDF
            const pdfBlob = await imagesToPdf(images, {
                pageSize,
                orientation,
            });

            clearInterval(progressInterval);
            setProgress(100);

            // Download the PDF
            const filename = `images_${new Date().toISOString().slice(0, 10)}.pdf`;
            downloadBlob(pdfBlob, filename);

            // Reset after short delay
            setTimeout(() => {
                setIsProcessing(false);
                setProgress(0);
            }, 1000);
        } catch (err) {
            console.error('Conversion error:', err);
            setError('Failed to convert images. Please try again.');
            setIsProcessing(false);
            setProgress(0);
        }
    };

    const handleReset = () => {
        setImages([]);
        setProgress(0);
        setError(null);
    };

    return (
        <div className="pt-24 pb-16 min-h-screen">
            <div className="container mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Image to PDF
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Convert JPG, PNG, and other images to a single PDF document instantly.
                    </p>
                </div>

                {/* Main Content */}
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        {images.length === 0 ? (
                            /* Upload Section */
                            <FileDropzone
                                onFilesSelected={handleFilesSelect}
                                accept="image/*"
                                multiple={true}
                                title="Drop your images here"
                                subtitle="or click to browse (JPG, PNG, WEBP)"
                            />
                        ) : (
                            /* Images List & Options */
                            <div>
                                {/* Images List */}
                                <div className="mb-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-gray-900">
                                            Images ({images.length})
                                        </h3>
                                        <button
                                            onClick={() => document.getElementById('add-more-images')?.click()}
                                            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Add more
                                        </button>
                                        <input
                                            id="add-more-images"
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={(e) => {
                                                const files = e.target.files ? Array.from(e.target.files) : [];
                                                handleFilesSelect(files);
                                                e.target.value = '';
                                            }}
                                        />
                                    </div>

                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {images.map((image, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl"
                                            >
                                                <span className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center text-xs font-semibold text-indigo-600">
                                                    {index + 1}
                                                </span>
                                                <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                                                    <img
                                                        src={URL.createObjectURL(image)}
                                                        alt={image.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {image.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {(image.size / 1024).toFixed(1)} KB
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => moveImage(index, 'up')}
                                                        disabled={index === 0}
                                                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => moveImage(index, 'down')}
                                                        disabled={index === images.length - 1}
                                                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => removeImage(index)}
                                                        className="p-1 text-red-400 hover:text-red-600"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Options */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 bg-gray-50 rounded-xl">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Page Size
                                        </label>
                                        <select
                                            value={pageSize}
                                            onChange={(e) => setPageSize(e.target.value as 'a4' | 'letter' | 'legal' | 'fit')}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                        >
                                            <option value="a4">A4 (210 × 297 mm)</option>
                                            <option value="letter">Letter (8.5 × 11 in)</option>
                                            <option value="legal">Legal (8.5 × 14 in)</option>
                                            <option value="fit">Fit to Image</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Orientation
                                        </label>
                                        <select
                                            value={orientation}
                                            onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape' | 'auto')}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                        >
                                            <option value="portrait">Portrait</option>
                                            <option value="landscape">Landscape</option>
                                            <option value="auto">Auto-detect</option>
                                        </select>
                                    </div>
                                </div>

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
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-4">
                                    <Button
                                        variant="ghost"
                                        onClick={handleReset}
                                        disabled={isProcessing}
                                    >
                                        Start Over
                                    </Button>
                                    <Button
                                        variant="primary"
                                        size="large"
                                        onClick={handleConvert}
                                        loading={isProcessing}
                                        className="flex-1"
                                    >
                                        {isProcessing ? 'Converting...' : 'Create PDF'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Multiple Formats</h3>
                            <p className="text-sm text-gray-500">Support for JPG, PNG, WEBP, GIF, and more image formats.</p>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Reorder Pages</h3>
                            <p className="text-sm text-gray-500">Drag and drop to arrange your images in any order.</p>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">High Quality</h3>
                            <p className="text-sm text-gray-500">Preserve original image quality in the final PDF.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
