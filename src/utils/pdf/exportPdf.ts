import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const appleStyles = `
  body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif;
    color: #1d1d1f;
    font-size: 12px;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
  }

  .pdf-body {
    padding: 0 52px;
  }

  .pdf-body p,
  .pdf-body .message-text {
    margin: 0 0 8px;
    color: #1d1d1f;
    font-size: 12px;
    line-height: 1.55;
    font-weight: 400;
  }

  .pdf-body h1, .pdf-body .message-h1 {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.03em;
    margin: 28px 0 8px;
    color: #1d1d1f;
    line-height: 1.2;
  }

  .pdf-body h2, .pdf-body .message-h2 {
    font-size: 18px;
    font-weight: 650;
    letter-spacing: -0.02em;
    margin: 24px 0 6px;
    color: #1d1d1f;
    line-height: 1.25;
  }

  .pdf-body h3, .pdf-body .message-h3 {
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.01em;
    margin: 20px 0 6px;
    color: #1d1d1f;
    line-height: 1.3;
  }

  .pdf-body h4, .pdf-body .message-h4, .pdf-body h5, .pdf-body .message-h5, .pdf-body h6, .pdf-body .message-h6 {
    font-size: 13px;
    font-weight: 600;
    margin: 16px 0 4px;
    color: #1d1d1f;
  }

  .pdf-body strong { font-weight: 650; color: #1d1d1f; }
  .pdf-body em { font-style: italic; }

  .pdf-body code, .pdf-body .inline-code {
    font-family: 'SF Mono', 'Menlo', 'Monaco', 'Consolas', monospace;
    font-size: 11px;
    background: #f5f5f7;
    color: #1d1d1f;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #e5e5ea;
  }

  .pdf-body pre, .pdf-body .code-block-pre {
    font-family: 'SF Mono', 'Menlo', 'Monaco', 'Consolas', monospace;
    font-size: 11px;
    line-height: 1.5;
    background: #f5f5f7;
    color: #1d1d1f;
    padding: 14px 16px;
    border-radius: 8px;
    border: 1px solid #e5e5ea;
    overflow-x: auto;
    margin: 10px 0;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .pdf-body .code-block-lang {
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
    font-size: 10px;
    font-weight: 600;
    color: #6e6e73;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 6px;
  }

  .pdf-body blockquote, .pdf-body .message-blockquote {
    margin: 12px 0;
    padding: 8px 16px;
    border-left: 3px solid #d2d2d7;
    background: #fafafa;
    border-radius: 4px;
    color: #515154;
  }

  .pdf-body blockquote p { margin: 4px 0; color: #515154; }

  .pdf-body ul, .pdf-body .message-ul, .pdf-body ol, .pdf-body .message-ol {
    margin: 8px 0;
    padding-left: 22px;
    color: #1d1d1f;
  }

  .pdf-body li {
    margin: 3px 0;
    color: #1d1d1f;
    font-size: 12px;
    line-height: 1.5;
  }

  .pdf-body hr, .pdf-body .message-hr {
    border: none;
    height: 1px;
    background: #e5e5ea;
    margin: 20px 0;
  }

  .pdf-body .markdown-table-wrapper {
    margin: 12px 0;
    border-radius: 8px;
    border: 1px solid #e5e5ea;
    overflow: hidden;
  }

  .pdf-body table, .pdf-body .markdown-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
  }

  .pdf-body th {
    background: #f5f5f7;
    color: #1d1d1f;
    font-weight: 600;
    text-align: left;
    padding: 9px 12px;
    border-bottom: 1px solid #e5e5ea;
    font-size: 11px;
  }

  .pdf-body td {
    padding: 8px 12px;
    border-bottom: 1px solid #f0f0f2;
    color: #1d1d1f;
    font-size: 11px;
  }

  .pdf-body tr:last-child td { border-bottom: none; }
  .pdf-body .inline-math-container { display: inline; color: #1d1d1f; }

  .pdf-body .block-math-wrapper { margin: 12px 0; padding: 10px 0; text-align: center; color: #1d1d1f; }
  .pdf-body .block-math-wrapper .katex { font-size: 1.05em; }
  .pdf-body .katex { color: #1d1d1f; }
  .pdf-body .katex .mathnormal { color: #1d1d1f; }
  .pdf-body .message-spacing { height: 2px; }
  .pdf-body .message-text p { margin: 0 0 8px; }
  .pdf-body .math-error { color: #c41e3a; background: transparent; font-family: 'SF Mono', monospace; font-size: 11px; }
  .pdf-body a { color: #0066cc; text-decoration: none; }
  .pdf-body .message-file-card { display: none; }
`;

export async function exportElementToPdf(element: HTMLElement, filename = 'export.pdf') {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.cssText = 'margin:0;padding:0;background:transparent;color:#1d1d1f;';

  const container = document.createElement('div');
  container.style.cssText = 'position:absolute;left:-9999px;top:0;width:800px;';
  container.innerHTML = `<style>${appleStyles}</style><div class="pdf-body"></div>`;

  const body = container.querySelector('.pdf-body') as HTMLElement;
  body.appendChild(clone);

  document.body.appendChild(container);

  try {
    const margin = 18;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageW = 210;
    const pageH = 297;
    const contentW = pageW - margin * 2;
    const contentH = pageH - margin * 2;

    const scale = 2;
    const captureW = 800;
    const captureH = (contentH / contentW) * captureW;

    const totalH = Math.max(body.scrollHeight, 1);

    for (let i = 0; i * captureH < totalH; i++) {
      if (i > 0) pdf.addPage();

      const canvas = await html2canvas(body, {
        scale,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        x: 0,
        y: i * captureH,
        width: captureW,
        height: Math.min(captureH, totalH - i * captureH),
      });

      const imgW = contentW;
      const imgH = (canvas.height * imgW) / canvas.width;
      pdf.addImage(canvas, 'PNG', margin, margin, imgW, imgH);
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}
