import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MarkdownMessage } from "./MarkdownMessage";

describe("MarkdownMessage", () => {
  it("renders plain text without artifacts", () => {
    const markup = renderToStaticMarkup(<MarkdownMessage text="Hello world" />);
    expect(markup).toContain("Hello world");
  });

  it("renders bold text", () => {
    const markup = renderToStaticMarkup(<MarkdownMessage text="This is **bold** text" />);
    expect(markup).toContain("<strong>bold</strong>");
  });

  it("renders inline code", () => {
    const markup = renderToStaticMarkup(<MarkdownMessage text="Use the `printf` function" />);
    expect(markup).toContain("<code>printf</code>");
  });

  it("renders links", () => {
    const markup = renderToStaticMarkup(<MarkdownMessage text="See [the docs](https://example.com)" />);
    expect(markup).toContain("href=\"https://example.com\"");
    expect(markup).toContain(">the docs<");
  });

  it("renders headings", () => {
    const markup = renderToStaticMarkup(<MarkdownMessage text="## Section Title\n\nContent" />);
    expect(markup).toContain("Section Title");
    expect(markup).toContain("Content");
  });

  it("renders unordered lists", () => {
    const markup = renderToStaticMarkup(<MarkdownMessage text="- Item 1\n- Item 2" />);
    expect(markup).toContain("Item 1");
    expect(markup).toContain("Item 2");
  });

  it("escapes raw HTML (XSS safety)", () => {
    const markup = renderToStaticMarkup(<MarkdownMessage text='<script>alert("xss")</script>' />);
    expect(markup).not.toContain("<script>");
    expect(markup).toContain("&lt;script&gt;");
  });

  it("renders fenced code block with language and copy button", () => {
    const markup = renderToStaticMarkup(
      <MarkdownMessage text={"```javascript\nconst x = 1;\n```"} />
    );
    expect(markup).toContain("const"); // syntax-highlighted tokens split the string
    expect(markup).toContain("Copy code block");
    expect(markup).toContain("Copy");
  });

  it("renders fenced code block without language as plain monospace", () => {
    const markup = renderToStaticMarkup(
      <MarkdownMessage text={"```\nplain code\nno language\n```"} />
    );
    expect(markup).toContain("plain code");
    expect(markup).toContain("no language");
    expect(markup).toContain("Copy code block");
  });

  it("renders copy button with correct aria-label for code blocks", () => {
    const markup = renderToStaticMarkup(
      <MarkdownMessage text={"```json\n{\"key\": \"value\"}\n```"} />
    );
    expect(markup).toContain('aria-label="Copy code block"');
    expect(markup).toContain("title=\"Copy code block\"");
  });
});
