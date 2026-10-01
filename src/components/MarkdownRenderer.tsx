import React, { useState } from 'react';
import { Copy, Check, Terminal, ExternalLink, Code2, Play } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isStreaming }) => {
  // Strip out <think> tags if present in the content (they are handled in the reasoning box)
  const cleanedContent = content.replace(/<think>[\s\S]*?(<\/think>|$)/gi, '').trim();

  // If streaming and content is empty after stripping <think>
  if (!cleanedContent && isStreaming) {
    return (
      <div className="flex items-center gap-1.5 py-1 text-gray-400">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-sm font-medium">Generating response...</span>
      </div>
    );
  }

  // Parse blocks: code blocks vs text blocks
  const blocks = parseBlocks(cleanedContent);

  return (
    <div className="prose prose-invert max-w-none text-gray-200 leading-relaxed text-[15px] space-y-3">
      {blocks.map((block, index) => {
        if (block.type === 'code') {
          return <CodeBlock key={index} code={block.content} language={block.language || 'text'} />;
        }
        return <FormattedTextBlock key={index} text={block.content} />;
      })}
    </div>
  );
};

interface Block {
  type: 'text' | 'code';
  content: string;
  language?: string;
}

function parseBlocks(markdown: string): Block[] {
  const blocks: Block[] = [];
  const codeBlockRegex = /```([a-zA-Z0-9_\-+]*)\n([\s\S]*?)(?:```|$)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    if (match.index > lastIndex) {
      const textPart = markdown.slice(lastIndex, match.index).trim();
      if (textPart) {
        blocks.push({ type: 'text', content: textPart });
      }
    }

    blocks.push({
      type: 'code',
      language: match[1] || 'text',
      content: match[2].replace(/\n$/, ''),
    });

    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < markdown.length) {
    const remainingText = markdown.slice(lastIndex).trim();
    if (remainingText) {
      blocks.push({ type: 'text', content: remainingText });
    }
  }

  return blocks;
}

const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isHtml = language.toLowerCase() === 'html';

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-gray-700/70 bg-[#171717] shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-[#212121] border-b border-gray-700/60 text-xs text-gray-400 font-mono">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-gray-300 uppercase tracking-wider">{language || 'CODE'}</span>
        </div>
        <div className="flex items-center gap-2">
          {isHtml && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-700/50 hover:bg-gray-700 text-gray-200 transition-colors text-xs"
              title="Toggle preview"
            >
              <Play className="w-3 h-3 text-cyan-400" />
              <span>{showPreview ? 'Show Code' : 'Preview'}</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-700/50 hover:bg-gray-700 text-gray-200 transition-colors text-xs cursor-pointer active:scale-95"
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {showPreview && isHtml ? (
        <div className="p-4 bg-white rounded-b-xl overflow-auto max-h-96 text-black">
          <iframe
            srcDoc={code}
            title="Preview"
            sandbox="allow-scripts"
            className="w-full min-h-[240px] border-0"
          />
        </div>
      ) : (
        <pre className="p-4 overflow-x-auto text-[13.5px] font-mono leading-relaxed text-gray-100 bg-[#0d0d0d] selection:bg-emerald-800">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
};

const FormattedTextBlock: React.FC<{ text: string }> = ({ text }) => {
  // Check if text block is a markdown table
  if (isMarkdownTable(text)) {
    return <TableBlock text={text} />;
  }

  // Split into lines/paragraphs
  const lines = text.split('\n');

  return (
    <div className="space-y-2">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Heading 1
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={idx} className="text-2xl font-bold text-white tracking-tight mt-5 mb-2 pb-1 border-b border-gray-700/50">
              {renderInline(trimmed.slice(2))}
            </h1>
          );
        }

        // Heading 2
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={idx} className="text-xl font-semibold text-white tracking-tight mt-4 mb-2">
              {renderInline(trimmed.slice(3))}
            </h2>
          );
        }

        // Heading 3
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-lg font-semibold text-gray-100 mt-3 mb-1.5">
              {renderInline(trimmed.slice(4))}
            </h3>
          );
        }

        // Blockquote
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={idx} className="pl-4 border-l-3 border-emerald-500/80 my-2 text-gray-300 italic bg-gray-800/30 py-1 rounded-r">
              {renderInline(trimmed.slice(2))}
            </blockquote>
          );
        }

        // Unordered list item
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2.5 ml-2 my-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
              <div className="flex-1">{renderInline(trimmed.slice(2))}</div>
            </div>
          );
        }

        // Ordered list item
        const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (orderedMatch) {
          return (
            <div key={idx} className="flex items-start gap-2.5 ml-2 my-0.5">
              <span className="font-mono text-xs font-bold text-emerald-400 mt-1 shrink-0 w-4 text-right">
                {orderedMatch[1]}.
              </span>
              <div className="flex-1">{renderInline(orderedMatch[2])}</div>
            </div>
          );
        }

        // Standard paragraph
        return (
          <p key={idx} className="my-1.5">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
};

function isMarkdownTable(text: string): boolean {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return false;
  return lines[0].includes('|') && lines[1].includes('|') && lines[1].includes('-');
}

const TableBlock: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.trim().split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) return <div>{text}</div>;

  const headerCells = lines[0]
    .split('|')
    .map((c) => c.trim())
    .filter((c, i, arr) => (i === 0 && !c ? false : i === arr.length - 1 && !c ? false : true));

  const bodyRows = lines
    .slice(2)
    .map((row) =>
      row
        .split('|')
        .map((c) => c.trim())
        .filter((c, i, arr) => (i === 0 && !c ? false : i === arr.length - 1 && !c ? false : true))
    );

  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-gray-700/80 shadow-md">
      <table className="w-full text-left text-sm text-gray-200 border-collapse">
        <thead className="bg-[#292929] text-xs font-semibold text-gray-300 uppercase tracking-wider border-b border-gray-700">
          <tr>
            {headerCells.map((header, i) => (
              <th key={i} className="px-4 py-3 font-medium border-r border-gray-700/60 last:border-r-0">
                {renderInline(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700/50 bg-[#1c1c1c]">
          {bodyRows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-gray-800/40 transition-colors">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-4 py-2.5 text-gray-300 border-r border-gray-700/40 last:border-r-0">
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Parses inline bold, italic, code, and links
function renderInline(text: string): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  // Tokenize regex for inline elements: `code`, **bold**, *italic*, [link](url)
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;

  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      elements.push(text.slice(lastIdx, match.index));
    }

    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      const code = token.slice(1, -1);
      elements.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700/70 font-mono text-[13px] text-emerald-300 select-all"
        >
          {code}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      elements.push(
        <strong key={match.index} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      elements.push(
        <em key={match.index} className="italic text-gray-300">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('[') && token.includes('](')) {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        elements.push(
          <a
            key={match.index}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
          >
            {linkMatch[1]}
            <ExternalLink className="w-3 h-3 inline ml-0.5" />
          </a>
        );
      } else {
        elements.push(token);
      }
    } else {
      elements.push(token);
    }

    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    elements.push(text.slice(lastIdx));
  }

  return elements;
}
