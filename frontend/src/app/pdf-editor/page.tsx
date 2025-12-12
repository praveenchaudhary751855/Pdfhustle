'use client';

import { useState, useRef, useEffect } from 'react';
import FileDropzone from '@/components/common/FileDropzone';
import Button from '@/components/common/Button';
import {
    TextAnnotation,
    loadPdfInfo,
    renderPdfPage,
    savePdfWithAnnotations,
    downloadPdf,
    generateId,
    PageInfo,
} from '@/lib/pdfEditor';
import {
    compressPdf,
    downloadProcessedPdf,
    ILovePDFResponse,
} from '@/lib/ilovepdfService';

type Tool = 'select' | 'text';
type EditorMode = 'edit' | 'compress';

export default function PdfEditorPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [pages, setPages] = useState<PageInfo[]>([]);
    const [scale, setScale] = useState(1.5);
    const [activeTool, setActiveTool] = useState<Tool>('text');
    const [annotations, setAnnotations] = useState<TextAnnotation[]>([]);
    const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
    const [textColor, setTextColor] = useState('#000000');
    const [fontSize, setFontSize] = useState(16);

    // Mode and compression state
    const [editorMode, setEditorMode] = useState<EditorMode>('edit');
    const [compressionLevel, setCompressionLevel] = useState<'extreme' | 'recommended' | 'low'>('recommended');
    const [compressionResult, setCompressionResult] = useState<ILovePDFResponse | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (file && editorMode === 'edit') {
            loadPdf();
        }
    }, [file, editorMode]);

    useEffect(() => {
        if (file && canvasRef.current && editorMode === 'edit') {
            renderPage();
        }
    }, [file, currentPage, scale, editorMode]);

    const loadPdf = async () => {
        if (!file) return;
        setIsLoading(true);
        try {
            const info = await loadPdfInfo(file);
            setTotalPages(info.pageCount);
            setPages(info.pages);
            setCurrentPage(1);
        } catch (error) {
            console.error('Error loading PDF:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderPage = async () => {
        if (!file || !canvasRef.current) return;
        setIsLoading(true);
        try {
            await renderPdfPage(file, currentPage, canvasRef.current, scale);
        } catch (error) {
            console.error('Error rendering page:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileSelect = async (files: File[]) => {
        if (files.length > 0) {
            const selectedFile = files[0];
            setFile(selectedFile);
            setAnnotations([]);
            setSelectedAnnotation(null);
            setCompressionResult(null);
        }
    };

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (activeTool !== 'text' || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        const newAnnotation: TextAnnotation = {
            id: generateId(),
            text: 'Edit this text',
            x: x,
            y: y,
            fontSize: fontSize / scale,
            color: textColor,
            pageNumber: currentPage,
        };

        setAnnotations(prev => [...prev, newAnnotation]);
        setSelectedAnnotation(newAnnotation.id);
    };

    const handleAnnotationChange = (id: string, newText: string) => {
        setAnnotations(prev =>
            prev.map(ann => (ann.id === id ? { ...ann, text: newText } : ann))
        );
    };

    const handleAnnotationDelete = (id: string) => {
        setAnnotations(prev => prev.filter(ann => ann.id !== id));
        if (selectedAnnotation === id) {
            setSelectedAnnotation(null);
        }
    };

    const handleDownload = async () => {
        if (!file) return;

        setIsProcessing(true);
        try {
            if (editorMode === 'compress' && compressionResult?.sessionId) {
                await downloadProcessedPdf(compressionResult.sessionId, `compressed_${file.name}`);
            } else {
                const editedPdf = await savePdfWithAnnotations(file, annotations);
                downloadPdf(editedPdf, `edited_${file.name}`);
            }
        } catch (error) {
            console.error('Error saving PDF:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCompress = async () => {
        if (!file) return;

        setIsProcessing(true);
        try {
            const result = await compressPdf(file, compressionLevel);
            setCompressionResult(result);
        } catch (error) {
            console.error('Error compressing PDF:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setAnnotations([]);
        setSelectedAnnotation(null);
        setCurrentPage(1);
        setTotalPages(0);
        setCompressionResult(null);
    };

    const currentPageAnnotations = annotations.filter(ann => ann.pageNumber === currentPage);

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    return (
        <div className="pt-24 pb-16 min-h-screen">
            <div className="container mx-auto px-6">
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">PDF Editor</h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Edit, annotate, and compress your PDFs directly in your browser.
                    </p>
                </div>

                <div className="max-w-6xl mx-auto">
                    {!file ? (
                        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">Choose Action</label>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setEditorMode('edit')}
                                        className={`flex-1 p-4 rounded-xl border-2 transition-all ${editorMode === 'edit' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
                                    >
                                        <div className="text-left">
                                            <div className="font-semibold text-gray-900 flex items-center gap-2">
                                                ✏️ Edit PDF
                                            </div>
                                            <div className="text-sm text-gray-500 mt-1">Add text annotations</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setEditorMode('compress')}
                                        className={`flex-1 p-4 rounded-xl border-2 transition-all ${editorMode === 'compress' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
                                    >
                                        <div className="text-left">
                                            <div className="font-semibold text-gray-900 flex items-center gap-2">
                                                📦 Compress PDF
                                                <span className="px-2 py-0.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs rounded-full">ILovePDF</span>
                                            </div>
                                            <div className="text-sm text-gray-500 mt-1">Reduce file size</div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                            <FileDropzone onFilesSelected={handleFileSelect} accept=".pdf" title="Drop your PDF here" subtitle="or click to browse" />
                        </div>
                    ) : editorMode === 'compress' ? (
                        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 mx-auto mb-4 bg-rose-100 rounded-full flex items-center justify-center">
                                    <span className="text-3xl">📦</span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Compress PDF</h2>
                                <p className="text-gray-600 mt-2">{file.name}</p>
                                <p className="text-sm text-gray-500">Original size: {formatFileSize(file.size)}</p>
                            </div>

                            {!compressionResult ? (
                                <>
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-3">Compression Level</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {(['low', 'recommended', 'extreme'] as const).map(level => (
                                                <button
                                                    key={level}
                                                    onClick={() => setCompressionLevel(level)}
                                                    className={`p-3 rounded-lg border-2 text-center transition-all ${compressionLevel === level ? 'border-rose-500 bg-rose-50' : 'border-gray-200 hover:border-rose-300'}`}
                                                >
                                                    <div className="font-medium capitalize">{level}</div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {level === 'low' && 'Best quality'}
                                                        {level === 'recommended' && 'Balanced'}
                                                        {level === 'extreme' && 'Smallest size'}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button variant="outline" onClick={handleReset} className="flex-1">Cancel</Button>
                                        <Button variant="primary" onClick={handleCompress} loading={isProcessing} className="flex-1">
                                            {isProcessing ? 'Compressing...' : 'Compress PDF'}
                                        </Button>
                                    </div>
                                </>
                            ) : compressionResult.success ? (
                                <div className="text-center">
                                    <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-4xl">✅</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-green-600 mb-2">Compression Complete!</h3>
                                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-500">Original:</span>
                                                <div className="font-semibold">{formatFileSize(compressionResult.originalSize || 0)}</div>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Compressed:</span>
                                                <div className="font-semibold text-green-600">{formatFileSize(compressionResult.compressedSize || 0)}</div>
                                            </div>
                                        </div>
                                        <div className="mt-3 text-center">
                                            <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                                {compressionResult.reduction} smaller
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button variant="outline" onClick={handleReset} className="flex-1">New File</Button>
                                        <Button variant="primary" onClick={handleDownload} className="flex-1">Download</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                                        <span className="text-4xl">❌</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-red-600 mb-2">Compression Failed</h3>
                                    <p className="text-gray-600 mb-4">{compressionResult.error}</p>
                                    <div className="flex gap-3">
                                        <Button variant="outline" onClick={handleReset} className="flex-1">Try Again</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            <div className="flex flex-wrap items-center justify-between p-4 border-b border-gray-100 bg-gray-50 gap-4">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setActiveTool('select')} className={`toolbar-btn ${activeTool === 'select' ? 'bg-indigo-100 text-indigo-600' : ''}`} title="Select">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                                    </button>
                                    <button onClick={() => setActiveTool('text')} className={`toolbar-btn ${activeTool === 'text' ? 'bg-indigo-100 text-indigo-600' : ''}`} title="Add Text">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </button>
                                    <div className="h-6 w-px bg-gray-300 mx-2" />
                                    <select value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="px-2 py-1 rounded border border-gray-200 text-sm">
                                        {[12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map(size => (<option key={size} value={size}>{size}px</option>))}
                                    </select>
                                    <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" title="Text Color" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-2">
                                        <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))} className="p-1 hover:bg-gray-100 rounded">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                                        </button>
                                        <span className="text-sm font-medium min-w-[50px] text-center">{Math.round(scale * 100)}%</span>
                                        <button onClick={() => setScale(s => Math.min(3, s + 0.25))} className="p-1 hover:bg-gray-100 rounded">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                        </button>
                                    </div>
                                    <button onClick={handleReset} className="text-gray-600 hover:text-gray-900 font-medium text-sm">Replace PDF</button>
                                </div>
                            </div>

                            <div className="flex">
                                <div className="w-24 bg-gray-100 border-r border-gray-200 p-2 min-h-[600px] hidden md:block overflow-y-auto max-h-[600px]">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                                        <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-full mb-2 rounded-lg p-1 transition-all ${currentPage === pageNum ? 'bg-white border-2 border-indigo-500' : 'bg-white border border-gray-200 hover:border-indigo-300'}`}>
                                            <div className="aspect-[3/4] bg-gray-50 rounded flex items-center justify-center text-xs text-gray-500 font-medium">{pageNum}</div>
                                        </button>
                                    ))}
                                </div>
                                <div ref={containerRef} className="flex-1 p-4 min-h-[600px] bg-gray-100 overflow-auto">
                                    {isLoading && (<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" /></div>)}
                                    <div className="relative inline-block mx-auto" style={{ display: isLoading ? 'none' : 'block' }}>
                                        <canvas ref={canvasRef} onClick={handleCanvasClick} className={`shadow-lg ${activeTool === 'text' ? 'cursor-text' : 'cursor-default'}`} style={{ background: 'white' }} />
                                        {currentPageAnnotations.map(annotation => (
                                            <div key={annotation.id} className={`absolute ${selectedAnnotation === annotation.id ? 'ring-2 ring-indigo-500' : ''}`} style={{ left: annotation.x * scale, top: annotation.y * scale }} onClick={(e) => { e.stopPropagation(); setSelectedAnnotation(annotation.id); }}>
                                                <input type="text" value={annotation.text} onChange={(e) => handleAnnotationChange(annotation.id, e.target.value)} className="bg-transparent border-none outline-none" style={{ color: annotation.color, fontSize: annotation.fontSize * scale, fontFamily: 'Helvetica, Arial, sans-serif', minWidth: '100px' }} />
                                                {selectedAnnotation === annotation.id && (<button onClick={(e) => { e.stopPropagation(); handleAnnotationDelete(annotation.id); }} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">×</button>)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-center gap-4">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="p-2 rounded hover:bg-gray-200 disabled:opacity-30">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="p-2 rounded hover:bg-gray-200 disabled:opacity-30">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>

                            <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center">
                                <div className="text-sm text-gray-500">
                                    <span className="font-medium">{file.name}</span>
                                    <span className="mx-2">•</span>
                                    <span>{annotations.length} annotation{annotations.length !== 1 ? 's' : ''}</span>
                                </div>
                                <Button variant="primary" size="large" onClick={handleDownload} loading={isProcessing}>{isProcessing ? 'Saving...' : 'Download Edited PDF'}</Button>
                            </div>
                        </div>
                    )}

                    {file && editorMode === 'edit' && (
                        <div className="mt-8 p-6 bg-indigo-50 rounded-xl">
                            <h3 className="font-semibold text-indigo-900 mb-3">How to Edit:</h3>
                            <ol className="list-decimal list-inside space-y-2 text-indigo-800 text-sm">
                                <li>Select the <strong>Text Tool</strong> from the toolbar</li>
                                <li><strong>Click anywhere</strong> on the PDF to add text</li>
                                <li>Edit or delete text as needed</li>
                                <li>Click <strong>Download Edited PDF</strong> to save</li>
                            </ol>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
