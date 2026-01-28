import React, { useEffect, useState, useRef } from 'react';
import { usePDFStorage, isIndexedDBUrl, getIndexedDBId } from '../../hooks/usePDFStorage';
import { Document } from '../../types';
import * as pdfjsLib from 'pdfjs-dist';
import { MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useI18n } from '../../contexts/I18nContext';

// Configurar worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFViewerProps {
    url?: string;
    document?: Document;
    className?: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ url: urlProp, document, className = '' }) => {
    const url = document?.url || urlProp || '';
    const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [scale, setScale] = useState(1.5);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [useFallback, setUseFallback] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { getPDF } = usePDFStorage();
    const { t } = useI18n();

    // Carregar PDF
    useEffect(() => {
        const loadPDF = async () => {
            if (!url) return;

            setLoading(true);
            setError(null);
            setUseFallback(false);

            try {
                let pdfData: ArrayBuffer | string;

                if (isIndexedDBUrl(url)) {
                    // Buscar do IndexedDB
                    const id = getIndexedDBId(url);
                    const blob = await getPDF(id);
                    if (!blob) {
                        setError(t('common.pdfNotFound'));
                        setLoading(false);
                        return;
                    }
                    pdfData = await blob.arrayBuffer();
                } else {
                    // URL externa - Usar Backend Proxy para evitar CORS
                    // Verifique se a URL já não é local ou base64
                    if (url.startsWith('http')) {
                        const updatedUrl = `/api/proxy/pdf?url=${encodeURIComponent(url)}`;
                        // Carregar via PDF.js usando a URL do proxy
                        // O PDF.js sabe lidar com URLs relativas/absolutas se passadas diretamente
                        // Mas para ter certeza que é um arraybuffer ou string url compatível:
                        pdfData = updatedUrl;
                    } else {
                        pdfData = url;
                    }
                }

                const loadingTask = pdfjsLib.getDocument(pdfData);
                const pdf = await loadingTask.promise;
                setPdfDoc(pdf);
                setTotalPages(pdf.numPages);
                setCurrentPage(1);
            } catch (err: any) {
                // Check for common fetch/CORS errors
                const isFetchError = err?.name === 'UnknownErrorException' ||
                    err?.message === 'Failed to fetch' ||
                    err?.message?.includes('NetworkError');

                if (isFetchError) {
                    console.warn('Could not fetch PDF directly (likely CORS), switching to iframe fallback.');
                } else {
                    console.error('Error loading PDF:', err);
                }

                // Fallback to iframe for external links (CORS) or other errors
                setUseFallback(true);
            } finally {
                setLoading(false);
            }
        };

        loadPDF();
    }, [url, getPDF, t]);

    // Renderizar página atual
    useEffect(() => {
        if (!pdfDoc || !canvasRef.current) return;

        let renderTask: pdfjsLib.RenderTask | null = null;

        const renderPage = async () => {
            try {
                const page = await pdfDoc.getPage(currentPage);
                const canvas = canvasRef.current!;
                const context = canvas.getContext('2d')!;

                const viewport = page.getViewport({ scale });
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                // Limpar canvas antes de renderizar
                context.clearRect(0, 0, canvas.width, canvas.height);

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                };

                renderTask = page.render(renderContext);
                await renderTask.promise;
            } catch (error: any) {
                // Ignorar erros de cancelamento
                if (error?.name !== 'RenderingCancelledException') {
                    console.error('Error rendering page:', error);
                }
            }
        };

        renderPage();

        // Cleanup: cancelar renderização em andamento
        return () => {
            if (renderTask) {
                renderTask.cancel();
            }
        };
    }, [pdfDoc, currentPage, scale]);

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
    const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
    const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

    if (useFallback) {
        return (
            <div className={`w-full h-full bg-gray-900 flex flex-col ${className}`}>
                <iframe
                    src={url}
                    className="flex-1 w-full h-full border-0"
                    title="PDF Viewer"
                />
            </div>
        );
    }

    if (loading) {
        return (
            <div className={`flex items-center justify-center bg-gray-900 ${className}`}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">{t('common.loadingPdf')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`flex items-center justify-center bg-gray-900 ${className}`}>
                <div className="text-center text-red-400">
                    <p className="text-xl mb-2">⚠️ {error}</p>
                    <p className="text-sm text-gray-500">{t('common.urlLabel')} {url}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col bg-gray-900 ${className}`}>
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-gray-800 p-4 border-b border-gray-700">
                {/* Navegação de páginas */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="p-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
                        title={t('common.previousPage')}
                    >
                        <ChevronLeftIcon className="w-6 h-6 text-white" />
                    </button>
                    <span className="text-white text-lg px-3">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="p-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
                        title={t('common.nextPage')}
                    >
                        <ChevronRightIcon className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Controles de Zoom */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleZoomOut}
                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                        title={t('common.zoomOut')}
                    >
                        <MagnifyingGlassMinusIcon className="w-6 h-6 text-white" />
                    </button>
                    <span className="text-white text-lg px-3 min-w-[60px] text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        onClick={handleZoomIn}
                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                        title={t('common.zoomIn')}
                    >
                        <MagnifyingGlassPlusIcon className="w-6 h-6 text-white" />
                    </button>
                </div>
            </div>

            {/* Área de visualização do PDF */}
            <div className="flex-1 overflow-auto bg-gray-950 p-4" style={{ scrollBehavior: 'smooth' }}>
                <div className="flex items-start justify-center min-h-full">
                    <canvas ref={canvasRef} className="shadow-2xl" />
                </div>
            </div>
        </div>
    );
};

export default PDFViewer;
