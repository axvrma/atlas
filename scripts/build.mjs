import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { gzipSync } from 'node:zlib';
import { performance } from 'node:perf_hooks';
const start = performance.now();
for (const args of [['benchmark'], ['build:apps']]) {
  const result = spawnSync('pnpm', args, {
    stdio: 'inherit',
    env: { ...process.env, STORYBOOK_DISABLE_TELEMETRY: '1', DO_NOT_TRACK: '1' },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
cpSync('apps/web/dist', 'dist', { recursive: true });
cpSync('apps/storybook/storybook-static', 'dist/storybook', { recursive: true });
cpSync('apps/web/public/404.html', 'dist/storybook/404.html');
const assets = readdirSync('dist/assets')
  .filter((n) => n.endsWith('.js'))
  .map((name) => {
    const file = readFileSync(`dist/assets/${name}`);
    return { name, bytes: statSync(`dist/assets/${name}`).size, gzipBytes: gzipSync(file).length };
  })
  .sort((a, b) => b.bytes - a.bytes);
mkdirSync('dist/reports', { recursive: true });
writeFileSync(
  'dist/reports/build.json',
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      durationSeconds: (performance.now() - start) / 1000,
      assets,
    },
    null,
    2,
  ) + '\n',
);
console.log(`Combined static site ready in dist/ (${assets.length} JavaScript chunks).`);
