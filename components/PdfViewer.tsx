import React, { useEffect, useRef, useState } from 'react';
import { Loader2, ZoomIn, ZoomOut, X } from 'lucide-react';

declare const pdfjsLib: any;

interface PdfViewerProps {
  url: string;
  highlightText?: string;
  onClose: () => void;
}


const PdfViewer: React.FC<PdfViewerProps> = ({ url, highlightText, onClose }) => {
  const canvasRefs = useRef<Record<number, HTMLCanvasElement | null>>({});
  const [pdf, setPdf] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(0.9);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    if (!numPages) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const page = Number(entry.target.getAttribute('data-page'));
            setCurrentPage(page);
          }
        });
      },
      {
        root: null,
        threshold: 0.6, // 60% visible = current page
      }
    );

    Object.entries(canvasRefs.current).forEach(([page, canvas]) => {
      if (canvas) {
        canvas.setAttribute('data-page', page);
        observer.observe(canvas);
      }
    });

    return () => observer.disconnect();
  }, [numPages]);

  // Normalize helper
  const normalizeText = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Load PDF
  useEffect(() => {
    const loadPdf = async () => {
      setLoading(true);
      const loadingTask = pdfjsLib.getDocument(url);
      const pdfDoc = await loadingTask.promise;
      setPdf(pdfDoc);
      setNumPages(pdfDoc.numPages);
      setLoading(false);
    };
    loadPdf();
  }, [url]);

  // Render all pages
  useEffect(() => {
    if (!pdf) return;

    const renderAllPages = async () => {
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        await renderPage(pageNum);
      }
    };

    renderAllPages();
  }, [pdf, scale, highlightText]);

  // Render single page
  const renderPage = async (pageNumber: number) => {
    const page = await pdf.getPage(pageNumber);
    const canvas = canvasRefs.current[pageNumber];
    if (!canvas) return;

    const context = canvas.getContext('2d')!;
    const viewport = page.getViewport({ scale });
    const outputScale = window.devicePixelRatio || 1;

    canvas.width = viewport.width * outputScale;
    canvas.height = viewport.height * outputScale;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    const renderContext = {
      canvasContext: context,
      transform:
        outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null,
      viewport,
    };

    await page.render(renderContext).promise;

    if (highlightText) {
      await highlightOnPage(
        page,
        context,
        viewport,
        outputScale,
        pageNumber
      );
    }
  };

  // Highlight logic per page
  const highlightOnPage = async (
    page: any,
    context: CanvasRenderingContext2D,
    viewport: any,
    outputScale: number,
    pageNumber: number
  ) => {
    const textContent = await page.getTextContent();
    const items = textContent.items;

    let fullText = '';
    const map: any[] = [];

    items.forEach((item: any) => {
      const norm = normalizeText(item.str);
      if (!norm) return;

      const start = fullText.length;
      fullText += norm;
      const end = fullText.length;

      map.push({ start, end, item });
    });

    const searchNorm = normalizeText(highlightText!);
    const matchIndex = fullText.indexOf(searchNorm);
    if (matchIndex === -1) return;

    // Scroll to matched page
    canvasRefs.current[pageNumber]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });

    const matchEnd = matchIndex + searchNorm.length;

    context.save();
    context.scale(outputScale, outputScale);
    context.fillStyle = 'rgba(255,255,0,0.4)';
    context.globalCompositeOperation = 'multiply';

    map.forEach(({ start, end, item }) => {
      if (start < matchEnd && end > matchIndex) {
        const [a, b, , , x, y] = item.transform;
        const w = item.width;
        const h = Math.sqrt(a * a + b * b);

        const rect = viewport.convertToViewportRectangle([
          x,
          y,
          x + w,
          y + h,
        ]);

        const rx = Math.min(rect[0], rect[2]);
        const ry = Math.min(rect[1], rect[3]);
        const rw = Math.abs(rect[0] - rect[2]);
        const rh = Math.abs(rect[1] - rect[3]);

        context.fillRect(rx, ry, rw, rh);
      }
    });

    context.restore();
  };

  return (
    <div className="flex flex-col h-full bg-slate-100">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b shadow-sm">
        <span className="text-sm text-slate-600">
          Page <span className="font-medium">{currentPage}</span> of {numPages}

          {highlightText && (
            <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              Highlight active
            </span>
          )}
        </span>

        <div className="flex items-center gap-2">
          <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))}>
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-xs w-12 text-center">
            {Math.round(scale * 100)}%
          </span>

          <button onClick={() => setScale(s => Math.min(3, s + 0.1))}>
            <ZoomIn className="w-4 h-4" />
          </button>

          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>


      {/* Scrollable PDF */}
      <div className="flex-1 overflow-auto p-6 bg-slate-500/10">
        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin w-6 h-6" />
          </div>
        )}

        <div className="flex flex-col items-center gap-6">
          {Array.from({ length: numPages }, (_, i) => i + 1).map(pageNum => (
            <canvas
              key={pageNum}
              ref={el => (canvasRefs.current[pageNum] = el)}
              data-page={pageNum}
              className="bg-white shadow-lg"
            />
          ))}

        </div>
      </div>
    </div>
  );
};

export default PdfViewer;



