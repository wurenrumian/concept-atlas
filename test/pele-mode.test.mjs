import test from 'node:test';
import assert from 'node:assert/strict';
import config from '../vite.config.js';

// The Pele feature (the renderer behind <Mermaid>) has two build outcomes:
//   - document has no <Mermaid> -> throwing stub (never bundled)
//   - document has <Mermaid>    -> the real `pele` import (bundled, offline)
const plugin = config.plugins.find(entry => entry.name === 'concept-atlas-optional-features');

function loadModule(defines, source) {
  plugin.configResolved({ define: defines });
  const id = plugin.resolveId(source);
  return id === null ? null : plugin.load(id);
}

test('missing <Mermaid> resolves to the throwing stub', () => {
  const code = loadModule(
    { __ATLAS_FEATURES__: JSON.stringify({ math: true, pele: false }) },
    'pele'
  );
  assert.match(code, /is not bundled in this build/);
  assert.match(code, /export \{ render \}/);
});

test('a document with <Mermaid> keeps the real pele import (bundled)', () => {
  plugin.configResolved({
    define: { __ATLAS_FEATURES__: JSON.stringify({ math: true, pele: true }) }
  });
  assert.equal(plugin.resolveId('pele'), null);
});

test('unused KaTeX still resolves to an empty stylesheet stub', () => {
  const code = loadModule(
    { __ATLAS_FEATURES__: JSON.stringify({ math: false, pele: true }) },
    'katex/dist/katex.min.css'
  );
  assert.equal(code, '');
});
