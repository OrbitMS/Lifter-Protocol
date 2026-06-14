// Generates brand PLACEHOLDER app icons from vector shapes (no external assets).
// Run: node scripts/gen-icons.mjs
// Swap assets/icon.png etc. with the real logo when available and re-run is not
// needed — just replace the PNGs.

import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assets = join(root, 'assets');
mkdirSync(assets, { recursive: true });

const CHARCOAL = '#101317';
const SKY = '#21B8E8';
const SKY_DK = '#1893C2';

// A simple, recognizable dumbbell centered in a 1024 box.
function dumbbell(color, accent) {
  return `
    <g>
      <rect x="300" y="476" width="424" height="72" rx="20" fill="${color}"/>
      <!-- left plates -->
      <rect x="232" y="372" width="60" height="280" rx="22" fill="${color}"/>
      <rect x="300" y="408" width="44" height="208" rx="18" fill="${accent}"/>
      <!-- right plates -->
      <rect x="680" y="408" width="44" height="208" rx="18" fill="${accent}"/>
      <rect x="732" y="372" width="60" height="280" rx="22" fill="${color}"/>
    </g>`;
}

function svg({ bg, scale = 1, sky = SKY, skyDk = SKY_DK }) {
  const inner = bg ? `<rect width="1024" height="1024" fill="${bg}"/>` : '';
  const t = scale !== 1 ? `<g transform="translate(${512 - 512 * scale}, ${512 - 512 * scale}) scale(${scale})">${dumbbell(sky, skyDk)}</g>` : dumbbell(sky, skyDk);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${inner}${t}</svg>`;
}

async function render(name, markup, size = 1024) {
  await sharp(Buffer.from(markup)).resize(size, size).png().toFile(join(assets, name));
  console.log('wrote', name, `${size}x${size}`);
}

await render('icon.png', svg({ bg: CHARCOAL, scale: 0.92 }));
await render('adaptive-icon.png', svg({ bg: null, scale: 0.62 })); // transparent fg, safe zone
await render('splash-icon.png', svg({ bg: null, scale: 0.5 }));
await render('favicon.png', svg({ bg: CHARCOAL, scale: 0.9 }), 48);
console.log('done');
