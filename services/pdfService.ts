import { PdfDocument } from '../types';

declare const pdfjsLib: any;

export const extractTextFromPdf = async (file: File): Promise<PdfDocument> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = '';
    const pageMap: Record<number, number> = {}; 

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // 1. SPATIAL SORTING
      const sortedItems = [...textContent.items].sort((a: any, b: any) => {
        const yDiff = Math.abs(a.transform[5] - b.transform[5]);
        if (yDiff < 5) { // Threshold for being on the same "line"
          return a.transform[4] - b.transform[4]; 
        }
        return b.transform[5] - a.transform[5]; 
      });

      // 2. ENHANCED PAGE MAPPING (Pharma-specific)
      const pageMarkers = sortedItems.filter((item: any) => {
        const text = item.str.trim();
        return /^(page\s+)?\d+(\s+of\s+\d+)?$/i.test(text) || /^\d+$/.test(text);
      });

      if (pageMarkers.length > 0) {
        // We prioritize the bottom-most or top-most numeric value as the page index
        const potentialNum = pageMarkers[pageMarkers.length - 1].str.match(/\d+/);
        if (potentialNum) {
          const printedNum = parseInt(potentialNum[0], 10);
          if (printedNum > 0 && printedNum < 10000) pageMap[printedNum] = i;
        }
      }

      // 3. STRUCTURAL SYNTHESIS
      let pageText = '';
      let lastY: number | null = null;
      let lastX: number | null = null;

      for (const item of sortedItems) {
        // Detect new lines (Y change)
        if (lastY !== null && Math.abs(item.transform[5] - lastY) > 8) {
          pageText += '\n';
        } 
        // Detect large horizontal gaps (potential table columns)
        else if (lastX !== null && (item.transform[4] - lastX) > 20) {
          pageText += '    '; // Insert tab-like spacing
        }

        pageText += item.str;
        lastY = item.transform[5];
        lastX = item.transform[4] + (item.width || 0);
      }

      fullText += `\n--- [INTERNAL_PAGE_${i}] ---\n${pageText.trim()}\n`;
    }
    

    return {
      name: file.name,
      text: fullText,
      pageCount: pdf.numPages,
      fileUrl: URL.createObjectURL(file),
      pageMap
    };
  } catch (error) {
    console.error("Critical Extraction Failure:", error);
    throw new Error("PDF_PARSE_ERR: High-fidelity extraction failed.");
  }
};


