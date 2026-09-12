// Run from any directory: node packages/web/scripts/generate-social-image.mjs
// Uses the existing Sherlock mark. All other artwork is vector geometry.
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

const mark = (await readFile(new URL('../public/sherlock-mark.png', import.meta.url))).toString('base64');
const glyphs = {
    S: ['11111','10000','10000','11111','00001','00001','11111'],
    h: ['10000','10000','10110','11001','10001','10001','10001'],
    e: ['00000','00000','01110','10001','11111','10000','01111'],
    r: ['00000','00000','10111','11000','10000','10000','10000'],
    l: ['110','010','010','010','010','010','011'],
    o: ['00000','00000','01110','10001','10001','10001','01110'],
    c: ['00000','00000','01111','10000','10000','10000','01111'],
    k: ['10000','10000','10010','10100','11000','10100','10010'],
};
let x = 466;
const wordmark = [...'Sherlock'].map(letter => {
    const rows = glyphs[letter];
    const pixels = rows.flatMap((row, y) => [...row].map((pixel, col) => pixel === '1'
        ? `<rect x="${x + col * 8}" y="${162 + y * 8}" width="8" height="8"/>` : '')).join('');
    x += (rows[0].length + 1) * 8;
    return pixels;
}).join('');
const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
<defs>
  <radialGradient id="bloom"><stop stop-color="#6d28d9" stop-opacity=".4"/><stop offset="1" stop-color="#100c19" stop-opacity="0"/></radialGradient>
  <linearGradient id="line"><stop stop-color="#b58aff"/><stop offset="1" stop-color="#5de2ef"/></linearGradient>
  <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="#b58aff" stroke-opacity=".065"/></pattern>
</defs>
<rect width="1200" height="630" fill="#100c19"/>
<ellipse cx="600" cy="245" rx="640" ry="430" fill="url(#bloom)"/>
<rect width="1200" height="630" fill="url(#grid)"/>
<rect x="24" y="24" width="1152" height="582" rx="22" fill="none" stroke="#b58aff" stroke-opacity=".2"/>
<rect x="500" y="24" width="200" height="3" rx="1.5" fill="url(#line)"/>
<image href="data:image/png;base64,${mark}" x="322" y="139" width="132" height="88" preserveAspectRatio="xMidYMid meet"/>
<g fill="#f4ebff">${wordmark}</g>
<text x="600" y="321" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="59" font-weight="700" letter-spacing="-2" fill="#f4effb">Your codebase, connected.</text>
<text x="600" y="373" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="25" fill="#bcb0cc">Search and explore code. On your own infrastructure.</text>
<rect x="267" y="428" width="666" height="66" rx="14" fill="#1d152d" stroke="#745299"/>
<circle cx="302" cy="459" r="9" fill="none" stroke="#c298ff" stroke-width="2.5"/>
<path d="m309 466 6 6" stroke="#c298ff" stroke-width="2.5" stroke-linecap="round"/>
<text x="338" y="467" font-family="Menlo, monospace" font-size="20" fill="#e0d3f1">Find something in your code...</text>
<rect x="861" y="445" width="48" height="32" rx="6" fill="#2f2244"/>
<path d="M891 454v9h-13m5-5-5 5 5 5" fill="none" stroke="#c6afdf" stroke-width="2" stroke-linejoin="round"/>
<circle cx="473" cy="546" r="4" fill="#6de0d1"/>
<text x="489" y="552" font-family="Helvetica, Arial, sans-serif" font-size="17" letter-spacing="2" fill="#a998bd">SELF-HOSTED CODE SEARCH</text>
</svg>`;
await sharp(Buffer.from(svg)).png().toFile(new URL('../public/sherlock-social.png', import.meta.url).pathname);
console.log('Generated sherlock-social.png (1200 × 630)');
