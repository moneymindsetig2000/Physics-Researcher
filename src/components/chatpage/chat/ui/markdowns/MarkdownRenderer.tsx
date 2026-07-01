import React from 'react';
import './MarkdownRenderer.css';

interface MarkdownRendererProps {
  content: string;
}

// LaTeX to MathML converter
export function parseLatexToMathML(latex: string, isBlock = false): string {
  let clean = latex.trim();
  if (clean.startsWith('$$') && clean.endsWith('$$')) {
    clean = clean.slice(2, -2).trim();
  } else if (clean.startsWith('$') && clean.endsWith('$')) {
    clean = clean.slice(1, -1).trim();
  }

  const greekAndSymbols: Record<string, string> = {
    '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ', '\\epsilon': 'ε',
    '\\zeta': 'ζ', '\\eta': 'η', '\\theta': 'θ', '\\iota': 'ι', '\\kappa': 'κ',
    '\\lambda': 'λ', '\\mu': 'μ', '\\nu': 'ν', '\\xi': 'ξ', '\\pi': 'π',
    '\\rho': 'ρ', '\\sigma': 'σ', '\\tau': 'τ', '\\upsilon': 'υ', '\\phi': 'φ',
    '\\chi': 'χ', '\\psi': 'ψ', '\\omega': 'ω',
    '\\Delta': 'Δ', '\\Gamma': 'Γ', '\\Theta': 'Θ', '\\Lambda': 'Λ', '\\Xi': 'Ξ',
    '\\Pi': 'Π', '\\Sigma': 'Σ', '\\Phi': 'Φ', '\\Psi': 'Ψ', '\\Omega': 'Ω',
    '\\partial': '∂', '\\nabla': '∇', '\\infty': '∞', '\\times': '×', '\\cdot': '·',
    '\\pm': '±', '\\neq': '≠', '\\approx': '≈', '\\propto': '∝', '\\hbar': 'ℏ',
    '\\int': '∫', '\\sum': '∑', '\\prod': '∏', '\\coprod': '∐',
    '\\rightarrow': '→', '\\Rightarrow': '⇒', '\\leftarrow': '←', '\\Leftarrow': '⇐',
    '\\leftrightarrow': '↔', '\\Leftrightarrow': '⇔',
    '\\le': '≤', '\\ge': '≥', '\\leq': '≤', '\\geq': '≥'
  };

  for (const [key, value] of Object.entries(greekAndSymbols)) {
    const escapedKey = key.replace(/\\/g, '\\\\');
    clean = clean.replace(new RegExp(escapedKey, 'g'), value);
  }

  // Tokenizer
  function tokenize(str: string): string[] {
    const tokens: string[] = [];
    let i = 0;
    while (i < str.length) {
      const char = str[i];
      if (/\s/.test(char)) {
        i++;
        continue;
      }
      
      if (char === '\\') {
        let word = '\\';
        i++;
        while (i < str.length && /[a-zA-Z]/.test(str[i])) {
          word += str[i];
          i++;
        }
        tokens.push(word);
        continue;
      }
      
      if (/[0-9]/.test(char) || (char === '.' && i + 1 < str.length && /[0-9]/.test(str[i+1]))) {
        let num = '';
        while (i < str.length && /[0-9\.]/.test(str[i])) {
          num += str[i];
          i++;
        }
        tokens.push(num);
        continue;
      }
      
      if (/[a-zA-Z]/.test(char)) {
        let word = '';
        while (i < str.length && /[a-zA-Z]/.test(str[i])) {
          word += str[i];
          i++;
        }
        tokens.push(word);
        continue;
      }
      
      tokens.push(char);
      i++;
    }
    return tokens;
  }

  const tokens = tokenize(clean);

  // AST Node representation
  class MNode {
    type: string;
    children: MNode[];
    value: string;

    constructor(type: string, children: MNode[] = [], value: string = '') {
      this.type = type;
      this.children = children;
      this.value = value;
    }
    
    toHTML(): string {
      if (this.value) {
        const escaped = this.value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        return `<${this.type}>${escaped}</${this.type}>`;
      }
      const inner = this.children.map(c => c.toHTML()).join('');
      return `<${this.type}>${inner}</${this.type}>`;
    }
  }

  // Parser
  let tIdx = 0;
  function parseExpressionList(): MNode[] {
    const list: MNode[] = [];
    while (tIdx < tokens.length) {
      const token = tokens[tIdx];
      
      if (token === '}') {
        break;
      }
      
      if (token === '{') {
        tIdx++;
        const innerList = parseExpressionList();
        if (tIdx < tokens.length && tokens[tIdx] === '}') {
          tIdx++;
        }
        list.push(new MNode('mrow', innerList));
        continue;
      }

      if (token === '\\frac') {
        tIdx++;
        const num = parseNodeArgument();
        const den = parseNodeArgument();
        list.push(new MNode('mfrac', [num, den]));
        continue;
      }

      if (token === '\\sqrt') {
        tIdx++;
        const inner = parseNodeArgument();
        list.push(new MNode('msqrt', [inner]));
        continue;
      }

      if (token === '\\text') {
        tIdx++;
        const textStr = parseTextString();
        list.push(new MNode('mtext', [], textStr));
        continue;
      }

      if (token === '^' || token === '_') {
        const isSuper = token === '^';
        tIdx++;
        const script = parseNodeArgument();
        const tag = isSuper ? 'msup' : 'msub';
        
        const lastNode = list.pop() || new MNode('mrow');
        list.push(new MNode(tag, [lastNode, script]));
        continue;
      }

      // Base nodes
      if (/^[0-9\.]+$/.test(token)) {
        list.push(new MNode('mn', [], token));
      } else if (/^[\+\-\=\<\>\(\)\[\]\cdot\·\±\neq\approx\≈\propto\*\/\%\,\;\:\!\?]$/.test(token)) {
        list.push(new MNode('mo', [], token));
      } else {
        if (token.length > 1 && !token.startsWith('\\')) {
          list.push(new MNode('mtext', [], token));
        } else {
          list.push(new MNode('mi', [], token));
        }
      }
      tIdx++;
    }
    return list;
  }

  function parseNodeArgument(): MNode {
    if (tIdx < tokens.length && tokens[tIdx] === '{') {
      tIdx++;
      const list = parseExpressionList();
      if (tIdx < tokens.length && tokens[tIdx] === '}') {
        tIdx++;
      }
      return new MNode('mrow', list);
    }
    if (tIdx < tokens.length) {
      const tok = tokens[tIdx];
      tIdx++;
      if (/^[0-9\.]+$/.test(tok)) return new MNode('mn', [], tok);
      if (/^[\+\-\=\<\>\(\)\[\]]$/.test(tok)) return new MNode('mo', [], tok);
      return new MNode('mi', [], tok);
    }
    return new MNode('mrow');
  }

  function parseTextString(): string {
    if (tIdx < tokens.length && tokens[tIdx] === '{') {
      tIdx++;
      let textContent = '';
      while (tIdx < tokens.length && tokens[tIdx] !== '}') {
        textContent += tokens[tIdx] + ' ';
        tIdx++;
      }
      if (tIdx < tokens.length && tokens[tIdx] === '}') {
        tIdx++;
      }
      return textContent.trim();
    }
    if (tIdx < tokens.length) {
      const tok = tokens[tIdx];
      tIdx++;
      return tok;
    }
    return '';
  }

  const nodes = parseExpressionList();
  const displayAttr = isBlock ? ' display="block"' : ' display="inline"';
  const innerHtml = nodes.map(n => n.toHTML()).join('');
  return `<math${displayAttr}>${innerHtml}</math>`;
}

// Recursive inline parser for bold -> italic -> math
function parseBold(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    const key = `${keyPrefix}-b-${idx}`;
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={key}>{parseItalic(part.slice(2, -2), key)}</strong>;
    }
    return parseItalic(part, key);
  });
}

// Italic parsing
function parseItalic(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/(\*.*?\*|_.*?_)/g);
  return parts.map((part, idx) => {
    const key = `${keyPrefix}-i-${idx}`;
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      return <em key={key}>{parseMath(part.slice(1, -1), key)}</em>;
    }
    return parseMath(part, key);
  });
}

// Math parsing
function parseMath(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/(\$.*?\$)/g);
  return parts.map((part, idx) => {
    const key = `${keyPrefix}-m-${idx}`;
    if (part.startsWith('$') && part.endsWith('$')) {
      const mathContent = part.slice(1, -1);
      try {
        const mathHtml = parseLatexToMathML(mathContent, false);
        return (
          <span 
            key={key} 
            className="inline-math-container"
            dangerouslySetInnerHTML={{ __html: mathHtml }} 
          />
        );
      } catch (err) {
        return <code key={key} className="math-error">{part}</code>;
      }
    }
    return part;
  });
}

function parseInlineElements(text: string): React.ReactNode[] {
  return parseBold(text, 'inline');
}

function renderTableBlock(tableLines: string[], key: string): React.ReactNode {
  const splitRow = (rowStr: string) => {
    let clean = rowStr.trim();
    if (clean.startsWith('|')) clean = clean.substring(1);
    if (clean.endsWith('|')) clean = clean.substring(0, clean.length - 1);
    return clean.split('|').map(cell => cell.trim());
  };

  const headerCells = splitRow(tableLines[0] || '');
  
  const alignments: ('left' | 'center' | 'right' | undefined)[] = [];
  if (tableLines[1]) {
    const separatorCells = splitRow(tableLines[1]);
    for (const cell of separatorCells) {
      const leftColon = cell.startsWith(':');
      const rightColon = cell.endsWith(':');
      if (leftColon && rightColon) alignments.push('center');
      else if (rightColon) alignments.push('right');
      else if (leftColon) alignments.push('left');
      else alignments.push(undefined);
    }
  }

  const rowsData = tableLines.slice(2).map(rowLine => splitRow(rowLine));

  return (
    <div key={key} className="markdown-table-wrapper">
      <table className="markdown-table">
        <thead>
          <tr>
            {headerCells.map((cell, colIdx) => (
              <th 
                key={colIdx} 
                style={{ textAlign: alignments[colIdx] || 'left' }}
              >
                {parseInlineElements(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowsData.map((rowCells, rowIdx) => (
            <tr key={rowIdx}>
              {headerCells.map((_, colIdx) => {
                const cellVal = rowCells[colIdx] || '';
                return (
                  <td 
                    key={colIdx} 
                    style={{ textAlign: alignments[colIdx] || 'left' }}
                  >
                    {parseInlineElements(cellVal)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  const tokens = content.split(/(\$\$.*?\$\$|```[\s\S]*?```)/g);

  return (
    <div className="markdown-render-body">
      {tokens.map((token, blockIdx) => {
        if (!token) return null;

        if (token.startsWith('$$') && token.endsWith('$$')) {
          const mathContent = token.slice(2, -2);
          try {
            const mathHtml = parseLatexToMathML(mathContent, true);
            return (
              <div 
                key={blockIdx} 
                className="block-math-wrapper"
                dangerouslySetInnerHTML={{ __html: mathHtml }} 
              />
            );
          } catch (err) {
            return <pre key={blockIdx} className="math-error-block">{token}</pre>;
          }
        }

        if (token.startsWith('```') && token.endsWith('```')) {
          const inner = token.slice(3, -3);
          const firstLineEnd = inner.indexOf('\n');
          const lang = firstLineEnd !== -1 ? inner.substring(0, firstLineEnd).trim() : '';
          const code = firstLineEnd !== -1 ? inner.substring(firstLineEnd + 1) : inner;
          
          return (
            <div key={blockIdx} className="markdown-code-block">
              {lang && <div className="code-block-lang">{lang}</div>}
              <pre className="code-block-pre">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        const lines = token.split('\n');
        const renderedBlocks: React.ReactNode[] = [];
        let i = 0;

        while (i < lines.length) {
          const line = lines[i];

          // Check for empty spacing line
          if (line.trim() === '') {
            renderedBlocks.push(<div key={`${blockIdx}-${i}`} className="message-spacing" />);
            i++;
            continue;
          }

          // Detect table syntax (starts with '|' and next line starts with '|' with colons/dashes)
          if (line.trim().startsWith('|') && i + 1 < lines.length && lines[i+1].trim().startsWith('|') && lines[i+1].includes('-')) {
            const tableLines: string[] = [];
            while (i < lines.length && lines[i].trim().startsWith('|')) {
              tableLines.push(lines[i]);
              i++;
            }
            renderedBlocks.push(renderTableBlock(tableLines, `${blockIdx}-${i}`));
            continue;
          }

          // Standard markdown line formatting
          const key = `${blockIdx}-${i}`;
          
          if (line.startsWith('##### ')) {
            renderedBlocks.push(
              <h5 key={key} className="message-h5">
                {parseInlineElements(line.substring(6))}
              </h5>
            );
          } else if (line.startsWith('#### ')) {
            renderedBlocks.push(
              <h4 key={key} className="message-h4">
                {parseInlineElements(line.substring(5))}
              </h4>
            );
          } else if (line.startsWith('### ')) {
            renderedBlocks.push(
              <h3 key={key} className="message-h3">
                {parseInlineElements(line.substring(4))}
              </h3>
            );
          } else if (line.startsWith('## ')) {
            renderedBlocks.push(
              <h2 key={key} className="message-h2">
                {parseInlineElements(line.substring(3))}
              </h2>
            );
          } else if (line.startsWith('# ')) {
            renderedBlocks.push(
              <h1 key={key} className="message-h1">
                {parseInlineElements(line.substring(2))}
              </h1>
            );
          } else if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
            const cleanLine = line.trim().substring(2);
            renderedBlocks.push(
              <p key={key} className="message-text message-bullet">
                • {parseInlineElements(cleanLine)}
              </p>
            );
          } else {
            renderedBlocks.push(
              <p key={key} className="message-text">
                {parseInlineElements(line)}
              </p>
            );
          }
          i++;
        }

        return renderedBlocks;
      })}
    </div>
  );
}
