import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function enter(page: Page, path = '/app') {
  await page.goto(path);
  await expect(page.locator('#main')).toBeVisible();
  const explore = page.getByRole('button', { name: 'Explore freely', exact: true });
  if (await explore.isVisible()) await explore.click();
  await expect(page.locator('#main')).toBeVisible();
}
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('Failed to load resource'))
      errors.push(message.text());
  });
  (page as Page & { atlasErrors: string[] }).atlasErrors = errors;
});
test.afterEach(async ({ page }) => {
  expect((page as Page & { atlasErrors: string[] }).atlasErrors).toEqual([]);
});
test('landing runs an engine-backed preview and launches the workspace', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Understand every step');
  await page.getByRole('button', { name: 'Run simulation', exact: true }).click();
  await expect(page.getByText(/7 steps completed/)).toBeVisible();
  await page
    .getByRole('link', { name: /Launch live demo/i })
    .first()
    .click();
  await page.getByRole('button', { name: 'Explore freely' }).click();
  await expect(page.getByRole('heading', { name: /Good things start/ })).toBeVisible();
});
test('guided tour creates a genuine execution and can be restarted', async ({ page }) => {
  await page.goto('/app');
  await page.getByRole('button', { name: 'Take guided tour' }).click();
  await page.getByRole('button', { name: 'Open workflow library' }).click();
  await expect(page).toHaveURL(/workflows$/);
  await page.getByRole('button', { name: 'Open sample editor' }).click();
  await page.getByRole('button', { name: 'Run sample simulation' }).click();
  await expect(page).toHaveURL(/executions\//);
  await page.getByRole('button', { name: 'Open preferences' }).click();
  await page.getByRole('button', { name: 'Start exploring', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Help & getting started' }).click();
  await page.getByRole('menuitem', { name: 'Restart guided tour' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});
test('library supports creation, editing, persistence, duplication, rename and deletion', async ({
  page,
}) => {
  await enter(page, '/app/workflows');
  await expect(page.locator('.workflow-card')).toHaveCount(5);
  await page.getByRole('link', { name: 'Create workflow', exact: true }).click();
  await page.getByLabel('Workflow name').fill('Release preparation');
  await page.getByRole('button', { name: 'Create workflow', exact: true }).click();
  await expect(page).toHaveURL(/workflows\/[a-f0-9-]+$/);
  await page.getByLabel('Node name', { exact: true }).fill('Release event');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Workspace saved' })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Node name', { exact: true })).toHaveValue('Release event');
  await page.getByRole('link', { name: 'Back to workflows' }).click();
  await page.getByRole('button', { name: 'Actions for Release preparation', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Duplicate workflow' }).click();
  await expect(page.getByLabel('Workflow name', { exact: true })).toHaveValue(
    'Release preparation copy',
  );
  await page.getByRole('link', { name: 'Back to workflows' }).click();
  await page
    .getByRole('button', { name: 'Actions for Release preparation copy', exact: true })
    .click();
  await page.getByRole('menuitem', { name: 'Rename workflow' }).click();
  await page.getByLabel('Workflow name', { exact: true }).fill('Release clone');
  await page.getByRole('button', { name: 'Save name' }).click();
  await page.getByRole('button', { name: 'Actions for Release clone', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Delete workflow' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Release clone', exact: true })).toHaveCount(0);
  await page.getByLabel('Search workflows').fill('Release preparation');
  await expect(page.locator('.workflow-card')).toHaveCount(1);
});
test('keyboard graph controls add, connect, validate, undo and redo nodes', async ({ page }) => {
  await enter(page, '/app/workflows/new');
  await page.getByLabel('Workflow name').fill('Keyboard graph');
  await page.getByRole('button', { name: 'Create workflow', exact: true }).click();
  await page.getByTitle('Add Transform node', { exact: true }).click();
  await expect(page.getByText(/validation issues/).first()).toBeVisible();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByText('Graph valid', { exact: false }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await page.getByRole('button', { name: 'Show accessible node list', exact: true }).click();
  const list = page.locator('.accessible-graph');
  await list
    .getByRole('button', { name: /Remove connection/ })
    .first()
    .click();
  await list.getByLabel('From node').selectOption({ label: 'Sample event' });
  await list.getByLabel('To node').selectOption({ label: 'Transform' });
  await list.getByRole('button', { name: 'Add connection', exact: true }).click();
  await list.getByLabel('From node').selectOption({ label: 'Transform' });
  await list.getByLabel('To node').selectOption({ label: 'Complete' });
  await list.getByRole('button', { name: 'Add connection', exact: true }).click();
  await expect(page.getByText('Graph valid', { exact: false }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Run event', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Open debugger' })).toBeVisible();
});
test('invalid JSON is actionable and simulations produce inspectable output', async ({ page }) => {
  await enter(page, '/app/workflows/support-triage');
  await page.getByLabel('INPUT EVENT').fill('{not json');
  await page.getByRole('button', { name: 'Run event', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByLabel('Simulation scenario').selectOption('alternate');
  await page.getByRole('button', { name: 'Run event', exact: true }).click();
  await page.getByRole('link', { name: 'Open debugger' }).click();
  await expect(
    page.getByRole('heading', { name: 'Customer Support Triage', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Next step', exact: true }).click();
  await expect(page.getByText('Step 2 of 5')).toBeVisible();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByLabel('Playback speed').selectOption('4');
  await expect(page.getByText('Step 5 of 5')).toBeVisible();
  await page.getByRole('tab', { name: 'Output', exact: true }).click();
  await expect(page.getByLabel('output payload')).toContainText('normal');
});
test('failed fixture reports the failed node, and analytics reflects local runs', async ({
  page,
}) => {
  await enter(page, '/app/workflows/support-triage');
  await page.getByLabel('Simulation scenario').selectOption('failure');
  await page.getByRole('button', { name: 'Run event', exact: true }).click();
  await expect(
    page.locator('.simulation-header').getByText('Failed', { exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Open debugger' }).click();
  await expect(page.getByRole('alert')).toContainText('503');
  await page.getByRole('link', { name: 'Analytics', exact: true }).click();
  await page.getByLabel('Analytics source').selectOption('local');
  await expect(
    page.locator('.metric-card').filter({ hasText: 'Total executions' }).locator('.metric-value'),
  ).toHaveText('1');
  await expect(
    page.locator('.metric-card').filter({ hasText: 'Failure rate' }).locator('.metric-value'),
  ).toHaveText('100%');
});
test('themes persist, validated export downloads, and reset restores the seed', async ({
  page,
}) => {
  await enter(page, '/app/settings');
  await page.getByLabel('Color theme', { exact: true }).selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.waitForTimeout(350);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export workspace' }).click();
  expect((await downloaded).suggestedFilename()).toBe('atlas-workspace.json');
  await page.getByRole('button', { name: 'Reset demo workspace' }).click();
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Explore freely' })).toBeVisible();
  await page.getByRole('button', { name: 'Explore freely' }).click();
  await expect(page.locator('.data-summary')).toContainText('5 workflows');
});
test('Copilot explains real graphs, rejects unsupported input and creates templates', async ({
  page,
}) => {
  await enter(page, '/app/workflows/support-triage');
  await page.getByRole('button', { name: 'Ask Atlas' }).click();
  await page.getByRole('button', { name: 'Explain this workflow', exact: true }).click();
  await expect(page.locator('.copilot-messages')).toContainText('8 nodes and 8 connections');
  await page.getByLabel('Copilot request').fill('Write a poem');
  await page.getByRole('button', { name: 'Send request' }).click();
  await expect(page.locator('.copilot-messages')).toContainText('not supported');
  await page.getByRole('button', { name: 'Create a support triage workflow' }).click();
  await page.getByRole('button', { name: 'Create this workflow' }).click();
  await expect(page.getByLabel('Workflow name', { exact: true })).toHaveValue(
    'Customer Support Triage',
  );
  await page.goto('/app/executions/seed-0008');
  await page.getByRole('button', { name: 'Ask Atlas' }).click();
  await page.getByRole('button', { name: 'Explain this workflow', exact: true }).click();
  await expect(page.locator('.copilot-messages')).toContainText('Employee Onboarding');
  await page.getByRole('button', { name: 'Why did the last execution fail?', exact: true }).click();
  await expect(page.locator('.copilot-messages')).toContainText('503');
});
for (const route of [
  '/engineering',
  '/engineering/architecture',
  '/engineering/design-system',
  '/engineering/performance',
  '/engineering/testing',
  '/benchmarks',
])
  test(`direct refresh works at ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
test('benchmarks expose measured artifacts and missing assets remain 404', async ({
  page,
  request,
}) => {
  await page.goto('/benchmarks');
  await expect(page.getByRole('cell', { name: '250 nodes', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: /graph-.*\.js/ })).toBeVisible();
  expect((await request.get('/storybook/missing-asset.js')).status()).toBe(404);
  expect((await request.get('/assets/missing.js')).status()).toBe(404);
});
test('Storybook loads under its prefix and interactive stories use shared components', async ({
  page,
}) => {
  await page.goto('/storybook/');
  await expect(page.locator('#storybook-explorer-tree')).toBeVisible({ timeout: 30000 });
  await page.goto('/storybook/iframe.html?id=actions-button--primary&viewMode=story');
  await expect(page.getByRole('button', { name: 'Run simulation', exact: true })).toBeVisible({
    timeout: 30000,
  });
  await page.getByRole('button', { name: 'Run simulation', exact: true }).click();
});
for (const theme of ['light', 'dark'] as const)
  test(`axe checks the landing, dashboard, library and keyboard editor in ${theme} mode`, async ({
    page,
  }) => {
    await enter(page, '/app/settings');
    await page.getByLabel('Color theme', { exact: true }).selectOption(theme);
    for (const route of ['/', '/app', '/app/workflows', '/app/workflows/support-triage']) {
      await page.goto(route);
      await expect(page.locator('#main')).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      if (route.includes('support-triage')) {
        await page.getByRole('button', { name: 'Show accessible node list', exact: true }).click();
        await page.getByRole('button', { name: 'Close inspector' }).click();
      }
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(
        results.violations,
        JSON.stringify(
          results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
          null,
          2,
        ),
      ).toEqual([]);
    }
  });
test('mobile layouts retain navigation and have no horizontal document overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enter(page);
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page.getByRole('link', { name: 'Workflows', exact: false }).first().click();
  await expect(page.getByRole('heading', { name: 'Workflows.', exact: true })).toBeVisible();
  for (const route of [
    '/',
    '/app',
    '/app/workflows/support-triage',
    '/engineering',
    '/benchmarks',
  ]) {
    await page.goto(route);
    await expect(page.locator('#main')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
  }
  await page.goto('/unknown-route');
  await expect(page.getByRole('heading', { name: 'A small detour.' })).toBeVisible();
});
test('keyboard shortcut opens command menu and focus stays inside the dialog', async ({ page }) => {
  await enter(page);
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByLabel('Search commands').fill('Analytics');
  await page.getByRole('button', { name: 'Analytics', exact: true }).click();
  await expect(page).toHaveURL('/app/analytics');
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
});
test('capture stable major product states', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await testInfo.attach('landing-desktop', {
    body: await page.screenshot({ fullPage: true, animations: 'disabled' }),
    contentType: 'image/png',
  });
  await enter(page);
  await testInfo.attach('workspace-desktop', {
    body: await page.screenshot({ fullPage: true, animations: 'disabled' }),
    contentType: 'image/png',
  });
  await enter(page, '/app/workflows/support-triage');
  await page.getByRole('button', { name: 'Close inspector' }).click();
  await testInfo.attach('editor-desktop', {
    body: await page.screenshot({ animations: 'disabled' }),
    contentType: 'image/png',
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/app');
  await testInfo.attach('workspace-mobile', {
    body: await page.screenshot({ fullPage: true, animations: 'disabled' }),
    contentType: 'image/png',
  });
});

test('node movement is undoable, graph reset restores the opened version, and shortcuts are documented', async ({
  page,
}) => {
  await enter(page, '/app/workflows/new');
  await page.getByLabel('Workflow name').fill('Movement checks');
  await page.getByRole('button', { name: 'Create workflow', exact: true }).click();
  const trigger = page.locator('.react-flow__node').filter({ hasText: 'Sample event' }).first();
  await expect(trigger).toBeVisible();
  await expect(page.locator('.react-flow__minimap-node')).toHaveCount(2);
  await expect(page.locator('.react-flow__minimap-svg')).toHaveAttribute('width', '110');
  const before = await trigger.getAttribute('style');
  const box = await trigger.boundingBox();
  if (!box) throw Error('Node is not visible');
  await page.mouse.move(box.x + box.width / 2, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 65, box.y + 90, { steps: 8 });
  await page.mouse.up();
  await expect(trigger).not.toHaveAttribute('style', before!);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(trigger).toHaveAttribute('style', before!);
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect(trigger).not.toHaveAttribute('style', before!);
  await page.getByRole('button', { name: 'Reset graph to opened version' }).click();
  await page.getByRole('button', { name: 'Restore graph', exact: true }).click();
  await expect(trigger).toHaveAttribute('style', before!);
  await page.getByRole('button', { name: 'Help & getting started' }).click();
  await page.getByRole('menuitem', { name: 'Keyboard shortcuts', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveAccessibleName('A few useful shortcuts');
  await expect(page.getByText('Copy and paste selected nodes', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('every application route supports direct navigation and refresh', async ({ page }) => {
  await enter(page);
  for (const route of [
    '/app',
    '/app/workflows',
    '/app/workflows/new',
    '/app/workflows/support-triage',
    '/app/executions',
    '/app/executions/seed-0001',
    '/app/analytics',
    '/app/settings',
  ]) {
    await page.goto(route);
    await expect(page.locator('#main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await page.reload();
    await expect(page.locator('#main')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Let’s reconnect.' })).toHaveCount(0);
  }
});
