const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const REPORT_DIR = path.join(ROOT_DIR, 'playwright-report');
const RESULTS_FILE = path.join(ROOT_DIR, 'test-results', 'results.json');
const BUILD_LOG_FILE = path.join(ROOT_DIR, 'build.log');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.zip': 'application/zip',
  '.txt': 'text/plain; charset=utf-8',
};

const SPEC_MAP = {
  'recorded.spec.js': 'tests/recorded.spec.js',
  'login.spec.js': 'tests/login.spec.js',
  'inventory.spec.js': 'tests/inventory.spec.js',
  'inventoryItem.spec.js': 'tests/inventoryItem.spec.js',
  'cart.spec.js': 'tests/cart.spec.js',
  'checkout.spec.js': 'tests/checkout.spec.js',
  'menu.spec.js': 'tests/menu.spec.js',
  'tests/recorded.spec.js': 'tests/recorded.spec.js',
  'tests/login.spec.js': 'tests/login.spec.js',
  'tests/inventory.spec.js': 'tests/inventory.spec.js',
  'tests/inventoryItem.spec.js': 'tests/inventoryItem.spec.js',
  'tests/cart.spec.js': 'tests/cart.spec.js',
  'tests/checkout.spec.js': 'tests/checkout.spec.js',
  'tests/menu.spec.js': 'tests/menu.spec.js',
};

let initialOutput = '';
if (fs.existsSync(BUILD_LOG_FILE)) {
  try {
    initialOutput = fs.readFileSync(BUILD_LOG_FILE, 'utf-8').slice(-20000);
  } catch {
    initialOutput = '';
  }
}

let runState = {
  isRunning: false,
  startedAt: null,
  finishedAt: null,
  lastExitCode: null,
  output: initialOutput,
};

function collectTestsFromSuite(suite, parentTitles = []) {
  const collected = [];
  const currentTitles = suite.title ? [...parentTitles, suite.title] : parentTitles;

  if (Array.isArray(suite.specs)) {
    for (const spec of suite.specs) {
      const testEntry = spec.tests && spec.tests[0];
      const resultEntry =
        testEntry && testEntry.results && testEntry.results[testEntry.results.length - 1];
      const status = resultEntry ? resultEntry.status : spec.ok ? 'passed' : 'failed';
      const durationMs = resultEntry ? resultEntry.duration : 0;
      const errorMessage =
        resultEntry && resultEntry.error && resultEntry.error.message
          ? resultEntry.error.message
          : null;

      collected.push({
        file: spec.file || suite.file || '',
        group: currentTitles.slice(1).join(' > ') || suite.title || 'General',
        title: spec.title,
        status,
        durationMs,
        error: errorMessage,
      });
    }
  }

  if (Array.isArray(suite.suites)) {
    for (const child of suite.suites) {
      collected.push(...collectTestsFromSuite(child, currentTitles));
    }
  }

  return collected;
}

function readResultsSummary() {
  const reportReady = fs.existsSync(path.join(REPORT_DIR, 'index.html'));

  if (!fs.existsSync(RESULTS_FILE)) {
    return {
      hasResults: false,
      reportReady,
      runState,
      stats: { total: 0, passed: 0, failed: 0, skipped: 0, durationMs: 0 },
      lastRunAt: runState.finishedAt,
      suites: [],
    };
  }

  try {
    const raw = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'));
    const stat = fs.statSync(RESULTS_FILE);
    const allTests = [];

    for (const suite of raw.suites || []) {
      allTests.push(...collectTestsFromSuite(suite));
    }

    const grouped = new Map();
    for (const item of allTests) {
      const key = item.file || 'tests';
      if (!grouped.has(key)) {
        grouped.set(key, {
          file: key,
          group: item.group,
          tests: [],
          passed: 0,
          failed: 0,
          skipped: 0,
          durationMs: 0,
        });
      }
      const bucket = grouped.get(key);
      bucket.tests.push(item);
      bucket.durationMs += item.durationMs;
      if (item.status === 'passed') bucket.passed += 1;
      else if (item.status === 'skipped') bucket.skipped += 1;
      else bucket.failed += 1;
    }

    const passed = allTests.filter((t) => t.status === 'passed').length;
    const skipped = allTests.filter((t) => t.status === 'skipped').length;
    const failed = allTests.length - passed - skipped;
    const durationMs =
      raw.stats && typeof raw.stats.duration === 'number'
        ? Math.round(raw.stats.duration)
        : allTests.reduce((sum, t) => sum + t.durationMs, 0);

    return {
      hasResults: allTests.length > 0,
      reportReady,
      runState,
      stats: {
        total: allTests.length,
        passed,
        failed,
        skipped,
        durationMs,
      },
      lastRunAt: (raw.stats && raw.stats.startTime) || stat.mtime.toISOString(),
      suites: Array.from(grouped.values()),
    };
  } catch (err) {
    return {
      hasResults: false,
      reportReady,
      runState,
      error: err.message,
      stats: { total: 0, passed: 0, failed: 0, skipped: 0, durationMs: 0 },
      suites: [],
    };
  }
}

function triggerTestRun(specFile) {
  if (runState.isRunning) {
    return false;
  }

  const normalizedSpec = specFile ? SPEC_MAP[specFile] || null : null;
  const args = ['playwright', 'test', '--workers=1'];
  if (normalizedSpec) {
    args.push(normalizedSpec);
  }

  runState = {
    isRunning: true,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    lastExitCode: null,
    output: '',
  };

  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const child = spawn(npxCmd, args, {
    cwd: ROOT_DIR,
    env: { ...process.env, CI: 'true' },
    shell: process.platform === 'win32',
  });

  child.stdout.on('data', (chunk) => {
    runState.output += chunk.toString();
    if (runState.output.length > 25000) {
      runState.output = runState.output.slice(-25000);
    }
  });

  child.stderr.on('data', (chunk) => {
    runState.output += chunk.toString();
    if (runState.output.length > 25000) {
      runState.output = runState.output.slice(-25000);
    }
  });

  child.on('close', (code) => {
    runState.isRunning = false;
    runState.finishedAt = new Date().toISOString();
    runState.lastExitCode = code;
  });

  child.on('error', (err) => {
    runState.isRunning = false;
    runState.finishedAt = new Date().toISOString();
    runState.lastExitCode = 1;
    runState.output += `\nFailed to start test runner: ${err.message}`;
  });

  return true;
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function serveStaticFile(res, baseDir, relativePath) {
  const safePath = path.normalize(relativePath).replace(/^(\.\.[/\\])+/, '');
  const fullPath = path.join(baseDir, safePath);

  if (!fullPath.startsWith(baseDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(fullPath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(fullPath).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  if (pathname === '/health') {
    return sendJson(res, 200, { status: 'ok', running: runState.isRunning });
  }

  if (pathname === '/api/results' && req.method === 'GET') {
    return sendJson(res, 200, readResultsSummary());
  }

  if (pathname === '/api/run' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      let specFile = null;
      try {
        if (body) {
          specFile = JSON.parse(body).spec || null;
        }
      } catch {
        specFile = null;
      }

      const started = triggerTestRun(specFile);
      if (!started) {
        return sendJson(res, 409, { message: 'A test run is already in progress.' });
      }
      return sendJson(res, 202, { message: 'Test run started.', spec: specFile || 'all' });
    });
    return;
  }

  if (pathname === '/report') {
    res.writeHead(302, { Location: '/report/' });
    res.end();
    return;
  }

  if (pathname.startsWith('/report/')) {
    const subPath = pathname.slice('/report/'.length) || 'index.html';
    return serveStaticFile(res, REPORT_DIR, subPath);
  }

  const publicPath = pathname === '/' ? 'index.html' : pathname.slice(1);
  return serveStaticFile(res, PUBLIC_DIR, publicPath);
});

server.listen(PORT, HOST, () => {
  console.log(`SauceDemo Playwright Dashboard listening on http://${HOST}:${PORT}`);

  // If no test results exist yet (for example, build skipped execution), run once automatically.
  const initialSummary = readResultsSummary();
  if (!initialSummary.hasResults && process.env.AUTO_RUN_ON_BOOT !== 'false') {
    console.log('No test results found on startup. Triggering initial Playwright run...');
    triggerTestRun(null);
  }
});
