import { register } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Register before importing the renderer: MDXComponents.jsx imports CSS and JSX.
register('./support/jsx-css-hook.mjs', import.meta.url);

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Renders each shipped example through the real component tree with
 * react-dom/server. This catches render-time crashes (e.g. a component
 * shadowing a global) that a successful Vite build does not.
 */
async function render(relativePath) {
  const React = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const jsxRuntime = await import('react/jsx-runtime');
  const { evaluate } = await import('@mdx-js/mdx');
  const Components = await import('../src/components/index.js');

  const source = readFileSync(path.join(repoRoot, relativePath), 'utf8');
  const { default: Content } = await evaluate(source, { ...jsxRuntime, baseUrl: import.meta.url });
  return renderToStaticMarkup(React.createElement(Content, { components: Components }));
}

test('atlas example renders its concept tree, charts and math', async () => {
  const html = await render('content/atlas-guide.mdx');
  assert.ok(html.length > 5000);
  assert.match(html, /data-component="ConceptNode"/);
  assert.match(html, /chart-canvas/);
  assert.match(html, /katex/);
  assert.match(html, /semantic-figure/);
  // Figures expose a keyboard-reachable zoom trigger instead of a bare <img>.
  assert.match(html, /class="figure-zoom-trigger"/);
  assert.match(html, /figure-zoom-hint/);
  // The overlay is mounted only on demand, so it must not be in the initial tree.
  assert.doesNotMatch(html, /image-zoom-overlay/);
  // The learning/provenance/data components must actually render from the guide.
  for (const cls of [
    'semantic-worked-example', 'worked-step-reason', 'semantic-data-table',
    'semantic-state-machine', 'semantic-quiz', 'semantic-key-takeaways',
    'semantic-metric', 'semantic-code-diff', 'semantic-decision-tree',
    'semantic-feedback-loop', 'semantic-source', 'semantic-confidence', 'semantic-term',
  ]) {
    assert.match(html, new RegExp(cls), `atlas guide missing ${cls}`);
  }
});

test('scroll example renders prose, charts, math and citations', async () => {
  const html = await render('content/scroll-guide.mdx');
  assert.ok(html.length > 5000);
  assert.match(html, /continuous-document/);
  assert.match(html, /chart-canvas/);
  assert.match(html, /semantic-figure/);
  assert.match(html, /semantic-references|reference-list/);
  // Frontmatter must not leak into rendered output.
  assert.doesNotMatch(html, /title: scroll-guide/);
  for (const cls of [
    'semantic-worked-example', 'semantic-data-table', 'semantic-state-machine',
    'semantic-quiz', 'semantic-key-takeaways', 'semantic-metric',
    'semantic-code-diff', 'semantic-decision-tree', 'semantic-feedback-loop',
    'semantic-source', 'semantic-confidence', 'semantic-term',
  ]) {
    assert.match(html, new RegExp(cls), `scroll guide missing ${cls}`);
  }
});

test('the long-form compile-runtime example renders', async () => {
  const html = await render('content/compile-runtime.mdx');
  assert.ok(html.length > 5000);
  assert.match(html, /data-component="ExplainPage"/);
});
