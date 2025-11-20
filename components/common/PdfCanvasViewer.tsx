import React, { useEffect, useRef, useState } from 'react';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist/build/pdf';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.js?url';

interface PdfCanvasViewerProps {
  src: string;
}

const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({ src }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.25);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    GlobalWorkerOptions.workerSrc = workerSrc as any;
    getDocument(src).promise
      .then((pdf: any) => {
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setPageNum(1);
      })
      .catch(() => setError('falha ao abrir pdf'));
  }, [src]);

  useEffect(() => {
    const render = async () => {
      if (!pdfDoc || !canvasRef.current) return;
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      const renderContext = { canvasContext: context, viewport };
      await page.render(renderContext).promise;
    };
    render();
  }, [pdfDoc, pageNum, scale]);

  const prevPage = () => setPageNum((p) => Math.max(1, p - 1));
  const nextPage = () => setPageNum((p) => Math.min(totalPages || 1, p + 1));
  const zoomIn = () => setScale((s) => Math.min(3, s + 0.25));
  const zoomOut = () => setScale((s) => Math.max(0.5, s - 0.25));

  if (error) {
    return (
      <div className="w-full h-full">
        <iframe src={src} title="pdf" className="w-full h-full border-0" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center gap-3 bg-gray-800 p-2">
        <button onClick={prevPage} className="px-3 py-2 bg-gray-700 rounded-md hover:bg-gray-600">Anterior</button>
        <button onClick={nextPage} className="px-3 py-2 bg-gray-700 rounded-md hover:bg-gray-600">Próxima</button>
        <span className="text-sm">Página {pageNum} de {totalPages || 0}</span>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={zoomOut} className="px-3 py-2 bg-gray-700 rounded-md hover:bg-gray-600">-</button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} className="px-3 py-2 bg-gray-700 rounded-md hover:bg-gray-600">+</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-gray-900">
        <canvas ref={canvasRef} className="block mx-auto" />
      </div>
    </div>
  );
};

export default PdfCanvasViewer;