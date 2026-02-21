import fs from 'fs';

const files = [
    "pointer_b.svg",
    "drawing_brush.svg",
    "hand_open.svg",
    "hand_closed.svg",
    "resize_a_horizontal.svg",
    "drawing_eraser.svg",
    "line_vertical.svg",
    "hand_point.svg",
    "cross_large.svg"
];

let out = "export const cursors: Record<string, string> = {\n";
for (const f of files) {
    if (fs.existsSync('public/assets/cursors/' + f)) {
        const content = fs.readFileSync('public/assets/cursors/' + f, 'utf8');
        out += `  '${f.replace('.svg', '')}': \`${content.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`,\n`;
    }
}
out += "};\n";

fs.writeFileSync('src/utils/cursors.ts', out);
console.log("Done generating cursors");
