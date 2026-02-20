/**
 * Simple Markdown renderer for GitHub release notes.
 * Converts common Markdown syntax to HTML strings.
 */
export function parseMarkdown(md: string): string {
    if (!md) return "";

    const lines = md.split("\n");
    const html: string[] = [];
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Close list if we're no longer in one
        if (inList && !line.match(/^\s*[-*]\s/)) {
            html.push("</ul>");
            inList = false;
        }

        // Headings: ### h3, ## h2, # h1
        if (line.match(/^###\s+/)) {
            line = line.replace(/^###\s+(.*)/, '<h4 class="text-xs font-semibold text-foreground mt-3 mb-1">$1</h4>');
            html.push(line);
            continue;
        }
        if (line.match(/^##\s+/)) {
            line = line.replace(/^##\s+(.*)/, '<h3 class="text-sm font-semibold text-foreground mt-3 mb-1">$1</h3>');
            html.push(line);
            continue;
        }
        if (line.match(/^#\s+/)) {
            line = line.replace(/^#\s+(.*)/, '<h3 class="text-sm font-bold text-foreground mt-2 mb-1">$1</h3>');
            html.push(line);
            continue;
        }

        // Unordered list items: - item or * item
        if (line.match(/^\s*[-*]\s/)) {
            if (!inList) {
                html.push('<ul class="list-disc list-inside space-y-0.5 ml-1">');
                inList = true;
            }
            line = line.replace(/^\s*[-*]\s+(.*)/, "<li>$1</li>");
            // Inline formatting within list items
            line = applyInlineFormatting(line);
            html.push(line);
            continue;
        }

        // Empty line
        if (line.trim() === "") {
            html.push('<div class="h-1"></div>');
            continue;
        }

        // Regular paragraph
        line = applyInlineFormatting(line);
        html.push(`<p>${line}</p>`);
    }

    // Close any open list
    if (inList) {
        html.push("</ul>");
    }

    return html.join("\n");
}

function applyInlineFormatting(text: string): string {
    // Bold: **text** or __text__
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>');
    text = text.replace(/__(.+?)__/g, '<strong class="text-foreground font-semibold">$1</strong>');
    // Italic: *text* or _text_
    text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
    text = text.replace(/_(.+?)_/g, "<em>$1</em>");
    // Inline code: `code`
    text = text.replace(
        /`(.+?)`/g,
        '<code class="px-1 py-0.5 rounded bg-secondary/50 text-primary text-[0.7rem] font-mono">$1</code>'
    );
    // Links: [text](url)
    text = text.replace(
        /\[(.+?)\]\((.+?)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>'
    );
    return text;
}
