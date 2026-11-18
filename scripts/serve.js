#!/usr/bin/env node
// RusCraft: локальный стат-сервер собранного www/ с обязательными
// заголовками cross-origin isolation (без них wasm-сборка Luanti не запускается).
//
// Использование:
//   node scripts/serve.js [--www <каталог>] [--port <порт>] [--host <хост>]
//   node scripts/serve.js --selftest
//
// Только Node >= 18, без зависимостей.

const http = require('http');
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
function flag(name, def = undefined) {
  const i = argv.indexOf('--' + name);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : def;
}
const SELFTEST = argv.includes('--selftest');
const ROOT = path.resolve(flag('www', path.join(__dirname, '..', 'www')));
const PORT = Number(flag('port', 8484));
const HOST = flag('host', '127.0.0.1');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.wasm': 'application/wasm',
  '.map': 'application/json',
  '.json': 'application/json',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pack': 'application/octet-stream',
  '.zst': 'application/zstd',
  '.gz': 'application/gzip',
  '.txt': 'text/plain; charset=utf-8',
  '.conf': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

// Заголовки cross-origin isolation. Всё отдаём same-origin — CORP не нужен,
// require-corp проходит, потому что чужих ресурсов в HTML нет.
const HEADERS = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
};

function headersFor(filePath) {
  const h = { ...HEADERS };
  // Путь /www/<uuid>/... — неизменяемый релиз: вечный кэш это штатная схема апстрима.
  if (/\/[0-9a-f]{12}(\/|$)/.test(filePath)) {
    h['Cache-Control'] = 'public, max-age=31536000, immutable';
  } else if (filePath.endsWith('.html') || filePath === '/') {
    h['Cache-Control'] = 'no-cache';
  } else {
    h['Cache-Control'] = 'public, max-age=300';
  }
  return h;
}

function serve(req, res) {
  let urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end('403'); }
  fs.stat(filePath, (err, st) => {
    if (!err && st.isDirectory()) { filePath = path.join(filePath, 'index.html'); }
    fs.readFile(filePath, (err2, buf) => {
      if (err2) {
        res.writeHead(404, headersFor(urlPath));
        return res.end('404: ' + urlPath + '\n(ожидается собранная статика в ' + ROOT + ')');
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        ...headersFor(urlPath),
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Content-Length': buf.length,
      });
      res.end(buf);
    });
  });
}

async function selftest() {
  const server = http.createServer(serve);
  await new Promise(r => server.listen(PORT, HOST, r));
  const tmp = path.join(ROOT, 'index.html');
  fs.mkdirSync(ROOT, { recursive: true });
  fs.writeFileSync(tmp, '<html><body>selftest</body></html>');
  try {
    const res = await fetch('http://' + HOST + ':' + PORT + '/');
    const want = {
      'cross-origin-opener-policy': 'same-origin',
      'cross-origin-embedder-policy': 'require-corp',
      'content-type': 'text/html; charset=utf-8',
    };
    let ok = res.status === 200;
    for (const [k, v] of Object.entries(want)) {
      const got = res.headers.get(k);
      console.log(`  ${got === v ? 'OK  ' : 'FAIL'} ${k}: ${got}`);
      if (got !== v) ok = false;
    }
    // index.html должен найтрись и по прямому пути, и как /
    const res2 = await fetch('http://' + HOST + ':' + PORT + '/index.html');
    if (res2.status !== 200) { console.log('  FAIL /index.html ' + res2.status); ok = false; }
    else console.log('  OK   GET /index.html 200');
    console.log(ok ? 'SELFTEST PASS' : 'SELFTEST FAIL');
    process.exitCode = ok ? 0 : 1;
  } finally {
    fs.unlinkSync(tmp);
    server.close();
  }
}

if (SELFTEST) {
  selftest();
} else {
  if (!fs.existsSync(path.join(ROOT, 'index.html'))) {
    console.error('В ' + ROOT + ' нет index.html — сначала соберите wasm (docs/BUILD.md)\n' +
      'или укажите каталог: node scripts/serve.js --www <путь>');
    process.exit(1);
  }
  http.createServer(serve).listen(PORT, HOST, () => {
    console.log('RusCraft static: http://' + HOST + ':' + PORT + '/  (root: ' + ROOT + ')');
    console.log('COOP/COEP заголовки включены — crossOriginIsolated должен стать true.');
  });
}
