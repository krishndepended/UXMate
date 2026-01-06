import { Project } from "../types";
import { generateCaseStudyHtml } from "./pdfTemplate";

// --- IMAGE INLINING UTILITIES ---

async function urlToDataUri(url: string): Promise<string> {
  try {
    // Avoid re-fetching if it's already a data URI
    if (url.startsWith('data:')) return url;

    const response = await fetch(url, { mode: 'cors', cache: 'no-cache' });
    if (!response.ok) throw new Error(`Failed to fetch ${url}`);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Export: Could not inline image, keeping original URL.', url);
    return url;
  }
}

async function inlineImagesInContainer(container: HTMLElement) {
  const images = Array.from(container.querySelectorAll('img'));
  const promises = images.map(async (img) => {
    // If already data URI, skip
    if (img.src.startsWith('data:')) return;
    // If blob URL (local preview), fetch and inline
    // If remote URL, fetch and inline (handles CORS if server allows)
    const newDataUri = await urlToDataUri(img.src);
    if (newDataUri !== img.src) {
      img.src = newDataUri;
    }
  });
  await Promise.all(promises);
}

// --- EXPORT FUNCTIONS ---

/**
 * Generates a simple HTML string for direct HTML file download (interactive web view).
 */
export function generateFullHtml(project: Project, includeAssets: boolean = true): string {
  return generateCaseStudyHtml(project);
}

/**
 * Generates the printable document, inlines images, and prepares it for the new window.
 */
export async function generatePrintableDocument(project: Project, includeAssets: boolean): Promise<string> {
  const rawHtml = generateCaseStudyHtml(project);

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  if (includeAssets) {
    const images = Array.from(doc.querySelectorAll('img'));
    const promises = images.map(async (img) => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('data:')) {
        const newDataUri = await urlToDataUri(src);
        img.setAttribute('src', newDataUri);
      }
    });
    await Promise.all(promises);
  }

  return doc.documentElement.outerHTML;
}

export function downloadAsHtmlFile(htmlContent: string, filename: string) {
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportToPrintable(project: Project, includeAssets: boolean = true): Promise<{ success: boolean; method: 'print' | 'download' }> {
  const filename = `${(project.title || 'case-study').replace(/[^a-z0-9]/gi, '_')}.html`;
  const htmlContent = await generatePrintableDocument(project, includeAssets);

  // In mobile browsers, window.open is often blocked unless triggered directly by a click.
  // We attempt it, but provide a robust fallback.
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    try {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for images and resources to load before triggering print
      printWindow.onload = () => {
        setTimeout(() => {
          if (printWindow.print) {
            printWindow.print();
          }
        }, 500);
      };
      
      // Fallback for browsers that don't trigger onload for document.write content correctly
      setTimeout(() => {
        if (printWindow.document.readyState === 'complete') {
          if (printWindow.print) printWindow.print();
        }
      }, 1500);
      
      return { success: true, method: 'print' };
    } catch (e) {
      console.error('Export: Failed to write to print window', e);
      printWindow.close();
      downloadAsHtmlFile(htmlContent, filename);
      return { success: false, method: 'download' };
    }
  } else {
    // If window.open was blocked, we fallback to direct download immediately.
    console.warn('Export: Popup blocked. Falling back to download.');
    downloadAsHtmlFile(htmlContent, filename);
    return { success: true, method: 'download' };
  }
}

export function downloadCaseStudy(project: Project, includeAssets: boolean = true) {
  const htmlContent = generateFullHtml(project, includeAssets);
  const filename = `${(project.title || 'case-study').replace(/[^a-z0-9]/gi, '_')}.html`;
  downloadAsHtmlFile(htmlContent, filename);
}
