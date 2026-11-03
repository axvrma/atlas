import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
const coveragePath = 'coverage/coverage-summary.json';
const browserPath = 'test-results/results.json';
if (!existsSync(coveragePath) || !existsSync(browserPath))
  throw Error(
    'Run pnpm test:coverage and pnpm test:e2e before generating the verification report.',
  );
const coverage = JSON.parse(readFileSync(coveragePath, 'utf8'));
const browser = JSON.parse(readFileSync(browserPath, 'utf8'));
const unit = existsSync('coverage/vitest.json')
  ? JSON.parse(readFileSync('coverage/vitest.json', 'utf8'))
  : undefined;
const report = {
  unit: unit
    ? { passed: unit.numPassedTests, failed: unit.numFailedTests, total: unit.numTotalTests }
    : undefined,
  generatedAt: new Date().toISOString(),
  coverageMeasuredAt: statSync(coveragePath).mtime.toISOString(),
  browserMeasuredAt: statSync(browserPath).mtime.toISOString(),
  coverage: coverage.total,
  browser: {
    passed: browser.stats.expected,
    failed: browser.stats.unexpected,
    flaky: browser.stats.flaky,
    skipped: browser.stats.skipped,
    durationMs: browser.stats.duration,
  },
  scope:
    'Coverage: engine, shared UI, storage adapter. Browser: Chromium against the assembled static artifact, including representative light/dark axe checks. Not a complete WCAG audit.',
};
mkdirSync('apps/web/public/reports', { recursive: true });
writeFileSync('apps/web/public/reports/quality.json', JSON.stringify(report, null, 2) + '\n');
if (existsSync('dist/reports'))
  copyFileSync('apps/web/public/reports/quality.json', 'dist/reports/quality.json');
console.log(
  `Verification report: ${report.browser.passed} browser tests passed, ${report.browser.failed} failed; ${coverage.total.lines.pct}% covered lines.`,
);
