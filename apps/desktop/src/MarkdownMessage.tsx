import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders assistant message text as Markdown.
 * - Supports headings, bold, italic, inline code, links, lists, blockquotes, horizontal rules.
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
          }
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
