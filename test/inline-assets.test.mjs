import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../vite.config.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mdxFile = path.join(repoRoot, 'content', 'topic.mdx');
const plugin = config.plugins.find(entry => entry.name === 'concept-atlas-inline-assets');

/** Runs the plugin with the given define map; returns the rewritten code or null. */
function transform(code, define = {}) {
  plugin.configResolved({ define });
  const result = plugin.transform(code, mdxFile);
  return result ? result.code : null;
}

// The asset exists in content/assets, so a relative path can be resolved.
const IMG = './assets/sample-diagram.svg';
const DATA_URI = /data:image\/svg\+xml;base64,/;

test('linking is the default: a relative src is left untouched', () => {
  assert.equal(transform(`<Figure src="${IMG}" />`), null);
});

test('--inline-assets turns a relative src into a data URI', () => {
  const output = transform(`<Figure src="${IMG}" />`, { __ATLAS_INLINE_ASSETS__: '"true"' });
  assert.match(output, DATA_URI);
});

test('a per-tag inline={true} overrides the link default', () => {
  const output = transform(`<Figure src="${IMG}" inline={true} />`);
  assert.match(output, DATA_URI);
});

test('a per-tag inline={false} overrides --inline-assets', () => {
  const output = transform(`<Figure src="${IMG}" inline={false} />`, { __ATLAS_INLINE_ASSETS__: '"true"' });
  assert.equal(output, null);
});

test('remote, data and absolute sources are never inlined', () => {
  const code = [
    `<Figure src="https://example.com/a.png" />`,
    `<Figure src="data:image/png;base64,AAAA" />`,
    `<Figure src="/absolute.png" />`,
  ].join('\n');
  assert.equal(transform(code, { __ATLAS_INLINE_ASSETS__: '"true"' }), null);
});

test('samples inside code fences and inline code are not rewritten', () => {
  const fenced = '```mdx\n<Figure src="' + IMG + '" />\n```';
  assert.equal(transform(fenced, { __ATLAS_INLINE_ASSETS__: '"true"' }), null);

  const inline = `Write \`<Figure src="${IMG}" />\` to embed it.`;
  assert.equal(transform(inline, { __ATLAS_INLINE_ASSETS__: '"true"' }), null);
});

test('markdown images follow the global flag', () => {
  assert.equal(transform(`![alt](${IMG})`), null);
  const output = transform(`![alt](${IMG})`, { __ATLAS_INLINE_ASSETS__: '"true"' });
  assert.match(output, DATA_URI);
});

test('a missing file keeps its relative link rather than breaking the build', () => {
  assert.equal(transform(`<Figure src="./assets/nope.png" inline={true} />`), null);
});
