
import { Project, Asset, StepData } from "../types";
import { STAGES } from "../constants";

// --- Helpers ---

function escapeHtml(s: string) {
  return (s || '').toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderNotesHtml(notes: string): string {
  if (!notes) return '';
  // Preserve details/summary tags, convert newlines to BR for other text
  const parts = notes.split(/(<\/?details(?: open)?>|<\/?summary>)/g);
  return parts.map(part => {
    if (part.match(/<\/?details(?: open)?>|<\/?summary>/)) {
      return part;
    } else {
      return escapeHtml(part).replace(/\n/g, '<br>');
    }
  }).join('');
}

function getAssetHtml(assets: Asset[]) {
  if (!assets || assets.length === 0) return '';
  
  return `
    <div class="assets-grid">
      ${assets.map(a => {
         const displayUrl = a.url || a.dataURL;
         if (!a.type.startsWith('image') || !displayUrl) return '';
         return `
           <div class="asset-item">
             <img src="${displayUrl}" alt="${escapeHtml(a.name)}" />
             <div class="asset-caption">${escapeHtml(a.name)}</div>
           </div>
         `;
      }).join('')}
    </div>
  `;
}

// --- Main Generator ---

export function generateCaseStudyHtml(project: Project): string {
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  // 1. Generate Steps HTML
  const stepsHtml = STAGES.map((stage, index) => {
    const stepData = project.steps?.[stage.id] || { notes: '', isComplete: false };
    
    // Legacy compatibility: Check global notes if step 1 is empty
    const content = stepData.notes || (stage.id === 'problem' ? project.notes : '');
    
    const stepAssets = project.assets.filter(a => {
      if (a.stepId === stage.id) return true;
      // Backward compat: untagged assets go to step 1
      if (stage.id === 'problem' && !a.stepId) return true;
      return false;
    });

    const stepNumber = String(index + 1).padStart(2, '0');

    // Skip "Case Study" step in the process loop, we treat it as summary at the end
    if (stage.id === 'casestudy') return '';

    return `
      <section class="step-section no-break">
        <div class="step-header">
          <span class="step-num">${stepNumber}</span>
          <div class="step-title-group">
            <h2 class="step-title">${escapeHtml(stage.label.replace(/^\d+\.\s/, ''))}</h2>
            <div class="step-desc">${escapeHtml(stage.description)}</div>
          </div>
        </div>

        <div class="step-content">
          ${content 
            ? `<div class="step-notes">${renderNotesHtml(content)}</div>` 
            : `<div class="empty-state">No notes added for this step.</div>`
          }
          ${getAssetHtml(stepAssets)}
        </div>
      </section>
      <div class="divider"></div>
    `;
  }).join('');

  // 2. Final Summary (Step 12 or derived)
  const summaryData = project.steps?.['casestudy'] || { notes: '', isComplete: false };
  const summaryHtml = summaryData.notes 
    ? `
      <section class="step-section page-break">
        <h2 class="section-title">Final Summary & Conclusion</h2>
        <div class="step-notes">${renderNotesHtml(summaryData.notes)}</div>
        ${getAssetHtml(project.assets.filter(a => a.stepId === 'casestudy'))}
      </section>
    ` 
    : '';

  // 3. HTML Template
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(project.title)} - Case Study</title>
    <style>
      /* --- RESET & BASE --- */
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
      
      *, *::before, *::after { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 0;
        font-family: 'Inter', sans-serif;
        color: #111827;
        line-height: 1.6;
        background: #fff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      /* --- PRINT CONFIG --- */
      @page {
        size: A4;
        margin: 0; /* We handle margins in containers to control full-bleed cover */
      }
      
      @media print {
        body { width: 210mm; }
        .page-break { page-break-before: always; }
        .no-break { page-break-inside: avoid; }
      }

      /* --- TYPOGRAPHY --- */
      h1 { font-size: 42px; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 16px 0; line-height: 1.1; }
      h2 { font-size: 24px; font-weight: 700; margin: 0 0 8px 0; color: #111827; }
      h3 { font-size: 18px; font-weight: 600; margin: 0 0 8px 0; color: #374151; }
      p { margin: 0 0 16px 0; color: #4b5563; font-size: 14px; }

      /* --- LAYOUTS --- */
      .sheet {
        width: 100%;
        max-width: 210mm;
        margin: 0 auto;
        padding: 15mm 15mm;
        position: relative;
      }
      
      .cover-page {
        height: 297mm; /* A4 Height */
        display: flex;
        flex-direction: column;
        justify-content: center;
        background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%);
        padding: 20mm;
        page-break-after: always;
      }

      .toc-page {
        padding: 20mm;
        page-break-after: always;
      }

      .content-wrapper {
        padding: 20mm;
      }

      /* --- COMPONENTS --- */
      
      /* Cover */
      .cover-meta {
        font-size: 14px;
        font-weight: 600;
        color: #3b82f6;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 24px;
      }
      .cover-desc {
        font-size: 20px;
        color: #475569;
        max-width: 80%;
        margin-bottom: 48px;
        font-weight: 300;
      }
      .cover-footer {
        margin-top: auto;
        padding-top: 32px;
        border-top: 1px solid #cbd5e1;
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #64748b;
      }

      /* TOC */
      .toc-title { font-size: 16px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
      .toc-list { list-style: none; padding: 0; margin: 0; columns: 2; column-gap: 40px; }
      .toc-item { margin-bottom: 12px; font-size: 14px; color: #334155; page-break-inside: avoid; }
      .toc-num { font-weight: 700; color: #3b82f6; margin-right: 8px; }

      /* Steps */
      .step-section { margin-bottom: 32px; }
      .step-header { display: flex; align-items: flex-start; margin-bottom: 16px; }
      .step-num { 
        font-size: 14px; 
        font-weight: 800; 
        color: #3b82f6; 
        background: #eff6ff; 
        padding: 4px 8px; 
        border-radius: 4px; 
        margin-right: 16px; 
        margin-top: 2px;
      }
      .step-desc { font-size: 14px; color: #6b7280; font-style: italic; }
      
      .step-notes { 
        font-size: 14px; 
        color: #1f2937; 
        white-space: pre-wrap; 
        margin-bottom: 24px; 
        background: #ffffff;
      }
      /* Handle detail tags in print */
      details { border: 1px solid #e5e7eb; padding: 10px; border-radius: 6px; margin-bottom: 10px; }
      summary { font-weight: 600; color: #111827; list-style: none; }
      
      .empty-state { font-size: 12px; color: #9ca3af; font-style: italic; padding: 8px 0; border-bottom: 1px dashed #e5e7eb; }

      /* Assets */
      .assets-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr); /* 2 Column Grid */
        gap: 16px;
        margin-top: 16px;
        page-break-inside: avoid;
      }
      .asset-item {
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 4px;
        background: #fff;
        page-break-inside: avoid;
      }
      .asset-item img {
        width: 100%;
        height: auto;
        max-height: 300px;
        object-fit: contain;
        border-radius: 4px;
        display: block;
      }
      .asset-caption {
        font-size: 10px;
        color: #64748b;
        text-align: center;
        padding: 4px 0 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .divider {
        height: 1px;
        background: #f1f5f9;
        margin: 32px 0;
        width: 100%;
      }
      
      .section-title {
         font-size: 28px;
         margin-bottom: 24px;
         color: #0f172a;
         border-bottom: 4px solid #3b82f6;
         padding-bottom: 8px;
         display: inline-block;
      }
      
      /* Utility */
      @media print {
        /* Hide scrollbars */
        ::-webkit-scrollbar { display: none; }
      }
    </style>
  </head>
  <body>
    
    <!-- COVER PAGE -->
    <div class="cover-page">
      <div class="cover-meta">UX Case Study</div>
      <h1>${escapeHtml(project.title)}</h1>
      <div class="cover-desc">${escapeHtml(project.desc)}</div>
      
      <div class="cover-footer">
        <div>
          <strong>Created:</strong> ${new Date(project.createdAt).toLocaleDateString()}<br>
          <strong>Exported:</strong> ${dateStr}
        </div>
        <div style="text-align:right">
          <strong>Tool:</strong> UXMate Project Coach<br>
          <strong>Status:</strong> ${Object.values(project.steps).filter(s=>s.isComplete).length}/12 Steps Complete
        </div>
      </div>
    </div>

    <!-- TOC PAGE -->
    <div class="toc-page">
      <div class="toc-title">Process Overview</div>
      <ul class="toc-list">
        ${STAGES.filter(s => s.id !== 'casestudy').map((s, i) => `
          <li class="toc-item">
            <span class="toc-num">${String(i+1).padStart(2, '0')}</span>
            ${escapeHtml(s.label.replace(/^\d+\.\s/, ''))}
          </li>
        `).join('')}
        <li class="toc-item">
            <span class="toc-num">End</span>
            Summary & Conclusion
        </li>
      </ul>
    </div>

    <!-- CONTENT -->
    <div class="content-wrapper">
      ${stepsHtml}
      ${summaryHtml}
    </div>

    <!-- AUTO PRINT SCRIPT -->
    <script>
      window.onload = () => {
        // Small delay to ensure images render before print dialog
        setTimeout(() => {
          window.print();
        }, 800);
      };
    </script>
  </body>
  </html>
  `;
}
