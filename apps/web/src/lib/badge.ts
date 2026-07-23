import { escapeXml } from "./edge-cache";

/**
 * A shields-style "made in algeria" SVG badge for project READMEs. Every embed
 * is an honest backlink from a GitHub repo to its listing, a value-first way to
 * grow the directory's link graph. Rendered server-side, edge-cached.
 */
function segWidth(text: string): number {
  return Math.round(text.length * 6.5) + 14;
}

export function renderBadge(label: string, value: string): string {
  const lw = segWidth(label);
  const vw = segWidth(value);
  const w = lw + vw;
  const h = 20;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" role="img" ` +
    `aria-label="${escapeXml(label)}: ${escapeXml(value)}">` +
    `<rect width="${w}" height="${h}" rx="3" fill="#1a4d3c"/>` +
    `<rect x="${lw}" width="${vw}" height="${h}" rx="3" fill="#e8efe9"/>` +
    `<rect x="${lw}" width="6" height="${h}" fill="#e8efe9"/>` +
    `<g font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">` +
    `<text x="${lw / 2}" y="14" fill="#ffffff" text-anchor="middle">${escapeXml(label)}</text>` +
    `<text x="${lw + vw / 2}" y="14" fill="#1a4d3c" text-anchor="middle">${escapeXml(value)}</text>` +
    `</g></svg>`
  );
}
