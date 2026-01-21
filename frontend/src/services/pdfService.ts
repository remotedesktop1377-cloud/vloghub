import { API_ENDPOINTS } from '@/config/apiEndpoints';

export const PdfService = {
  async loadPdfJs(): Promise<any> {
    if (typeof window === 'undefined') throw new Error('PDF rendering only available in browser');
    const w = window as any;
    if (w.pdfjsLib) return w.pdfjsLib;
    const candidates = [
      {
        lib: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.min.js',
        worker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.min.js'
      },
      {
        lib: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
        worker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
      }
    ];

    let lastErr: any = null;
    for (const c of candidates) {
      try {
        await new Promise<void>((resolve, reject) => {
          // Avoid duplicate inserts
          const scripts = Array.from(document.scripts || [] as any);
          if (scripts.some((s: HTMLScriptElement) => s.src === c.lib)) return resolve();
          const s = document.createElement('script');
          s.src = c.lib;
          s.async = true;
          s.crossOrigin = 'anonymous';
          s.onload = () => resolve();
          s.onerror = () => reject(new Error(`Failed to load ${c.lib}`));
          document.head.appendChild(s);
        });
        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) throw new Error('pdfjsLib not available after script load');
        pdfjsLib.GlobalWorkerOptions.workerSrc = c.worker;
        return pdfjsLib;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error('Failed to load pdf.js');
  },
  async fetchPdfArrayBuffer(exportUrl: string): Promise<ArrayBuffer> {
    const res = await fetch(`${API_ENDPOINTS.GAMMA_PDF}?url=${encodeURIComponent(exportUrl)}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch PDF');
    return await res.arrayBuffer();
  },

  async getPdfPageCount(arrayBuffer: ArrayBuffer): Promise<number> {
    const pdfjsLib = await this.loadPdfJs();
    // Clone buffer to avoid detachment on reuse
    const cloned = arrayBuffer.slice(0);
    const pdf = await pdfjsLib.getDocument({ data: cloned }).promise;
    return pdf.numPages;
  },

  async renderPdfPageToImage(arrayBuffer: ArrayBuffer, pageNumber: number, scale: number = 2): Promise<string> {
    const pdfjsLib = await this.loadPdfJs();
    // Clone buffer to avoid detachment on reuse
    const cloned = arrayBuffer.slice(0);
    const pdf = await pdfjsLib.getDocument({ data: cloned }).promise;
    if (pageNumber < 1 || pageNumber > pdf.numPages) throw new Error('Invalid page number');
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context not available');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: context as any, viewport }).promise;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    canvas.width = 0; canvas.height = 0;
    return dataUrl;
  }
};

export default PdfService;

