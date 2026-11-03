import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'smol-toml';

// Netlify ignores trailing slashes when matching custom redirect rules.
// Compare normalized destinations, rather than relying on our local server's
// exact pathname matching, which cannot reproduce this CDN behavior.
function findRedirectLoops(toml: string): string[] {
  const redirects = parse(toml).redirects;
  if (!Array.isArray(redirects)) throw Error('Expected Netlify redirect tables.');
  const normalize = (path: string) => {
    const url = new URL(path, 'https://atlas.axvrma.com');
    return `${url.origin}${url.pathname.replace(/\/+$/, '') || '/'}${url.search}`;
  };
  const loops: string[] = [];
  for (const rule of redirects) {
    if (!rule || typeof rule !== 'object' || !('from' in rule) || !('to' in rule)) {
      throw Error('Each redirect needs a source and destination.');
    }
    if (typeof rule.from !== 'string' || typeof rule.to !== 'string') {
      throw Error('Redirect paths must be strings.');
    }
    const status = 'status' in rule ? rule.status : 301;
    if (
      typeof status === 'number' &&
      status >= 300 &&
      status < 400 &&
      normalize(rule.from) === normalize(rule.to)
    ) {
      loops.push(`${rule.from} -> ${rule.to}`);
    }
  }
  return loops;
}

describe('Netlify redirect normalization', () => {
  it('rejects the production slash-only redirect loop', () => {
    expect(
      findRedirectLoops(`
[[redirects]]
from = "/storybook"
to = "/storybook/"
status = 301
force = true
`),
    ).toEqual(['/storybook -> /storybook/']);
  });

  it('keeps the deployed configuration free of normalized self-redirects', () => {
    const config = readFileSync('netlify.toml', 'utf8');
    expect(findRedirectLoops(config)).toEqual([]);
  });
});
