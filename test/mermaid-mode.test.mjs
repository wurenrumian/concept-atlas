import test from 'node:test';
import assert from 'node:assert/strict';
import config from '../vite.config.js';

// The mermaid feature has three build outcomes:
//   - document has no <Mermaid>       -> throwing stub (never bundled)
//   - document has <Mermaid>, inline  -> normal `mermaid` import (bundled)
//   - document has <Mermaid>, cdn     -> virtual loader that injects the CDN
//     build at runtime (default; keeps ~2100 modules out of the build)
const plugin = config.plugins.find(entry => entry.name === 'concept-atlas-optional-features');

function loadModule(defines, source) {
  plugin.configResolved({ define: defines });
  const id = plugin.resolveId(source);
  return id === null ? null : plugin.load(id);
}

test('missing <Mermaid> resolves to the throwing stub', () => {
  const code = loadModule({ __ATLAS_FEATURES__: JSON.stringify({ math: true, mermaid: false }) }, 'mermaid');
  assert.match(code, /is not bundled in this build/);
});

test('cdn mode resolves mermaid to the runtime CDN loader', () => {
  const code = loadModule(
    { __ATLAS_FEATURES__: JSON.stringify({ math: true, mermaid: true }), __ATLAS_MERMAID_MODE__: '"cdn"' },
    'mermaid',
  );
  assert.match(code, /cdn\.jsdelivr\.net\/npm\/mermaid@11\/dist\/mermaid\.min\.js/);
  assert.match(code, /document\.createElement\('script'\)/);
  assert.match(code, /window\.mermaid/);
});

test('inline mode keeps the real mermaid import (bundled)', () => {
  const id = (() => {
    plugin.configResolved({ define: { __ATLAS_FEATURES__: JSON.stringify({ math: true, mermaid: true }), __ATLAS_MERMAID_MODE__: '"inline"' } });
    return plugin.resolveId('mermaid');
  })();
  assert.equal(id, null);
});

test('--mermaid-cdn overrides the loader URL', () => {
  const code = loadModule(
    {
      __ATLAS_FEATURES__: JSON.stringify({ math: true, mermaid: true }),
      __ATLAS_MERMAID_MODE__: '"cdn"',
      __ATLAS_MERMAID_CDN_URL__: '"https://cdn.example.com/mmd.min.js"',
    },
    'mermaid',
  );
  assert.match(code, /https:\/\/cdn\.example\.com\/mmd\.min\.js/);
});

test('unused KaTeX still resolves to an empty stylesheet stub', () => {
  const code = loadModule({ __ATLAS_FEATURES__: JSON.stringify({ math: false, mermaid: true }) }, 'katex/dist/katex.min.css');
  assert.equal(code, '');
});
