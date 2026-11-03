import lighthouse from 'lighthouse';
import { chromium } from '@playwright/test';
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import net from 'node:net';
const url = process.env.ATLAS_PREVIEW_URL ?? 'http://127.0.0.1:4173/';
const server = net.createServer();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
const port = typeof address === 'object' && address ? address.port : 9222;
await new Promise((resolve) => server.close(resolve));
const browser = await chromium.launch({
  args: [`--remote-debugging-port=${port}`, '--remote-debugging-address=127.0.0.1'],
});
try {
  const result = await lighthouse(url, {
    port,
    output: ['json', 'html'],
    logLevel: 'error',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  });
  if (!result) throw Error('Lighthouse produced no report.');
  const lhr = result.lhr;
  const summary = {
    generatedAt: lhr.fetchTime,
    lighthouseVersion: lhr.lighthouseVersion,
    url: lhr.finalDisplayedUrl,
    environment: lhr.environment,
    settings: {
      formFactor: lhr.configSettings.formFactor,
      throttlingMethod: lhr.configSettings.throttlingMethod,
      throttling: lhr.configSettings.throttling,
    },
    categories: Object.fromEntries(
      Object.entries(lhr.categories).map(([key, c]) => [
        key,
        { title: c.title, score: c.score === null ? null : Math.round(c.score * 100) },
      ]),
    ),
    metrics: Object.fromEntries(
      [
        'first-contentful-paint',
        'largest-contentful-paint',
        'cumulative-layout-shift',
        'total-blocking-time',
        'speed-index',
      ].map((key) => [
        key,
        { value: lhr.audits[key]?.numericValue, displayValue: lhr.audits[key]?.displayValue },
      ]),
    ),
  };
  mkdirSync('apps/web/public/reports', { recursive: true });
  writeFileSync('apps/web/public/reports/lighthouse.json', JSON.stringify(summary, null, 2) + '\n');
  mkdirSync('.tools', { recursive: true });
  writeFileSync('.tools/lighthouse.html', result.report[1]);
  writeFileSync('.tools/lighthouse.json', result.report[0]);
  if (existsSync('dist/reports'))
    copyFileSync('apps/web/public/reports/lighthouse.json', 'dist/reports/lighthouse.json');
  console.log(JSON.stringify(summary.categories, null, 2));
} finally {
  await browser.close();
}
