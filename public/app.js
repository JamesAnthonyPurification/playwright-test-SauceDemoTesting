const statTotal = document.getElementById('statTotal');
const statPassed = document.getElementById('statPassed');
const statFailed = document.getElementById('statFailed');
const statDuration = document.getElementById('statDuration');
const lastRunMeta = document.getElementById('lastRunMeta');
const suitesContainer = document.getElementById('suitesContainer');
const specFilter = document.getElementById('specFilter');
const runAllBtn = document.getElementById('runAllBtn');
const refreshBtn = document.getElementById('refreshBtn');
const openReportBtn = document.getElementById('openReportBtn');
const statusBanner = document.getElementById('statusBanner');
const statusText = document.getElementById('statusText');
const consoleOutput = document.getElementById('consoleOutput');
const consoleExitCode = document.getElementById('consoleExitCode');

let latestData = null;
let pollTimer = null;

function formatDuration(ms) {
  if (!ms || ms < 0) return '0.0s';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderFilterOptions(suites) {
  const current = specFilter.value || 'all';
  specFilter.innerHTML = '<option value="all">All Spec Files</option>';

  for (const suite of suites) {
    const opt = document.createElement('option');
    opt.value = suite.file;
    opt.textContent = suite.file;
    specFilter.appendChild(opt);
  }

  specFilter.value = suites.some((s) => s.file === current) ? current : 'all';
}

function renderSuites(suites) {
  const filter = specFilter.value;
  const visibleSuites = filter === 'all' ? suites : suites.filter((s) => s.file === filter);

  if (visibleSuites.length === 0) {
    suitesContainer.innerHTML =
      '<div class="info-card"><p class="muted">No test results yet. Click "Run All Tests Live" to execute the suite.</p></div>';
    return;
  }

  suitesContainer.innerHTML = visibleSuites
    .map((suite) => {
      const rows = suite.tests
        .map(
          (t) => `
          <tr>
            <td class="test-status status-${escapeHtml(t.status)}">${escapeHtml(t.status)}</td>
            <td>
              <div>${escapeHtml(t.title)}</div>
              ${t.error ? `<div class="muted">${escapeHtml(t.error)}</div>` : ''}
            </td>
            <td class="test-duration">${formatDuration(t.durationMs)}</td>
          </tr>`
        )
        .join('');

      const badgeClass = suite.failed > 0 ? 'pill-fail' : 'pill-pass';
      const badgeText =
        suite.failed > 0
          ? `${suite.passed}/${suite.tests.length} passed`
          : `${suite.passed}/${suite.tests.length} passed`;

      return `
        <article class="suite-card">
          <div class="suite-header">
            <div>
              <span class="suite-title">${escapeHtml(suite.group || suite.file)}</span>
              <span class="suite-file">${escapeHtml(suite.file)}</span>
            </div>
            <div class="suite-meta">
              <span class="pill ${badgeClass}">${badgeText}</span>
              <span class="muted">${formatDuration(suite.durationMs)}</span>
            </div>
          </div>
          <table class="test-table">
            <tbody>${rows}</tbody>
          </table>
        </article>`;
    })
    .join('');
}

function updateUI(data) {
  latestData = data;
  statTotal.textContent = data.stats.total;
  statPassed.textContent = data.stats.passed;
  statFailed.textContent = data.stats.failed;
  statDuration.textContent = formatDuration(data.stats.durationMs);

  if (data.lastRunAt) {
    const formatted = new Date(data.lastRunAt).toLocaleString();
    lastRunMeta.textContent = `Last run: ${formatted} (${data.stats.passed} of ${data.stats.total} passing)`;
  } else {
    lastRunMeta.textContent = 'No completed test run recorded yet.';
  }

  openReportBtn.classList.toggle('hidden', !data.reportReady);

  if (data.runState && data.runState.output) {
    consoleOutput.textContent = data.runState.output;
  }

  const running = Boolean(data.runState && data.runState.isRunning);
  runAllBtn.disabled = running;
  statusBanner.classList.toggle('hidden', !running);

  if (running) {
    statusText.textContent = 'Running Playwright tests in headless Chromium...';
    consoleExitCode.textContent = 'Running...';
    startPolling();
  } else {
    stopPolling();
    if (data.runState && data.runState.lastExitCode !== null) {
      consoleExitCode.textContent =
        data.runState.lastExitCode === 0
          ? 'Completed (Exit 0 - Passed)'
          : `Completed (Exit ${data.runState.lastExitCode})`;
    }
  }

  renderFilterOptions(data.suites || []);
  renderSuites(data.suites || []);
}

async function fetchResults() {
  try {
    const response = await fetch('/api/results');
    const data = await response.json();
    updateUI(data);
  } catch (err) {
    lastRunMeta.textContent = `Could not load results: ${err.message}`;
  }
}

async function runTests(spec = null) {
  runAllBtn.disabled = true;
  statusBanner.classList.remove('hidden');
  statusText.textContent = 'Starting Playwright test runner...';

  try {
    const response = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spec }),
    });

    if (!response.ok) {
      const errData = await response.json();
      statusText.textContent = errData.message || 'Unable to start test run.';
    }
    startPolling();
    await fetchResults();
  } catch (err) {
    runAllBtn.disabled = false;
    statusText.textContent = `Error: ${err.message}`;
  }
}

function startPolling() {
  if (!pollTimer) {
    pollTimer = setInterval(fetchResults, 2500);
  }
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

document.querySelectorAll('.tab').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    button.classList.add('active');
    document.getElementById(`tab-${button.dataset.tab}`).classList.add('active');
  });
});

specFilter.addEventListener('change', () => {
  if (latestData) {
    renderSuites(latestData.suites || []);
  }
});

runAllBtn.addEventListener('click', () => runTests());
refreshBtn.addEventListener('click', fetchResults);

fetchResults();

