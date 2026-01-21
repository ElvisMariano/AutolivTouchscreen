import React, { useEffect, useState, useRef } from 'react';
import { usePDFStorage, isIndexedDBUrl, getIndexedDBId } from '../../hooks/usePDFStorage';
import { Document } from '../../types';
import * as pdfjsLib from 'pdfjs-dist';
import { useI18n } from '../../contexts/I18nContext';

// Configurar worker do PDF.js conforme PdfViewer.tsx
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface AutoCyclingPdfViewerProps {
    pdfUrl: string;
    intervalSeconds?: number;
    fallbackUrl?: string; // URL to use if PDF fails (e.g., external iframe)
    pageDurationSeconds?: number;
    className?: string;
}

export const AutoCyclingPdfViewer: React.FC<AutoCyclingPdfViewerProps> = ({
    pdfUrl,
    intervalSeconds = 10,
    fallbackUrl,
    pageDurationSeconds,
    className = ''
}) => {
    // Use pageDurationSeconds if provided, otherwise fallback to intervalSeconds (legacy)
    const cycleInterval = pageDurationSeconds || intervalSeconds;

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
            if (!pdfUrl) return;

            setLoading(true);
            setError(null);
            setUseFallback(false);

            try {
                let pdfData: ArrayBuffer | string;

                if (isIndexedDBUrl(pdfUrl)) {
                    const id = getIndexedDBId(pdfUrl);
                    const blob = await getPDF(id);
                    if (!blob) {
                        setError(t('common.pdfNotFound'));
                        setLoading(false);
                        return;
                    }
                    pdfData = await blob.arrayBuffer();
                } else {
                    pdfData = pdfUrl;
                }

                const loadingTask = pdfjsLib.getDocument(pdfData);
                const pdf = await loadingTask.promise;
                setPdfDoc(pdf);
                setTotalPages(pdf.numPages);
                setCurrentPage(1);
            } catch (err: any) {
                const isFetchError = err?.name === 'UnknownErrorException' ||
                    err?.message === 'Failed to fetch' ||
                    err?.message?.includes('NetworkError');

                if (isFetchError) {
                    console.warn(`[AutoCyclingPdfViewer] Could not fetch PDF directly (CORS/Network). Switching to iframe fallback (Auto-cycling disabled). URL: ${pdfUrl}`);
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
    }, [pdfUrl, getPDF, t]);

    // Renderizar página atual
    useEffect(() => {
        if (!pdfDoc || !canvasRef.current) return;

        let renderTask: pdfjsLib.RenderTask | null = null;

        const renderPage = async () => {
            try {
                const page = await pdfDoc.getPage(currentPage);
                const canvas = canvasRef.current!;
                const context = canvas.getContext('2d')!;

                // Auto-fit to width/height logic could be improved here
                // For now, consistent scale or fit-to-width
                const viewport = page.getViewport({ scale });
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                };

                renderTask = page.render(renderContext);
                await renderTask.promise;
            } catch (error: any) {
                if (error?.name !== 'RenderingCancelledException') {
                    console.error('Error rendering page:', error);
                }
            }
        };

        renderPage();

        return () => {
            if (renderTask) renderTask.cancel();
        };
    }, [pdfDoc, currentPage, scale]);

    // Cycle Pages Logic
    useEffect(() => {
        if (!pdfDoc || totalPages <= 1) return;

        const interval = setInterval(() => {
            setCurrentPage(prev => {
                if (prev >= totalPages) return 1;
                return prev + 1;
            });
        }, cycleInterval * 1000);

        return () => clearInterval(interval);
    }, [pdfDoc, totalPages, cycleInterval]);

    // Fallback View (Standard Iframe)
    if (useFallback) {
        return (
            <div className={`w-full h-full bg-gray-900 flex flex-col ${className}`}>
                <iframe
                    src={fallbackUrl || pdfUrl}
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
                </div>
            </div>
        );
    }

    // Main View - Just the Canvas (No toolbar)
    return (
        <div className={`flex flex-col bg-gray-900 h-full w-full ${className}`}>
            <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
                <div className="relative shadow-2xl">
                    <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
                    {/* Optional: Page Indicator Overlay */}
                    <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                        {currentPage} / {totalPages}
                    </div>
                </div>
            </div>
        </div>
    );
};
