
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
 * Keeps the old "web" style logic if needed, or reuses the new one.
 * For now, we keep this mapped to the new robust template for consistency.
 */
export function generateFullHtml(project: Project, includeAssets: boolean = true): string {
  // The new template is cleaner and works for both web and print
  return generateCaseStudyHtml(project);
}

/**
 * Generates the printable document, inlines images, and prepares it for the new window.
 */
export async function generatePrintableDocument(project: Project, includeAssets: boolean): Promise<string> {
  // 1. Generate the Raw HTML string from the new template
  const rawHtml = generateCaseStudyHtml(project);

  // 2. Create a temporary DOM element to process images
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  // 3. Inline images for robustness in new window / PDF
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

  // Attempt to open new window
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    try {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      // The script inside the HTML will trigger window.print() automatically
      return { success: true, method: 'print' };
    } catch (e) {
      console.error('Export: Failed to write to print window', e);
      printWindow.close();
      downloadAsHtmlFile(htmlContent, filename);
      return { success: false, method: 'download' };
    }
  } else {
    // Popup blocked
    console.warn('Export: Popup blocked. Falling back to download.');
    downloadAsHtmlFile(htmlContent, filename);
    return { success: true, method: 'download' };
  }
}

// Alias for the simple HTML download
export function downloadCaseStudy(project: Project, includeAssets: boolean = true) {
  const htmlContent = generateFullHtml(project, includeAssets);
  const filename = `${(project.title || 'case-study').replace(/[^a-z0-9]/gi, '_')}.html`;
  downloadAsHtmlFile(htmlContent, filename);
}
