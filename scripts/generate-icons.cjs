// scripts/generate-icons.js
// Gera ícones PNG 192x192 e 512x512 para TWA Android usando apenas Node.js nativo (sem dependências externas).
// Cores: Verde Floresta (#26362F) fundo + Ouro Artesanal (#C09A5B) símbolo "K"
// Executa: node scripts/generate-icons.js

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// ─── Helpers PNG ─────────────────────────────────────────────────────────────

function uint32BE(n) {
  const b = Buffer.allocUnsafe(4);
  b.writeUInt32BE(n, 0);
  return b;
}

function crc32(buf) {
  let crc = 0xffffffff;
  const table = makeCrcTable();
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

let _crcTable = null;
function makeCrcTable() {
  if (_crcTable) return _crcTable;
  _crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    _crcTable[n] = c;
  }
  return _crcTable;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const dataBytes = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const crcInput = Buffer.concat([typeBytes, dataBytes]);
  const crcVal = crc32(crcInput);
  return Buffer.concat([uint32BE(dataBytes.length), typeBytes, dataBytes, uint32BE(crcVal)]);
}

function buildPNG(width, height, pixels) {
  // pixels: Uint8Array de width*height*3 bytes (RGB)
  const PNG_MAGIC = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.allocUnsafe(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type: RGB
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  // Build raw image data with filter byte per row
  const rowSize = width * 3;
  const rawData = Buffer.allocUnsafe(height * (rowSize + 1));
  for (let y = 0; y < height; y++) {
    rawData[y * (rowSize + 1)] = 0; // filter: None
    pixels.copy(rawData, y * (rowSize + 1) + 1, y * rowSize, (y + 1) * rowSize);
  }

  const compressed = zlib.deflateSync(rawData, { level: 6 });

  return Buffer.concat([
    PNG_MAGIC,
    chunk("IHDR", ihdrData),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ─── Gerador de Ícone ─────────────────────────────────────────────────────────

// Verde Floresta #26362F → R=38, G=54, B=47
const BG_R = 38, BG_G = 54, BG_B = 47;
// Ouro Artesanal #C09A5B → R=192, G=154, B=91
const FG_R = 192, FG_G = 154, FG_B = 91;
// Marfim #F7F4EC → R=247, G=244, B=236
const CREAM_R = 247, CREAM_G = 244, CREAM_B = 236;

function lerp(a, b, t) { return Math.round(a + (b - a) * t); }

function generateIcon(size, maskable) {
  const pixels = Buffer.alloc(size * size * 3);

  // Safe zone para maskable: 80% do tamanho (20% de padding em cada lado)
  const safeZone = maskable ? 0.8 : 1.0;
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size / 2) * safeZone;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 3;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (maskable) {
        // Fundo quadrado completo para maskable
        pixels[idx] = BG_R; pixels[idx+1] = BG_G; pixels[idx+2] = BG_B;
      } else {
        // Círculo com suavização para ícone normal
        const edgeFade = radius - 2;
        if (dist > radius) {
          // Exterior transparente → vamos usar Marfim (como fundo de página)
          pixels[idx] = CREAM_R; pixels[idx+1] = CREAM_G; pixels[idx+2] = CREAM_B;
          continue;
        } else if (dist > edgeFade) {
          const t = (dist - edgeFade) / 2;
          pixels[idx] = lerp(BG_R, CREAM_R, t);
          pixels[idx+1] = lerp(BG_G, CREAM_G, t);
          pixels[idx+2] = lerp(BG_B, CREAM_B, t);
          continue;
        } else {
          pixels[idx] = BG_R; pixels[idx+1] = BG_G; pixels[idx+2] = BG_B;
        }
      }

      // Letra "K" centrada com o Ouro Artesanal
      // Proporcional ao tamanho do ícone
      const scale = size / 192;
      const kLeft   = cx - 28 * scale;
      const kRight  = cx + 28 * scale;
      const kTop    = cy - 36 * scale;
      const kBottom = cy + 36 * scale;
      const kW      = 10 * scale; // espessura do traço

      // Haste vertical esquerda
      const inVert = x >= kLeft && x < kLeft + kW && y >= kTop && y <= kBottom;
      // Braço superior (diagonal para cima-direita)
      const relX = x - (kLeft + kW);
      const relY = y - cy;
      const diagAngle = size / 192;
      const inUpper = relX >= 0 && relX <= (kRight - kLeft - kW) &&
                      relY <= 0 &&
                      Math.abs(relY + relX * (36 * scale) / (kRight - kLeft - kW)) < kW * 0.9 * diagAngle;
      // Braço inferior (diagonal para baixo-direita)
      const inLower = relX >= 0 && relX <= (kRight - kLeft - kW) &&
                      relY >= 0 &&
                      Math.abs(relY - relX * (36 * scale) / (kRight - kLeft - kW)) < kW * 0.9 * diagAngle;

      if (inVert || inUpper || inLower) {
        pixels[idx] = FG_R; pixels[idx+1] = FG_G; pixels[idx+2] = FG_B;
      }
    }
  }

  return pixels;
}

// ─── Gerar e guardar ─────────────────────────────────────────────────────────

const outDir = path.join(__dirname, "..", "public", "icons");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const configs = [
  { size: 192, maskable: false, name: "icon-192.png" },
  { size: 512, maskable: false, name: "icon-512.png" },
  { size: 192, maskable: true,  name: "icon-maskable-192.png" },
  { size: 512, maskable: true,  name: "icon-maskable-512.png" },
];

for (const { size, maskable, name } of configs) {
  const pixels = generateIcon(size, maskable);
  const png = buildPNG(size, size, pixels);
  const outPath = path.join(outDir, name);
  fs.writeFileSync(outPath, png);
  console.log(`✓ Gerado: public/icons/${name} (${(png.length / 1024).toFixed(1)} kB)`);
}

console.log("\n✅ Todos os ícones PNG gerados em public/icons/");
