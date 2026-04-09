import { marked } from "marked";
import DOMPurify from "dompurify";

marked.setOptions({
  gfm: true,
  breaks: true,
});

// Use local state outside the function if we were doing debounce, but since it's synchronous here:
// Future optimization (Priority 4): implement debouncing for very fast streams.
export const MarkdownProcessor = {
  parse: (markdown: string): string => {
    const rawHtml = marked.parse(markdown, { async: false }) as string;
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
