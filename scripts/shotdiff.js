// Служебный скрипт: сравнение двух PNG (скриншоты страницы) — «глаза» для слепых тестов.
// node shotdiff.js a.png b.png [--bands]
const fs = require('fs'), zlib = require('zlib');
function decode(p) {
  const b = fs.readFileSync(p);
  let pos = 8, w = 0, h = 0, depth = 0, ctype = 0, idat = [];
  while (pos < b.length) {
    const len = b.readUInt32BE(pos), type = b.toString('ascii', pos + 4, pos + 8);
    const data = b.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; ctype = data[9]; }
    else if (type === 'IDAT') idat.push(data);
    pos += 12 + len;
  }
  const bpp = ctype === 6 ? 4 : ctype === 2 ? 3 : 1;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * bpp, out = Buffer.alloc(h * stride);
  let o = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[o++];
    const line = raw.subarray(o, o + stride); o += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y ? out.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0, b0 = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      if (f === 1) v += a; else if (f === 2) v += b0; else if (f === 3) v += (a + b0) >> 1;
      else if (f === 4) { const p = a + b0 - c, pa = Math.abs(p - a), pb = Math.abs(p - b0), pc = Math.abs(p - c); v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b0 : c); }
      cur[x] = v & 255;
    }
  }
  return { w, h, bpp, px: out };
}
const [A, B, opt] = process.argv.slice(2);
const a = decode(A), b = decode(B);
if (a.w !== b.w || a.h !== b.h) { console.log('dims differ', a.w + 'x' + a.h, b.w + 'x' + b.h); process.exit(1); }
let diff = 0, sum = 0; const bands = new Array(Math.ceil(a.h / 40)).fill(0);
for (let i = 0; i < a.px.length; i += a.bpp) {
  const d = Math.abs(a.px[i] - b.px[i]) + Math.abs(a.px[i + 1] - b.px[i + 1]) + Math.abs(a.px[i + 2] - b.px[i + 2]);
  if (d > 24) diff++;
  if (opt === '--bands') { const pxi = i / a.bpp, y = (pxi / a.w) | 0, x = pxi % a.w; if (d > 24) bands[(y / 40) | 0] += (x < a.w * 0.33 ? 1 : x < a.w * 0.66 ? 2 : 3); }
}
console.log('changed_pixels=' + diff + ' of ' + (a.w * a.h) + ' (' + (100 * diff / (a.w * a.h)).toFixed(2) + '%)');
if (opt === '--bands') {
  console.log('bands (rows x40px; L/M/R weights per changed px):');
  bands.forEach((v, i) => { if (v) console.log('y' + (i * 40) + '-' + (i * 40 + 39) + ': ' + v); });
}
