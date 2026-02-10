"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassPanel } from "@/components/GlassPanel";
import { CodeBlockProps } from "@/lib/types";

const KEYWORDS = [
  "function", "const", "let", "var", "if", "else", "for", "while", "return",
  "import", "export", "from", "default", "class", "extends", "async", "await",
  "try", "catch", "finally", "throw", "new", "this", "super", "typeof",
  "interface", "type", "enum", "namespace", "module", "require"
];

const TYPES = ["string", "number", "boolean", "object", "array", "void", "any"];

function highlightCode(code: string): React.ReactNode[] {
  const lines = code.split("\n");
  return lines.map((line, lineIndex) => {
    const words = line.split(/(\s+)/);
    return (
      <div key={lineIndex} className="flex">
        <span className="text-white/30 mr-4 select-none">{lineIndex + 1}</span>
        <span className="flex-1">
          {words.map((word, wordIndex) => {
            if (KEYWORDS.includes(word.trim())) {
              return (
                <span key={wordIndex} className="text-blue-400">
                  {word}
                </span>
              );
            }
            if (TYPES.includes(word.trim())) {
              return (
                <span key={wordIndex} className="text-emerald-400">
                  {word}
                </span>
              );
            }
            if (word.match(/^["'].*["']$/)) {
              return (
                <span key={wordIndex} className="text-amber-400">
                  {word}
                </span>
              );
            }
            if (word.match(/^[0-9]+$/)) {
              return (
                <span key={wordIndex} className="text-purple-400">
                  {word}
                </span>
              );
            }
            if (word.match(/^\/\/.*$/)) {
              return (
                <span key={wordIndex} className="text-gray-500">
                  {word}
                </span>
              );
            }
            return word;
          })}
        </span>
      </div>
    );
  });
}

export function CodeBlock({ code, language = "typescript" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <GlassPanel className="relative">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.12]">
        <span className="text-sm font-medium text-white/60">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/50 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm font-mono text-white/80">
          {highlightCode(code)}
        </code>
      </pre>
    </GlassPanel>
  );
}