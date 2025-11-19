
import { Project } from "../types";

function escapeHtml(s: string) {
  return (s || '').toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Simple markdown-like parser to allow HTML pass-through for <details> tags
// while escaping other content.
function renderNotesHtml(notes: string): string {
  if (!notes) return 'No notes added.';
  
  // If the user used the "Insert as Block" feature, the text contains HTML tags <details>...
  // We want to render those tags, but escape everything else.
  
  // Strategy: Split by the known HTML tags we want to preserve.
  // This is a simple regex approach.
  const parts = notes.split(/(<\/?details(?: open)?>|<\/?summary>)/g);
  
  return parts.map(part => {
    if (part.match(/<\/?details(?: open)?>|<\/?summary>/)) {
      return part; // Return tag as-is
    } else {
      return escapeHtml(part); // Escape text content
    }
  }).join('');
}

// Shared HTML generator for both Web Export and PDF Export
function getCaseStudyBodyHtml(project: Project): string {
  const assetsHtml = (project.assets || []).map(a => {
    const displayUrl = a.url || a.dataURL;
    // Note: crossOrigin="anonymous" is important for html2canvas/html2pdf to handle CORS images
    return `
    <div style="margin: 20px 0; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; page-break-inside: avoid; background: #fff;">
      <div style="font-weight:700; margin-bottom: 10px; color: #111; font-size: 14px;">${escapeHtml(a.name)}</div>
      ${a.type.startsWith('image') && displayUrl
        ? `<img src="${displayUrl}" style="max-width:100%; max-height: 500px; height:auto; border-radius:6px; display: block; margin: 0 auto;" alt="${escapeHtml(a.name)}" crossorigin="anonymous" />` 
        : `<div style="padding: 15px; background: #f9fafb; border-radius: 6px; color: #4b5563; text-align: center; border: 1px dashed #d1d5db;">File: ${escapeHtml(a.name)} ${a.url ? `<br/><a href="${a.url}" target="_blank" style="color: #2563eb; text-decoration: none; font-size: 12px;">(Download Link)</a>` : ''}</div>`
      }
    </div>
  `;
  }).join('');

  const stagesList = Object.entries(project.stages).map(([k, v]) => 
    `<li style="margin-bottom: 6px; list-style: none; color: #374151; font-size: 14px;">
      <span style="display: inline-block; width: 20px;">${v ? '✅' : '⚪️'}</span> ${escapeHtml(k)}
    </li>`
  ).join('');

  // Use white-space: pre-wrap for the text parts to preserve newlines, 
  // but we need to be careful because we are now injecting HTML tags.
  // We will wrap the whole thing in a div with pre-wrap, but the <details> tags should default to block.
  // Actually, <details> inside pre-wrap might look odd if indentation exists. 
  // Let's use a div container and manage whitespace via CSS on the text parts only? 
  // Simpler: just use white-space: pre-wrap on the container, browsers handle <details> okay usually.
  
  const notesHtml = renderNotesHtml(project.notes);

  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; background: #ffffff; padding: 40px;">
      <h1 style="border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 16px; color: #111827; font-size: 28px; font-weight: 800;">${escapeHtml(project.title)}</h1>
      
      <div style="color: #6b7280; font-size: 14px; margin-bottom: 32px;">
        <p style="margin-bottom: 4px; font-size: 16px; color: #4b5563;">${escapeHtml(project.desc)}</p>
        <p>Created: ${new Date(project.createdAt).toLocaleDateString()}</p>
      </div>

      <h2 style="margin-top: 32px; color: #111827; font-size: 20px; font-weight: 700; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Project Notes & Research</h2>
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin-top: 12px;">
        <div style="white-space: pre-wrap; font-family: inherit; margin: 0; font-size: 14px; color: #374151;">${notesHtml}</div>
      </div>

      <h2 style="margin-top: 32px; color: #111827; font-size: 20px; font-weight: 700; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Process & Progress</h2>
      <ul style="padding-left: 0; margin-top: 12px;">${stagesList}</ul>

      <h2 style="margin-top: 32px; color: #111827; font-size: 20px; font-weight: 700; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Assets & Visuals</h2>
      <div style="margin-top: 12px;">
        ${assetsHtml || '<p style="color: #6b7280; font-style: italic;">No assets attached.</p>'}
      </div>

      <hr style="margin-top: 48px; border: 0; border-top: 1px solid #e5e7eb;">
      <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">Exported from UXMate Project Coach</p>
    </div>
  `;
}

export function downloadCaseStudy(project: Project) {
  const bodyContent = getCaseStudyBodyHtml(project);
  const htmlContent = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(project.title)} — Case Study</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 800px; margin: 0 auto; padding: 40px 20px; background: #ffffff; }
    img { display: block; margin: 0 auto; }
    details { margin: 10px 0; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px; background: #fff; }
    summary { font-weight: 600; cursor: pointer; color: #2563eb; outline: none; }
    details[open] summary { margin-bottom: 8px; border-bottom: 1px dashed #e5e7eb; padding-bottom: 4px; }
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(project.title || 'case-study').replace(/\s+/g, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportCaseToPDF(project: Project) {
  if (!window.html2pdf) {
    alert('PDF library (html2pdf) is not loaded. Check your internet connection.');
    return;
  }

  // Create a temporary container for the PDF content
  const container = document.createElement('div');
  // Fix: Positioning needs to be on-screen for html2canvas to render it properly, 
  // but we can hide it behind everything with z-index.
  container.style.position = 'absolute';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '800px'; // Fixed width for predictable A4 scaling
  container.style.zIndex = '-9999'; 
  container.style.backgroundColor = '#ffffff';
  // Avoid visibility:hidden or display:none as it stops rendering
  
  // Inject content
  container.innerHTML = getCaseStudyBodyHtml(project);
  document.body.appendChild(container);

  // Helper: Wait for images to load
  const images = Array.from(container.querySelectorAll('img'));
  const promises = images.map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise(resolve => {
      img.onload = resolve;
      img.onerror = resolve; // resolve anyway to continue
    });
  });

  try {
    await Promise.all(promises);
    // Small delay to ensure layout is stable
    await new Promise(resolve => setTimeout(resolve, 500));

    // html2pdf options
    const opt = {
      margin:       10, // mm
      filename:     `${(project.title || 'case-study').replace(/\s+/g, '_')}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, scrollY: 0, windowWidth: 800 }, 
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    await window.html2pdf().set(opt).from(container).save();
  } catch (err) {
    console.error('PDF Generation Error:', err);
    alert('Failed to generate PDF. Please check console for details.');
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
