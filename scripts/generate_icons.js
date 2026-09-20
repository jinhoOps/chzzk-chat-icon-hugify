import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = path.resolve(__dirname, '..', 'icons');

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBody = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcBody);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generatePng(size) {
  // Color palette: Chzzk green (#00ffa3), dark background (#141517)
  const bgR = 0x14, bgG = 0x15, bgB = 0x17;
  const fgR = 0x00, fgG = 0xff, fgB = 0xa3; // #00ffa3
  const whiteR = 0xff, whiteG = 0xff, whiteB = 0xff;

  const rawScanlines = [];
  const radius = size * 0.44;
  const center = size / 2;

  // Magnifier glass params
  const lensRadius = size * 0.26;
  const lensCenterX = size * 0.42;
  const lensCenterY = size * 0.42;
  const lensThickness = Math.max(1.5, size * 0.08);

  for (let y = 0; y < size; y++) {
    const line = Buffer.alloc(1 + size * 4);
    line[0] = 0; // Filter: None

    for (let x = 0; x < size; x++) {
      const idx = 1 + x * 4;

      // Rounded background box
      const distFromCenter = Math.hypot(x - center + 0.5, y - center + 0.5);
      const isInsideBg = distFromCenter <= radius;

      if (!isInsideBg) {
        // Transparent
        line[idx] = 0;
        line[idx + 1] = 0;
        line[idx + 2] = 0;
        line[idx + 3] = 0;
        continue;
      }

      // Inside background
      let r = bgR, g = bgG, b = bgB, a = 255;

      // Draw magnifying glass lens ring
      const dLens = Math.hypot(x - lensCenterX, y - lensCenterY);
      const inLensRing = Math.abs(dLens - lensRadius) <= (lensThickness / 2);

      // Draw handle
      const hX1 = lensCenterX + lensRadius * 0.707;
      const hY1 = lensCenterY + lensRadius * 0.707;
      const hX2 = size * 0.82;
      const hY2 = size * 0.82;
      
      // Distance from segment (hX1, hY1) to (hX2, hY2)
      const dx = hX2 - hX1, dy = hY2 - hY1;
      const lenSq = dx * dx + dy * dy;
      const t = Math.max(0, Math.min(1, ((x - hX1) * dx + (y - hY1) * dy) / lenSq));
      const projX = hX1 + t * dx;
      const projY = hY1 + t * dy;
      const dHandle = Math.hypot(x - projX, y - projY);
      const inHandle = dHandle <= (lensThickness * 0.7);

      // Smiley face inside lens (representing emoticon)
      const eyeOffset = lensRadius * 0.4;
      const eyeR = Math.max(0.8, lensRadius * 0.15);
      const inEye1 = Math.hypot(x - (lensCenterX - eyeOffset), y - (lensCenterY - eyeOffset * 0.3)) <= eyeR;
      const inEye2 = Math.hypot(x - (lensCenterX + eyeOffset), y - (lensCenterY - eyeOffset * 0.3)) <= eyeR;
      const mouthD = Math.hypot(x - lensCenterX, y - (lensCenterY - eyeOffset * 0.1));
      const inMouth = Math.abs(mouthD - lensRadius * 0.45) <= (lensThickness * 0.35) && y > (lensCenterY + eyeOffset * 0.1);

      if (inLensRing || inHandle) {
        r = fgR; g = fgG; b = fgB;
      } else if (inEye1 || inEye2 || inMouth) {
        r = whiteR; g = whiteG; b = whiteB;
      }

      line[idx] = r;
      line[idx + 1] = g;
      line[idx + 2] = b;
      line[idx + 3] = a;
    }
    rawScanlines.push(line);
  }

  const uncompressed = Buffer.concat(rawScanlines);
  const compressed = zlib.deflateSync(uncompressed);

  // PNG Header
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

[16, 48, 128].forEach((size) => {
  const pngBuf = generatePng(size);
  const filePath = path.join(ICONS_DIR, `icon${size}.png`);
  fs.writeFileSync(filePath, pngBuf);
  console.log(`Generated icon${size}.png (${pngBuf.length} bytes)`);
});
