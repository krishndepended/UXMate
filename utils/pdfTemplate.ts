import { Project, Asset, ExportConfig } from "../types";
import { STAGES } from "../constants";

function escapeHtml(s: string) {
  return (s || '').toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * A simple but effective Markdown parser for the export engine.
 * Handles: Headers (###), Bold (**), Lists (- or *), and Line Breaks.
 */
export function parseMarkdown(text: string): string {
  if (!text) return '';

  let html = escapeHtml(text);

  // Headers: ### Title -> <h3>Title</h3>
  html = html.replace(/^### (.*$)/gim, '<h3 style="margin-top: 24px; margin-bottom: 8px; font-weight: 800; color: #0f172a; font-size: 18px;">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 style="margin-top: 32px; margin-bottom: 12px; font-weight: 800; color: #0f172a; font-size: 22px; border-bottom: 1px solid #eee; padding-bottom: 8px;">$1</h2>');

  // Bold: **text** -> <strong>text</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #111827; font-weight: 700;">$1</strong>');

  // Lists: - item or * item -> <li>item</li>
  // This is a basic line-by-line list check
  const lines = html.split('\n');
  let inList = false;
  const processedLines = lines.map(line => {
    const listMatch = line.match(/^[-*] (.*)/);
    if (listMatch) {
      const content = listMatch[1];
      if (!inList) {
        inList = true;
        return `<ul style="margin-bottom: 16px; padding-left: 20px; list-style-type: disc;"><li style="margin-bottom: 4px;">${content}</li>`;
      }
      return `<li style="margin-bottom: 4px;">${content}</li>`;
    } else {
      if (inList) {
        inList = false;
        return `</ul>${line}<br>`;
      }
      return line + '<br>';
    }
  });
  
  html = processedLines.join('');

  return html;
}

function getAssetHtml(assets: Asset[], showAssets: boolean) {
  if (!showAssets || !assets || assets.length === 0) return '';
  
  return `
    <div class="assets-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin: 24px 0;">
      ${assets.map(a => {
         const displayUrl = a.url || a.dataURL;
         if (!a.type.startsWith('image') || !displayUrl) return '';
         return `
           <div class="asset-item" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #fff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
             <img src="${displayUrl}" style="width: 100%; height: auto; display: block; max-height: 500px; object-fit: contain; background: #f8fafc;" />
             <div class="asset-caption" style="padding: 12px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #f1f5f9; font-weight: 500;">
               ${escapeHtml(a.caption || a.name)}
             </div>
           </div>
         `;
      }).join('')}
    </div>
  `;
}

export function generateCaseStudyHtml(project: Project): string {
  const config: ExportConfig = project.exportConfig || {
    theme: 'modern',
    primaryColor: '#3B82F6',
    fontFamily: 'Inter',
    showCover: true,
    showTOC: true,
    showAssets: true,
    designerName: '',
    designerRole: 'UX Designer',
    excludedSteps: []
  };

  const stepsHtml = STAGES.filter(s => s.id !== 'casestudy' && !config.excludedSteps.includes(s.id)).map((stage, index) => {
    const stepData = project.steps?.[stage.id] || { notes: '', isComplete: false };
    const content = stepData.notes || (stage.id === 'problem' ? project.notes : '');
    const stepAssets = project.assets.filter(a => (a.stepId === stage.id) || (stage.id === 'problem' && !a.stepId));

    if (!content && stepAssets.length === 0) return '';

    return `
      <section class="step-section" style="margin-bottom: 60px; page-break-inside: avoid;">
        <div class="step-header" style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
          <span class="step-num" style="background: ${config.primaryColor}; color: white; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-size: 14px; font-weight: 800;">${index + 1}</span>
          <h2 class="step-title" style="font-size: 28px; margin: 0; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">${escapeHtml(stage.label.replace(/^\d+\.\s/, ''))}</h2>
        </div>
        <div class="step-content">
          ${content ? `<div class="step-notes" style="font-size: 16px; color: #374151; line-height: 1.8; margin-bottom: 32px;">${parseMarkdown(content)}</div>` : ''}
          ${getAssetHtml(stepAssets, config.showAssets)}
        </div>
      </section>
    `;
  }).join('');

  const fontStack = config.fontFamily === 'Serif' ? 'Georgia, serif' : config.fontFamily === 'Mono' ? 'monospace' : "'Inter', sans-serif";

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(project.title)}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      body {
        font-family: ${fontStack};
        color: #111827;
        line-height: 1.6;
        margin: 0;
        background: ${config.theme === 'minimal' ? '#fff' : '#f8fafc'};
      }
      .document-wrapper {
        max-width: 900px;
        margin: 0 auto;
        padding: 60px 40px;
        background: white;
        box-shadow: 0 0 40px rgba(0,0,0,0.05);
      }
      @media print {
        .document-wrapper { padding: 0; max-width: 100%; box-shadow: none; }
        body { background: white; }
      }
      
      .cover {
        height: 70vh;
        display: ${config.showCover ? 'flex' : 'none'};
        flex-direction: column;
        justify-content: center;
        border-left: 16px solid ${config.primaryColor};
        padding-left: 60px;
        margin-bottom: 100px;
        background: linear-gradient(to right, #fcfdfe, #fff);
      }
      .cover h1 { font-size: 64px; margin: 0; color: #0f172a; font-weight: 800; letter-spacing: -0.04em; line-height: 1; }
      .cover p { font-size: 24px; color: #64748b; margin-top: 20px; max-width: 600px; font-weight: 400; }
      .designer-info { margin-top: 60px; }
      .designer-name { font-size: 20px; font-weight: 700; color: #0f172a; }
      .designer-role { font-size: 14px; font-weight: 600; color: ${config.primaryColor}; text-transform: uppercase; letter-spacing: 0.1em; }

      .toc { display: ${config.showTOC ? 'block' : 'none'}; margin-bottom: 80px; page-break-after: always; }
      .toc h2 { color: ${config.primaryColor}; text-transform: uppercase; font-size: 12px; letter-spacing: 3px; font-weight: 800; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 24px; }
      .toc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .toc-item { font-size: 14px; font-weight: 600; color: #475569; display: flex; align-items: center; gap: 8px; }
      .toc-item span { color: ${config.primaryColor}; opacity: 0.5; font-size: 10px; }

      .step-section { border-bottom: 1px solid #f1f5f9; padding-bottom: 40px; }
      .step-section:last-child { border-bottom: none; }
      
      ul, li { margin: 0; padding: 0; }
    </style>
  </head>
  <body>
    <div class="document-wrapper">
      <div class="cover">
        <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; color: ${config.primaryColor}; margin-bottom: 16px;">Product Design Case Study</div>
        <h1>${escapeHtml(project.title)}</h1>
        <p>${escapeHtml(project.desc)}</p>
        <div class="designer-info">
          <div class="designer-name">${escapeHtml(config.designerName || 'Design Process')}</div>
          <div class="designer-role">${escapeHtml(config.designerRole)}</div>
        </div>
      </div>
      
      <div class="toc">
        <h2>The Journey Map</h2>
        <div class="toc-grid">
          ${STAGES.filter(s => s.id !== 'casestudy' && !config.excludedSteps.includes(s.id)).map((s, i) => `
            <div class="toc-item">
              <span>${String(i + 1).padStart(2, '0')}</span>
              ${escapeHtml(s.label.split('. ')[1])}
            </div>
          `).join('')}
        </div>
      </div>

      <div class="content">
        ${stepsHtml}
      </div>
    </div>
  </body>
  </html>
  `;
}
