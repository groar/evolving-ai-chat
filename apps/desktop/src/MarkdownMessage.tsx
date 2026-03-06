import { useCallback, useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

/**
 * Renders assistant message text as Markdown.
 * - Supports headings, bold, italic, inline code, links, lists, blockquotes, horizontal rules.
 * - Fenced code blocks: syntax highlighting and copy-to-clipboard.
 * - Links open in the default browser (uses window.open in Tauri webview).
 * - Raw HTML is not rendered (react-markdown escapes it by default — XSS safe).
 */
export function MarkdownMessage({ text }: { text: string }) {
  return (
    <div className="prose prose-sm prose-neutral max-w-none m-0 text-[0.9375rem] leading-relaxed [&_a]:text-primary [&_a]:underline [&_a]:hover:text-primary/80 [&_pre]:bg-muted [&_pre]:rounded [&_pre]:p-2 [&_pre]:overflow-x-auto">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children, ...props }) => {
            const url = href ?? "#";
            const isExternal = url.startsWith("http://") || url.startsWith("https://");
            return (
              <a
                {...props}
                href={url}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                onClick={
                  isExternal
                    ? (e) => {
                        e.preventDefault();
                        window.open(url, "_blank", "noopener,noreferrer");
                      }
                    : undefined
                }
              >
                {children}
              </a>
            );
          },
          code: ({ node, inline, className, children, ...props }) => {
            if (inline) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
            const code = String(children).replace(/\n$/, "");
            const match = /language-(\w+)/.exec(className ?? "");
            const lang = match?.[1] ?? "";
            return (
              <CodeBlock code={code} language={lang} />
            );
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

const SUPPORTED_LANGUAGES = new Set([
  "javascript", "js", "typescript", "ts", "python", "py", "rust", "rs",
  "html", "css", "json", "bash", "sh", "shell",
]);

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in some contexts; user still sees button
    }
  }, [code]);

  const normalizedLang = language.toLowerCase() || "";
  const useHighlighting = !!language && SUPPORTED_LANGUAGES.has(normalizedLang);
  const prismLang =
    normalizedLang === "js" ? "javascript"
    : normalizedLang === "py" ? "python"
    : normalizedLang === "rs" ? "rust"
    : normalizedLang === "ts" ? "typescript"
    : normalizedLang === "sh" || normalizedLang === "shell" ? "bash"
    : normalizedLang || "text";

  return (
    <div className="relative my-2 rounded bg-muted/50 border border-border overflow-hidden">
      <div className="absolute top-1.5 right-1.5 z-10 opacity-100">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 transition-colors"
          title="Copy code block"
          aria-label={copied ? "Copied" : "Copy code block"}
        >
          {copied ? (
            <>
              <CheckIcon className="size-3" aria-hidden />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <CopyIcon className="size-3" aria-hidden />
              <span className="sr-only sm:not-sr-only">Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto max-h-[24rem] overflow-y-auto">
        {useHighlighting && prismLang !== "text" ? (
          <SyntaxHighlighter
            language={prismLang}
            style={oneLight}
            PreTag="div"
            customStyle={{
              margin: 0,
              padding: "0.75rem 1rem",
              paddingTop: "2.25rem",
              fontSize: "0.8125rem",
              lineHeight: 1.5,
              background: "transparent",
              borderRadius: 0,
            }}
            codeTagProps={{ style: { fontFamily: "ui-monospace, monospace" } }}
            showLineNumbers={false}
          >
            {code}
          </SyntaxHighlighter>
        ) : (
          <div className="m-0 p-4 pt-10 text-[0.8125rem] leading-relaxed font-mono whitespace-pre overflow-x-auto">
            <code>{code}</code>
          </div>
        )}
      </div>
    </div>
  );
}
