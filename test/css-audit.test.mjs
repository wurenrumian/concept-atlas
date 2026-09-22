import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditCss } from '../scripts/css-usage-audit.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Guards the cleanup that removed the dead class families: the audit is a
// static check, so it belongs in the suite to catch a rule that loses its last
// consumer. The script itself stays runnable via `npm run audit:css`.
test('no stylesheet class selector is unreachable from the source', () => {
  const { cssClasses, orphans } = auditCss({ root: repoRoot });
  const detail = orphans
    .map(cls => `  .${cls}  (${[...cssClasses.get(cls)].join(', ')})`)
    .join('\n');
  assert.equal(orphans.length, 0, `dead CSS classes found:\n${detail}`);
});

// A walk or parse that silently finds nothing would make the test above pass
// vacuously, so pin the audit's inputs to something plausibly non-empty.
test('the audit sees both the stylesheets and the emitted class tokens', () => {
  const { cssClasses, referenced, dynamicPrefixes } = auditCss({ root: repoRoot });
  assert.ok(cssClasses.size > 100, `expected many class selectors, saw ${cssClasses.size}`);
  assert.ok(referenced.size > 100, `expected many referenced tokens, saw ${referenced.size}`);
  assert.ok(dynamicPrefixes.has('tone-'), 'expected template-literal prefixes such as `tone-`');
});
