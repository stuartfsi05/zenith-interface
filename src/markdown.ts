import { marked } from "marked";
import DOMPurify from "dompurify";

marked.setOptions({
  gfm: true,
  breaks: true,
});

export const MarkdownProcessor = {
  stripThinkingBlocks: (markdown: string): string => {
    return markdown.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "").trim();
  },

  parse: (markdown: string): string => {
    const cleaned = MarkdownProcessor.stripThinkingBlocks(markdown);
    const rawHtml = marked.parse(cleaned, { async: false }) as string;
    return DOMPurify.sanitize(rawHtml);
  },

  escapeHTML: (str: string): string => {
    return str.replace(
      /[&<>'"]/g,
      (tag) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          '"': "&quot;",
        })[tag] || tag,
    );
  },
};
