import { Project, Asset, ExportConfig, CustomSection } from "../types";
import { STAGES } from "../constants";

function escapeHtml(s: string) {
  return (s || '').toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function parseMarkdown(text: string): string {
  if (!text) return '';
  let html = escapeHtml(text);
  html = html.replace(/^### (.*$)/gim, '<h3 style="margin-top: 2rem; margin-bottom: 0.75rem; font-weight: 800; color: #0f172a; font-size: 1.25rem;">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 style="margin-top: 3rem; margin-bottom: 1.25rem; font-weight: 900; color: #0f172a; font-size: 1.75rem; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.75rem;">$1</h2>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #0f172a; font-weight: 700;">$1</strong>');
  
  const lines = html.split('\n');
  let inList = false;
  const processedLines = lines.map(line => {
    const listMatch = line.match(/^[-*] (.*)/);
    if (listMatch) {
      const content = listMatch[1];
      if (!inList) {
        inList = true;
        return `<ul style="margin-bottom: 2rem; padding-left: 1.5rem; list-style-type: disc;"><li style="margin-bottom: 0.5rem;">${content}</li>`;
      }
      return `<li style="margin-bottom: 0.5rem;">${content}</li>`;
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
    <div class="assets-grid">
      ${assets.map(a => {
         const displayUrl = a.url || a.dataURL;
         if (!a.type.startsWith('image') || !displayUrl) return '';
         return `
           <div class="asset-item">
             <div class="asset-image-container">
               <img src="${displayUrl}" alt="${escapeHtml(a.name)}" />
             </div>
             ${a.caption ? `<div class="asset-caption">${escapeHtml(a.caption)}</div>` : ''}
           </div>
         `;
      }).join('')}
    </div>
  `;
}

function getTOCHtml(project: Project, config: ExportConfig) {
  if (!config.showTOC) return '';
  const order = config.sectionOrder || STAGES.filter(s => s.id !== 'casestudy').map(s => s.id);
  const customSections = config.customSections || [];
  
  const links = order.map(id => {
    const stage = STAGES.find(s => s.id === id);
    const custom = customSections.find(cs => cs.id === id);
    if (stage && !config.excludedSteps.includes(id)) {
      return `<li><a href="#section-${id}"><span>${escapeHtml(stage.label.replace(/^\d+\.\s/, ''))}</span><span class="dots"></span></a></li>`;
    }
    if (custom) {
      return `<li><a href="#section-${custom.id}"><span>${escapeHtml(custom.title)}</span><span class="dots"></span></a></li>`;
    }
    return '';
  }).filter(Boolean).join('');

  if (!links) return '';

  return `
    <nav class="toc-container">
      <h2 style="font-size: 2rem; font-weight: 900; margin-bottom: 3rem; color: #0f172a;">Project Milestones</h2>
      <ul class="toc-list">
        ${links}
      </ul>
    </nav>
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

  const order = config.sectionOrder || STAGES.filter(s => s.id !== 'casestudy').map(s => s.id);
  const customSections = config.customSections || [];

  const sectionsHtml = order.map((id, index) => {
    const stage = STAGES.find(s => s.id === id);
    if (stage) {
      if (config.excludedSteps.includes(id)) return '';
      const stepData = project.steps?.[id] || { notes: '', isComplete: false };
      const rawContent = config.customOverrides?.[id] || stepData.notes || (id === 'problem' ? project.notes : '');
      const stepAssets = project.assets.filter(a => (a.stepId === id) || (id === 'problem' && !a.stepId));
      if (!rawContent && stepAssets.length === 0) return '';
      return `
        <section class="step-section" id="section-${id}">
          <div class="step-header">
            <span class="step-num" style="background: ${config.primaryColor};">${index + 1}</span>
            <h2 class="step-title">${escapeHtml(stage.label.replace(/^\d+\.\s/, ''))}</h2>
          </div>
          <div class="step-content">
            ${rawContent ? `<div class="step-notes">${parseMarkdown(rawContent)}</div>` : ''}
            ${getAssetHtml(stepAssets, config.showAssets)}
          </div>
        </section>
      `;
    }
    const custom = customSections.find(cs => cs.id === id);
    if (custom) {
      return `
        <section class="step-section" id="section-${custom.id}">
          <div class="step-header">
            <span class="step-num" style="background: ${config.primaryColor};">${index + 1}</span>
            <h2 class="step-title">${escapeHtml(custom.title)}</h2>
          </div>
          <div class="step-content">
            <div class="step-notes">${parseMarkdown(custom.content)}</div>
          </div>
        </section>
      `;
    }
    return '';
  }).join('');

  const fontStack = config.fontFamily === 'Serif' ? 'Georgia, serif' : config.fontFamily === 'Mono' ? 'monospace' : "'Inter', sans-serif";

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(project.title)}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      
      * { box-sizing: border-box; }
      
      body {
        font-family: ${fontStack};
        color: #1e293b;
        line-height: 1.6;
        margin: 0;
        background: #ffffff;
        -webkit-print-color-adjust: exact;
      }

      .document-wrapper {
        max-width: 1000px;
        margin: 0 auto;
        padding: 100px 50px;
      }

      .cover {
        min-height: 85vh;
        display: ${config.showCover ? 'flex' : 'none'};
        flex-direction: column;
        justify-content: center;
        border-left: 24px solid ${config.primaryColor};
        padding-left: 80px;
        margin-bottom: 120px;
        page-break-after: always;
      }

      .cover h1 {
        font-size: clamp(4rem, 10vw, 7rem);
        margin: 0;
        font-weight: 900;
        line-height: 1;
        letter-spacing: -0.04em;
        color: #0f172a;
      }

      .cover p {
        font-size: 1.75rem;
        color: #64748b;
        margin-top: 2rem;
        max-width: 700px;
        font-weight: 500;
      }

      .toc-container {
        margin-bottom: 150px;
        page-break-after: always;
      }

      .toc-list { list-style: none; padding: 0; margin: 0; }
      .toc-list li { margin-bottom: 1.5rem; font-size: 1.25rem; font-weight: 600; }
      .toc-list a { text-decoration: none; color: #475569; display: flex; align-items: center; }
      .toc-list .dots { flex: 1; border-bottom: 2px dotted #e2e8f0; margin: 0 1.5rem; }

      .step-section {
        margin-bottom: 160px;
        page-break-inside: avoid;
      }

      .step-header {
        display: flex;
        align-items: center;
        gap: 2rem;
        margin-bottom: 3rem;
      }

      .step-num {
        color: white;
        width: 56px;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 18px;
        font-size: 1.25rem;
        font-weight: 900;
      }

      .step-title {
        font-size: 3rem;
        margin: 0;
        font-weight: 900;
        letter-spacing: -0.03em;
        color: #0f172a;
      }

      .step-notes {
        font-size: 1.25rem;
        color: #334155;
        line-height: 1.8;
      }

      .assets-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 3rem;
        margin: 4rem 0;
      }

      .asset-item {
        border-radius: 32px;
        overflow: hidden;
        border: 1px solid #f1f5f9;
        background: #f8fafc;
      }

      .asset-image-container {
        padding: 40px;
        display: flex;
        justify-content: center;
        background: #f8fafc;
      }

      .asset-item img {
        max-width: 100%;
        border-radius: 12px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.08);
      }

      .asset-caption {
        padding: 2rem;
        background: white;
        font-size: 1rem;
        color: #64748b;
        border-top: 1px solid #f1f5f9;
        font-style: italic;
      }

      .designer-info { margin-top: 100px; }
      .designer-name { font-size: 1.75rem; font-weight: 900; color: #0f172a; }
      .designer-role { 
        font-size: 1rem; 
        font-weight: 800; 
        color: ${config.primaryColor}; 
        text-transform: uppercase; 
        letter-spacing: 0.3em; 
        margin-top: 0.5rem; 
      }

      @media print {
        .document-wrapper { padding: 0; max-width: 100%; }
        .cover { min-height: 95vh; padding-left: 60px; }
      }
    </style>
  </head>
  <body>
    <div class="document-wrapper">
      <div class="cover">
        <div style="font-size: 0.875rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.4em; color: ${config.primaryColor}; margin-bottom: 2rem;">Professional UX Portfolio</div>
        <h1>${escapeHtml(project.title)}</h1>
        <p>${escapeHtml(project.desc)}</p>
        <div class="designer-info">
          <div class="designer-name">${escapeHtml(config.designerName || 'UX Designer')}</div>
          <div class="designer-role">${escapeHtml(config.designerRole || 'Senior Product Designer')}</div>
        </div>
      </div>
      
      ${getTOCHtml(project, config)}
      
      <div class="content">
        ${sectionsHtml}
      </div>
    </div>
  </body>
  </html>
  `;
}