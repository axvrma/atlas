import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const base = process.env.ATLAS_PREVIEW_URL ?? 'http://127.0.0.1:4173';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    timezoneId: 'Asia/Kolkata',
    reducedMotion: 'reduce',
  });
  mkdirSync('docs/screenshots', { recursive: true });
  const capture = async (name) => {
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    });
    await page.screenshot({
      path: `docs/screenshots/${name}.png`,
      fullPage: true,
      animations: 'disabled',
    });
  };
  await page.goto(`${base}/app`);
  await page.getByRole('button', { name: 'Explore freely' }).click();
  await page.getByRole('heading', { level: 1 }).waitFor();
  await capture('workspace');
  await page.goto(`${base}/app/workflows/support-triage`);
  await page.getByLabel('Node name', { exact: true }).waitFor();
  await page.waitForFunction(() => document.querySelectorAll('.react-flow__edge').length === 8);
  await capture('editor');
  await page.goto(`${base}/app/executions/seed-0001`);
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.waitForFunction(() => document.querySelectorAll('.react-flow__edge').length === 8);
  await capture('debugger');
  await page.goto(`${base}/`);
  await page.getByRole('heading', { level: 1 }).waitFor();
  await capture('landing');
  await page.goto(`${base}/app`);
  await page.getByRole('button', { name: 'Choose color theme' }).click();
  await page.getByRole('menuitem', { name: 'Dark theme', exact: true }).click();
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
  await capture('workspace-dark');
  await page.getByRole('button', { name: 'Choose color theme' }).click();
  await page.getByRole('menuitem', { name: 'Light theme', exact: true }).click();
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/app`);
  await page.getByRole('heading', { level: 1 }).waitFor();
  await capture('mobile');
} finally {
  await browser.close();
}
