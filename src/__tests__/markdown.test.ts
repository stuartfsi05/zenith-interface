import { describe, expect, it } from "vitest";
import { MarkdownProcessor } from "../markdown";

describe("MarkdownProcessor", () => {
  it("strips legacy thinking blocks before rendering markdown", () => {
    const input =
      "<thinking>internal chain of thought\nline 2</thinking>\n\n### Prompt Final\n```text\nOlá mundo\n```";
    const html = MarkdownProcessor.parse(input);
    expect(html).not.toContain("internal chain of thought");
    expect(html).toContain("<h3>Prompt Final</h3>");
    expect(html).toContain("<pre>");
    expect(html).toContain("Olá mundo");
  });

  it("sanitizes XSS payloads with DOMPurify", () => {
    const html = MarkdownProcessor.parse(
      'Texto seguro <script>alert("xss")</script><img src=x onerror=alert(1)>',
    );
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
    expect(html).toContain("Texto seguro");
  });

  it("escapes HTML characters cleanly", () => {
    expect(MarkdownProcessor.escapeHTML(`<a href="x">'&`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&#39;&amp;",
    );
  });
});
