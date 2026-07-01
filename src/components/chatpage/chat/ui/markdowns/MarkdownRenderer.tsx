import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import './MarkdownRenderer.css';

interface MarkdownRendererProps {
  content: string;
}

// Render LaTeX via KaTeX with full error tolerance
function renderMath(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: true,
      macros: {
        '\\hbar': '\\hslash',
        '\\bra': '\\langle #1 |',
        '\\ket': '| #1 \\rangle',
        '\\braket': '\\langle #1 \\rangle',
        '\\qty': '#1',
        '\\dd': '\\mathrm{d}',
        '\\vec': '\\boldsymbol{#1}',
        '\\mat': '\\mathbf{#1}',
        '\\abs': '\\left| #1 \\right|',
        '\\norm': '\\left\\| #1 \\right\\|',
      }
    });
  } catch (err) {
    // Never let math errors crash the page — render the raw LaTeX as fallback
    return `<code class="math-error">${latex}</code>`;
  }
}

// ── Inline parser (runs within a text segment, handles bold/italic/inline-code/math) ──────────────────

type InlineToken =
  | { kind: 'bold'; inner: string }
  | { kind: 'italic'; inner: string }
  | { kind: 'inlineCode'; value: string }
  | { kind: 'inlineMath'; latex: string }
  | { kind: 'text'; value: string };

function tokenizeInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let i = 0;

  while (i < text.length) {
    // Inline $$...$$ (before $...$ to avoid double-match)
    if (text[i] === '$' && text[i + 1] === '$') {
      const end = text.indexOf('$$', i + 2);
      if (end !== -1) {
        tokens.push({ kind: 'inlineMath', latex: text.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }

    // Inline $...$
    if (text[i] === '$') {
      const end = text.indexOf('$', i + 1);
      if (end !== -1) {
        tokens.push({ kind: 'inlineMath', latex: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    // Inline code `...`
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1);
      if (end !== -1) {
        tokens.push({ kind: 'inlineCode', value: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    // Bold **...**
    if (text[i] === '*' && text[i + 1] === '*') {
      const end = text.indexOf('**', i + 2);
      if (end !== -1) {
        tokens.push({ kind: 'bold', inner: text.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }

    // Bold __...__ 
    if (text[i] === '_' && text[i + 1] === '_') {
      const end = text.indexOf('__', i + 2);
      if (end !== -1) {
        tokens.push({ kind: 'bold', inner: text.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }

    // Italic *...* (single)
    if (text[i] === '*' && text[i + 1] !== '*') {
      const end = text.indexOf('*', i + 1);
      if (end !== -1) {
        tokens.push({ kind: 'italic', inner: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    // Italic _..._ (single, only if not touching word chars on both ends)
    if (text[i] === '_' && text[i + 1] !== '_') {
      const end = text.indexOf('_', i + 1);
      if (end !== -1) {
        tokens.push({ kind: 'italic', inner: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    // Accumulate plain text
    const lastToken = tokens[tokens.length - 1];
    if (lastToken && lastToken.kind === 'text') {
      lastToken.value += text[i];
    } else {
      tokens.push({ kind: 'text', value: text[i] });
    }
    i++;
  }

  return tokens;
}

function renderInlineTokens(tokens: InlineToken[], keyPrefix: string): React.ReactNode[] {
  return tokens.map((tok, idx) => {
    const key = `${keyPrefix}-${idx}`;
    switch (tok.kind) {
      case 'inlineMath':
        return (
          <span
            key={key}
            className="inline-math-container"
            dangerouslySetInnerHTML={{ __html: renderMath(tok.latex, false) }}
          />
        );
      case 'inlineCode':
        return <code key={key} className="inline-code">{tok.value}</code>;
      case 'bold':
        return (
          <strong key={key}>
            {renderInlineTokens(tokenizeInline(tok.inner), key + '-inner')}
          </strong>
        );
      case 'italic':
        return (
          <em key={key}>
            {renderInlineTokens(tokenizeInline(tok.inner), key + '-inner')}
          </em>
        );
      case 'text':
      default:
        return <React.Fragment key={key}>{tok.value}</React.Fragment>;
    }
  });
}

function parseInline(text: string, keyPrefix: string): React.ReactNode[] {
  return renderInlineTokens(tokenizeInline(text), keyPrefix);
}

// ── Table rendering ─────────────────────────────────────────────────────────────────────────────────

function splitTableRow(rowStr: string): string[] {
  let clean = rowStr.trim();
  if (clean.startsWith('|')) clean = clean.substring(1);
  if (clean.endsWith('|')) clean = clean.substring(0, clean.length - 1);
  return clean.split('|').map(cell => cell.trim());
}

function renderTable(tableLines: string[], key: string): React.ReactNode {
  const headers = splitTableRow(tableLines[0] || '');
  const alignments: Array<'left' | 'center' | 'right' | undefined> = [];

  if (tableLines[1]) {
    for (const cell of splitTableRow(tableLines[1])) {
      const l = cell.startsWith(':');
      const r = cell.endsWith(':');
      if (l && r) alignments.push('center');
      else if (r) alignments.push('right');
      else if (l) alignments.push('left');
      else alignments.push(undefined);
    }
  }

  const rows = tableLines.slice(2).map(r => splitTableRow(r));

  return (
    <div key={key} className="markdown-table-wrapper">
      <table className="markdown-table">
        <thead>
          <tr>
            {headers.map((cell, ci) => (
              <th key={ci} style={{ textAlign: alignments[ci] || 'left' }}>
                {parseInline(cell, `${key}-th-${ci}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {headers.map((_, ci) => (
                <td key={ci} style={{ textAlign: alignments[ci] || 'left' }}>
                  {parseInline(row[ci] || '', `${key}-td-${ri}-${ci}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main block-level tokenizer + renderer ────────────────────────────────────────────────────────────

type BlockToken =
  | { kind: 'blockMath'; latex: string }
  | { kind: 'code'; lang: string; code: string }
  | { kind: 'text'; value: string };

function tokenizeBlocks(content: string): BlockToken[] {
  const blocks: BlockToken[] = [];

  // Split on $$ ... $$ blocks and ``` ... ``` blocks  
  // Use a robust regex that handles newlines inside blocks
  const splitter = /(\$\$[\s\S]*?\$\$|```[\s\S]*?```)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = splitter.exec(content)) !== null) {
    // Text before this block
    if (match.index > lastIndex) {
      blocks.push({ kind: 'text', value: content.slice(lastIndex, match.index) });
    }

    const raw = match[0];
    if (raw.startsWith('$$')) {
      blocks.push({ kind: 'blockMath', latex: raw.slice(2, -2).trim() });
    } else if (raw.startsWith('```')) {
      const inner = raw.slice(3, -3);
      const firstNl = inner.indexOf('\n');
      const lang = firstNl !== -1 ? inner.substring(0, firstNl).trim() : '';
      const code = firstNl !== -1 ? inner.substring(firstNl + 1) : inner;
      blocks.push({ kind: 'code', lang, code });
    }

    lastIndex = match.index + raw.length;
  }

  // Remaining text
  if (lastIndex < content.length) {
    blocks.push({ kind: 'text', value: content.slice(lastIndex) });
  }

  return blocks;
}

function renderLines(text: string, blockIdx: number): React.ReactNode[] {
  const lines = text.split('\n');
  const output: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const key = `b${blockIdx}-l${i}`;

    // Empty line → spacing div
    if (line.trim() === '') {
      output.push(<div key={key} className="message-spacing" />);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(line.trim())) {
      output.push(<hr key={key} className="message-hr" />);
      i++;
      continue;
    }

    // Table detection
    if (
      line.trim().startsWith('|') &&
      i + 1 < lines.length &&
      lines[i + 1].trim().startsWith('|') &&
      /[-:]+/.test(lines[i + 1])
    ) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      output.push(renderTable(tableLines, key));
      continue;
    }

    // Numbered list
    const numberedMatch = line.match(/^(\s*)(\d+)\.\s+(.*)/);
    if (numberedMatch) {
      const items: string[] = [];
      const indent = numberedMatch[1].length;
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*)(\d+)\.\s+(.*)/);
        if (m && m[1].length === indent) {
          items.push(m[3]);
          i++;
        } else break;
      }
      output.push(
        <ol key={key} className="message-ol">
          {items.map((item, ii) => (
            <li key={ii}>{parseInline(item, `${key}-li-${ii}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Unordered list (*, -, +)
    const bulletMatch = line.match(/^(\s*)([\*\-\+])\s+(.*)/);
    if (bulletMatch) {
      const items: string[] = [];
      const indent = bulletMatch[1].length;
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*)([\*\-\+])\s+(.*)/);
        if (m && m[1].length === indent) {
          items.push(m[3]);
          i++;
        } else break;
      }
      output.push(
        <ul key={key} className="message-ul">
          {items.map((item, ii) => (
            <li key={ii}>{parseInline(item, `${key}-li-${ii}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const lines_bq: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        lines_bq.push(lines[i].substring(2));
        i++;
      }
      output.push(
        <blockquote key={key} className="message-blockquote">
          {lines_bq.map((bqLine, bqi) => (
            <p key={bqi}>{parseInline(bqLine, `${key}-bq-${bqi}`)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // Headings
    if (line.startsWith('###### ')) {
      output.push(<h6 key={key} className="message-h6">{parseInline(line.slice(7), key)}</h6>);
    } else if (line.startsWith('##### ')) {
      output.push(<h5 key={key} className="message-h5">{parseInline(line.slice(6), key)}</h5>);
    } else if (line.startsWith('#### ')) {
      output.push(<h4 key={key} className="message-h4">{parseInline(line.slice(5), key)}</h4>);
    } else if (line.startsWith('### ')) {
      output.push(<h3 key={key} className="message-h3">{parseInline(line.slice(4), key)}</h3>);
    } else if (line.startsWith('## ')) {
      output.push(<h2 key={key} className="message-h2">{parseInline(line.slice(3), key)}</h2>);
    } else if (line.startsWith('# ')) {
      output.push(<h1 key={key} className="message-h1">{parseInline(line.slice(2), key)}</h1>);
    } else {
      // Regular paragraph
      output.push(
        <p key={key} className="message-text">
          {parseInline(line, key)}
        </p>
      );
    }

    i++;
  }

  return output;
}

// ── Export ───────────────────────────────────────────────────────────────────────────────────────────

export const MarkdownRenderer = React.memo(function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  const blocks = tokenizeBlocks(content);

  return (
    <div className="markdown-render-body">
      {blocks.map((block, idx) => {
        if (block.kind === 'blockMath') {
          return (
            <div
              key={idx}
              className="block-math-wrapper"
              dangerouslySetInnerHTML={{ __html: renderMath(block.latex, true) }}
            />
          );
        }

        if (block.kind === 'code') {
          return (
            <div key={idx} className="markdown-code-block">
              {block.lang && <div className="code-block-lang">{block.lang}</div>}
              <pre className="code-block-pre">
                <code>{block.code}</code>
              </pre>
            </div>
          );
        }

        // Text block → render line by line
        return (
          <React.Fragment key={idx}>
            {renderLines(block.value, idx)}
          </React.Fragment>
        );
      })}
    </div>
  );
}, (prev, next) => prev.content === next.content);
