import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// Original vector geometry. All application and downloadable marks come from here.
const output = fileURLToPath(new URL("../public/", import.meta.url));
const ink = "#163d30";
const mint = "#b8efd0";
const paper = "#f6faf7";
const palettes = {
  dark: { mark: ink, type: ink },
  light: { mark: mint, type: paper },
  black: { mark: "#111111", type: "#111111" },
  white: { mark: "#ffffff", type: "#ffffff" },
};

// The second shoulder of the m continues into the forehead, nose and jaw.
const contour = "M12 47V28C12 21 16 17 22 17S32 21 32 28V46M32 28C32 20 36 15 43 15S55 20 55 28C55 33 56 35 59 39H54V44C54 50 50 54 44 54H41";
const mark = (color, weight = 5.5) => `<path d="${contour}" fill="none" stroke="${color}" stroke-width="${weight}" stroke-linecap="round" stroke-linejoin="round"/>`;

// Outlined, custom lowercase lettering: no fonts or external assets are required.
const letters = `<path d="M0 48V20H5.5V23.5C7.4 20.8 10 19.4 13.5 19.4C17.5 19.4 20.4 21.1 22 24C24.1 20.9 27.1 19.4 31 19.4C37.9 19.4 41.8 23.5 41.8 30.5V48H36V31.2C36 26.7 34.1 24.5 30.5 24.5C26.8 24.5 24 27.3 24 31.9V48H18.2V31.2C18.2 26.7 16.2 24.5 12.7 24.5C8.7 24.5 5.8 27.5 5.8 32.3V48Z"/>
<path d="M51 40.3C54.4 42.8 57.8 44 61.1 44C65 44 67.3 42.5 67.3 40.3C67.3 38.1 65 37.5 60.4 36.4C54.7 35 50.8 33.4 50.8 28.4C50.8 23 55.3 19.4 61.7 19.4C65.8 19.4 69.5 20.6 72.4 22.7L69.7 26.9C67.2 25.2 64.5 24.3 61.7 24.3C58.5 24.3 56.5 25.6 56.5 27.8C56.5 29.8 58.9 30.6 63.4 31.7C69.5 33.2 73 35.1 73 39.9C73 45.5 68.2 48.6 61.1 48.6C56.4 48.6 52 47 48.3 44.3Z"/>
<path d="M82 48V9H87.8V32.4L100.5 20H108L96 31.7L108.8 48H101.5L91.9 35.5L87.8 39.4V48Z"/>
<path d="M116.5 20H122.3V48H116.5Z"/>
<circle cx="119.4" cy="11.8" r="3.3"/>
<path d="M132 48V20H137.5V23.8C139.6 20.9 142.7 19.4 146.7 19.4C153.6 19.4 157.5 23.6 157.5 30.9V48H151.7V31.7C151.7 26.9 149.6 24.5 145.6 24.5C141.1 24.5 137.8 27.7 137.8 32.5V48Z"/>`;
const wordmark = color => `<g fill="${color}">${letters}</g>`;
const horizontal = palette => `${mark(palette.mark)}<g transform="translate(78 7)">${wordmark(palette.type)}</g>`;
const stacked = palette => `<g transform="translate(22.4 0) scale(1.6)">${mark(palette.mark)}</g><g transform="translate(1.25 102)">${wordmark(palette.type)}</g>`;
const svg = (width, height, content) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none"><title>mskin</title>${content}</svg>\n`;
const save = (filename, content) => writeFile(`${output}${filename}`, content);

await mkdir(`${output}brand`, { recursive: true });
for (const [tone, palette] of Object.entries(palettes)) {
  await save(tone === "dark" ? "mskin-logo.svg" : `brand/mskin-logo-${tone}.svg`, svg(244, 72, horizontal(palette)));
  if (tone === "dark" || tone === "light") {
    await save(`brand/mskin-mark-${tone}.svg`, svg(72, 72, mark(palette.mark)));
    await save(`brand/mskin-stacked-${tone}.svg`, svg(160, 158, stacked(palette)));
  }
}

const tile = (radius = 20, safe = false, weight = 5.5) => svg(72, 72,
  `<rect width="72" height="72" rx="${radius}" fill="${ink}"/>` +
  (safe ? `<g transform="translate(5.4 5.4) scale(.85)">${mark(mint, weight)}</g>` : mark(mint, weight)),
);
await save("favicon.svg", tile(20, false, 6));
for (const [filename, size, radius, safe, weight] of [
  ["favicon-32.png", 32, 20, false, 6],
  ["icon-192.png", 192, 20, false, 5.5],
  ["icon-512.png", 512, 20, false, 5.5],
  ["maskable.png", 512, 0, true, 5.5],
  ["apple-icon.png", 180, 0, true, 5.5],
]) {
  await sharp(Buffer.from(tile(radius, safe, weight)), { density: 768 }).resize(size, size).png().toFile(`${output}${filename}`);
}

// A portable contact sheet for reviewing the actual vector exports at both scales.
const label = (x, y, text, color = "#50695d", size = 14) => `<text x="${x}" y="${y}" fill="${color}" font-family="Arial, sans-serif" font-size="${size}" letter-spacing="1.5">${text}</text>`;
const preview = svg(1600, 1080, `
  <rect width="1600" height="1080" fill="#edf2ee"/>
  ${label(64, 55, "mskin / BRAND IDENTITY", ink, 17)}
  ${label(1130, 55, "THE HUMAN SIDE OF SKIN", "#50695d", 13)}
  <rect x="48" y="88" width="1504" height="474" rx="24" fill="${paper}"/>
  ${label(88, 134, "01 / PRIMARY SIGNATURE")}
  <g transform="translate(312 175) scale(4)">${horizontal(palettes.dark)}</g>
  ${label(88, 525, "A SINGLE CONTOUR. A HUMAN PROFILE.", "#50695d", 12)}
  <rect x="48" y="582" width="744" height="264" rx="22" fill="${ink}"/>
  ${label(80, 623, "02 / ON DARK", mint, 12)}
  <g transform="translate(176 660) scale(2)">${horizontal(palettes.light)}</g>
  <rect x="808" y="582" width="744" height="264" rx="22" fill="#ffffff"/>
  ${label(840, 623, "03 / MONOCHROME", "#50695d", 12)}
  <g transform="translate(936 660) scale(2)">${horizontal(palettes.black)}</g>
  <rect x="48" y="866" width="744" height="166" rx="22" fill="#ffffff"/>
  ${label(80, 902, "04 / APP ICON &amp; SMALL SIZES", "#50695d", 12)}
  <g transform="translate(83 922) scale(1.1)"><rect width="72" height="72" rx="20" fill="${ink}"/>${mark(mint)}</g>
  ${[16, 24, 32, 48].map((size, i) => `<g transform="translate(${246 + i * 100} ${966 - size / 2}) scale(${size / 72})"><rect width="72" height="72" rx="20" fill="${ink}"/>${mark(mint, size === 16 ? 6 : 5.5)}</g>${label(246 + i * 100, 1010, `${size}PX`, "#50695d", 10)}`).join("")}
  <rect x="808" y="866" width="744" height="166" rx="22" fill="${paper}"/>
  ${label(840, 902, "05 / CORE PALETTE", "#50695d", 12)}
  <rect x="840" y="922" width="204" height="78" rx="12" fill="${ink}"/>
  ${label(860, 967, "#163D30", paper, 14)}
  <rect x="1060" y="922" width="204" height="78" rx="12" fill="${mint}"/>
  ${label(1080, 967, "#B8EFD0", ink, 14)}
  <rect x="1280" y="922" width="240" height="78" rx="12" fill="${paper}" stroke="#ccd9cf"/>
  ${label(1300, 967, "#F6FAF7", ink, 14)}
`);
await sharp(Buffer.from(preview)).png().toFile(`${output}brand/mskin-preview.png`);
console.log("Generated mskin vector variants, app icons, favicon and brand preview.");
