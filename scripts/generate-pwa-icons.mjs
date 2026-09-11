/**
 * Generates PWA icons (PNG 192/512, maskable variants, favicon-size PNGs)
 * and an apple-touch-icon from the brand logo mark using zero external
 * dependencies — a hand-rolled PNG encoder with zlib from node.
 *
 * The manifest previously referenced /icon-192.png and /icon-512.png, which
 * were never committed: Chrome DevTools and Lighthouse report install
 * failures ("Download error: 404") and the install prompt never fires.
 * Run: node scripts/generate-pwa-icons.mjs
 */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const PUBLIC_DIR = join(process.cwd(), "public");

// ----------------------------------------------------------------------------
// Minimal PNG encoder (RGBA, no interlace)
// ----------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([len, typeAndData, crc]);
}

/** Encodes RGBA pixel data (width*height*4 bytes) as a PNG buffer. */
function encodePNG(width, height, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // raw scanlines each prefixed with filter byte 0
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ----------------------------------------------------------------------------
// Brand mark rendering — gauge glyph on brand-blue rounded square
// ----------------------------------------------------------------------------

const BRAND_BLUE = [37, 99, 235]; // #2563eb (brand-600)
const WHITE = [255, 255, 255];

/**
 * Draws the EquipChain gauge mark into an RGBA buffer of the given size.
 * The mark is a filled rounded square with a white gauge: an arc from 135°
 * to 405°, a needle to the center-top, and a hub dot — matching the Gauge
 * lucide glyph used in the app header.
 */
function drawMark(size, { maskable = false } = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  const setPixel = (x, y, [r, g, b], alpha = 255) => {
    const i = (y * size + x) * 4;
    rgba[i] = r;
    rgba[i + 1] = g;
    rgba[i + 2] = b;
    rgba[i + 3] = alpha;
  };

  const center = size / 2;
  // Maskable icons need the artwork inside the inner 80% safe zone; the
  // padding scales so the full-bleed background still covers the tile.
  const radius = maskable ? size * 0.5 : size * 0.5;
  const cornerRadius = maskable ? size * 0.25 : size * 0.22;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Rounded-square background test
      const dx = Math.abs(x + 0.5 - center);
      const dy = Math.abs(y + 0.5 - center);
      const half = radius;
      const cr = cornerRadius;
      const inCornerX = dx > half - cr;
      const inCornerY = dy > half - cr;
      let inside;
      if (inCornerX && inCornerY) {
        const cdx = dx - (half - cr);
        const cdy = dy - (half - cr);
        inside = cdx * cdx + cdy * cdy <= cr * cr;
      } else {
        inside = dx <= half && dy <= half;
      }
      if (inside) {
        setPixel(x, y, BRAND_BLUE);
      } else {
        setPixel(x, y, WHITE, 0);
      }
    }
  }

  // Gauge arc: ring centered at center, radius 0.26*size, from 135° to 405°
  const cx = center;
  const cy = center + size * 0.03;
  const ringRadius = size * 0.24;
  const ringWidth = Math.max(2, size * 0.055);
  const startAngle = (135 * Math.PI) / 180;
  const endAngle = (405 * Math.PI) / 180;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const dist = Math.hypot(px - cx, py - cy);
      if (dist > ringRadius - ringWidth / 2 && dist < ringRadius + ringWidth / 2) {
        let angle = Math.atan2(py - cy, px - cx);
        if (angle < 0) angle += 2 * Math.PI;
        // atan2 gives 0..2pi with 0 at 3 o'clock; arc spans 135deg..405deg
        const arcStart = startAngle;
        const arcEnd = endAngle;
        if (angle >= arcStart && angle <= arcEnd) {
          setPixel(x, y, WHITE);
        }
      }
    }
  }

  // Needle: line from hub toward 100° (up, slightly left)
  const needleAngle = (100 * Math.PI) / 180;
  const needleLength = ringRadius * 0.72;
  const nx = cx + Math.cos(needleAngle) * needleLength;
  const ny = cy - Math.sin(needleAngle) * needleLength;
  const steps = Math.ceil(size * 0.6);
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const lx = cx + (nx - cx) * t;
    const ly = cy + (ny - cy) * t;
    const thickness = Math.max(1, size * 0.03);
    for (let oy = -thickness; oy <= thickness; oy++) {
      for (let ox = -thickness; ox <= thickness; ox++) {
        if (ox * ox + oy * oy <= thickness * thickness) {
          const px = Math.round(lx + ox);
          const py = Math.round(ly + oy);
          if (px >= 0 && px < size && py >= 0 && py < size) {
            setPixel(px, py, WHITE);
          }
        }
      }
    }
  }

  // Hub dot
  const hubRadius = size * 0.055;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (dist <= hubRadius) setPixel(x, y, WHITE);
    }
  }

  return rgba;
}

function writeIcon(filename, size, opts) {
  const png = encodePNG(size, size, drawMark(size, opts));
  writeFileSync(join(PUBLIC_DIR, filename), png);
  console.log(`✓ ${filename} (${size}x${size})`);
}

mkdirSync(PUBLIC_DIR, { recursive: true });
writeIcon("icon-192.png", 192);
writeIcon("icon-512.png", 512);
writeIcon("icon-192-maskable.png", 192, { maskable: true });
writeIcon("icon-512-maskable.png", 512, { maskable: true });
writeIcon("icon-180.png", 180); // apple-touch-icon
writeIcon("icon-32.png", 32);
writeIcon("icon-16.png", 16);
console.log("PWA icons generated.");
