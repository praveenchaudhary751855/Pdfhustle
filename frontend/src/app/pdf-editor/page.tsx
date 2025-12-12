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
    createZohoSession,
    checkSaveStatus,
    downloadEditedPdf,
    ZohoSessionResponse,
} from '@/lib/zohoEditor';

type Tool = 'select' | 'text';
type EditorMode = 'basic' | 'advanced';

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

    // Editor mode and Zoho state
    const [editorMode, setEditorMode] = useState<EditorMode>('basic');
    const [zohoSession, setZohoSession] = useState<ZohoSessionResponse | null>(null);
    const [zohoError, setZohoError] = useState<string | null>(null);
    const [isSaved, setIsSaved] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const saveCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (file && editorMode === 'basic') {
            loadPdf();
        }
    }, [file, editorMode]);

    useEffect(() => {
        if (file && canvasRef.current && editorMode === 'basic') {
            renderPage();
        }
    }, [file, currentPage, scale, editorMode]);

    useEffect(() => {
        return () => {
            if (saveCheckIntervalRef.current) {
                clearInterval(saveCheckIntervalRef.current);
            }
        };
    }, []);

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
            setZohoError(null);
            setIsSaved(false);

            if (editorMode === 'advanced') {
                await initializeZohoEditor(selectedFile);
            }
        }
    };

    const initializeZohoEditor = async (pdfFile: File) => {
        setIsLoading(true);
        setZohoError(null);

        try {
            const response = await createZohoSession(pdfFile);

            if (response.success && response.editorUrl) {
                setZohoSession(response);
                startSaveStatusCheck(response.sessionId!);
            } else {
                const errorMsg = response.details || response.error || 'Failed to create editing session';
                setZohoError(errorMsg);
                setEditorMode('basic');
            }
        } catch (error) {
            console.error('Error initializing Zoho editor:', error);
            setZohoError('Failed to connect to advanced editor. Using basic mode.');
            setEditorMode('basic');
        } finally {
            setIsLoading(false);
        }
    };

    const startSaveStatusCheck = (sessionId: string) => {
        if (saveCheckIntervalRef.current) {
            clearInterval(saveCheckIntervalRef.current);
        }
        saveCheckIntervalRef.current = setInterval(async () => {
            const status = await checkSaveStatus(sessionId);
            if (status.saved) {
                setIsSaved(true);
            }
        }, 5000);
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
            if (editorMode === 'advanced' && zohoSession?.sessionId) {
                const success = await downloadEditedPdf(zohoSession.sessionId, `edited_${file.name}`);
                if (!success) {
                    alert('PDF not saved yet. Please click Save in the editor first.');
                }
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

    const handleReset = () => {
        setFile(null);
        setAnnotations([]);
        setSelectedAnnotation(null);
        setCurrentPage(1);
        setTotalPages(0);
        setZohoSession(null);
        setZohoError(null);
        setIsSaved(false);
        if (saveCheckIntervalRef.current) {
            clearInterval(saveCheckIntervalRef.current);
        }
    };

    const handleModeChange = async (mode: EditorMode) => {
        setEditorMode(mode);
        setZohoError(null);

        if (mode === 'advanced' && file) {
            await initializeZohoEditor(file);
        } else if (mode === 'basic') {
            setZohoSession(null);
            if (saveCheckIntervalRef.current) {
                clearInterval(saveCheckIntervalRef.current);
            }
        }
    };

    const currentPageAnnotations = annotations.filter(ann => ann.pageNumber === currentPage);

    return (
        <div className="pt-24 pb-16 min-h-screen">
            <div className="container mx-auto px-6">
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">PDF Editor</h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Add text, annotations and edit your PDFs directly in your browser.
                    </p>
                </div>

                <div className="max-w-6xl mx-auto">
                    {!file ? (
                        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">Choose Editor Mode</label>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setEditorMode('basic')}
                                        className={`flex-1 p-4 rounded-xl border-2 transition-all ${editorMode === 'basic' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
                                    >
                                        <div className="text-left">
                                            <div className="font-semibold text-gray-900">Basic Editor</div>
                                            <div className="text-sm text-gray-500 mt-1">Add text annotations locally</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setEditorMode('advanced')}
                                        className={`flex-1 p-4 rounded-xl border-2 transition-all ${editorMode === 'advanced' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
                                    >
                                        <div className="text-left">
                                            <div className="font-semibold text-gray-900 flex items-center gap-2">
                                                Advanced Editor
                                                <span className="px-2 py-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs rounded-full">Zoho</span>
                                            </div>
                                            <div className="text-sm text-gray-500 mt-1">Full editing with images, shapes & more</div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                            <FileDropzone onFilesSelected={handleFileSelect} accept=".pdf" title="Drop your PDF here" subtitle="or click to browse" />
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            <div className="flex flex-wrap items-center justify-between p-4 border-b border-gray-100 bg-gray-50 gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                                        <button onClick={() => handleModeChange('basic')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${editorMode === 'basic' ? 'bg-indigo-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Basic</button>
                                        <button onClick={() => handleModeChange('advanced')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${editorMode === 'advanced' ? 'bg-indigo-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Advanced</button>
                                    </div>
                                    {editorMode === 'basic' && (
                                        <>
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
                                        </>
                                    )}
                                    {editorMode === 'advanced' && isSaved && (
                                        <span className="flex items-center gap-2 text-green-600 text-sm font-medium">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            Saved
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    {editorMode === 'basic' && (
                                        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-2">
                                            <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))} className="p-1 hover:bg-gray-100 rounded">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                                            </button>
                                            <span className="text-sm font-medium min-w-[50px] text-center">{Math.round(scale * 100)}%</span>
                                            <button onClick={() => setScale(s => Math.min(3, s + 0.25))} className="p-1 hover:bg-gray-100 rounded">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                            </button>
                                        </div>
                                    )}
                                    <button onClick={handleReset} className="text-gray-600 hover:text-gray-900 font-medium text-sm">Replace PDF</button>
                                </div>
                            </div>

                            {zohoError && (
                                <div className="p-4 bg-yellow-50 border-b border-yellow-100">
                                    <p className="text-yellow-800 text-sm flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        {zohoError}
                                    </p>
                                </div>
                            )}

                            {editorMode === 'basic' ? (
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
                            ) : (
                                <div className="min-h-[700px] bg-gray-100">
                                    {isLoading ? (
                                        <div className="flex items-center justify-center h-[700px]">
                                            <div className="text-center">
                                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4" />
                                                <p className="text-gray-600">Loading Advanced Editor...</p>
                                            </div>
                                        </div>
                                    ) : zohoSession?.editorUrl ? (
                                        <iframe src={zohoSession.editorUrl} className="w-full h-[700px] border-0" allow="fullscreen" title="Zoho PDF Editor" />
                                    ) : (
                                        <div className="flex items-center justify-center h-[700px]">
                                            <div className="text-center">
                                                <p className="text-gray-600 mb-4">Failed to load advanced editor</p>
                                                <Button variant="outline" onClick={() => handleModeChange('basic')}>Switch to Basic Editor</Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {editorMode === 'basic' && (
                                <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-center gap-4">
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="p-2 rounded hover:bg-gray-200 disabled:opacity-30">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                    </button>
                                    <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
                                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="p-2 rounded hover:bg-gray-200 disabled:opacity-30">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                </div>
                            )}

                            <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center">
                                <div className="text-sm text-gray-500">
                                    <span className="font-medium">{file.name}</span>
                                    {editorMode === 'basic' && (<><span className="mx-2">•</span><span>{annotations.length} annotation{annotations.length !== 1 ? 's' : ''}</span></>)}
                                    {editorMode === 'advanced' && zohoSession && (<><span className="mx-2">•</span><span className="text-indigo-600">Zoho Editor Active</span></>)}
                                </div>
                                <Button variant="primary" size="large" onClick={handleDownload} loading={isProcessing}>{isProcessing ? 'Saving...' : 'Download Edited PDF'}</Button>
                            </div>
                        </div>
                    )}

                    {file && (
                        <div className="mt-8 p-6 bg-indigo-50 rounded-xl">
                            <h3 className="font-semibold text-indigo-900 mb-3">{editorMode === 'basic' ? 'How to Edit (Basic):' : 'How to Edit (Advanced):'}</h3>
                            {editorMode === 'basic' ? (
                                <ol className="list-decimal list-inside space-y-2 text-indigo-800 text-sm">
                                    <li>Select the <strong>Text Tool</strong> from the toolbar</li>
                                    <li><strong>Click anywhere</strong> on the PDF to add text</li>
                                    <li>Click <strong>Download Edited PDF</strong> to save</li>
                                </ol>
                            ) : (
                                <ol className="list-decimal list-inside space-y-2 text-indigo-800 text-sm">
                                    <li>Use the Zoho editor to <strong>add text, images, shapes</strong></li>
                                    <li>Click <strong>Save</strong> in the editor</li>
                                    <li>Click <strong>Download Edited PDF</strong> to get your file</li>
                                </ol>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
