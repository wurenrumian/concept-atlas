import { register } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

// Register before importing the barrel: MDXComponents.jsx imports JSX and CSS.
register('./support/jsx-css-hook.mjs', import.meta.url);

/**
 * The barrel doubles as the MDX component registry (main.jsx passes it as
 * `components`), while KNOWN_COMPONENTS is what the validator accepts. The two
 * lists are maintained in separate files, so this test makes drift visible:
 * an export missing from KNOWN_COMPONENTS would make the validator reject a
 * component that actually works (this is exactly what happened to ScrollToc),
 * and a KNOWN_COMPONENTS entry missing from the barrel would let MDX reference
 * a component that crashes at render time.
 */
test('the component barrel and KNOWN_COMPONENTS stay in sync', async () => {
  const Components = await import('../src/components/index.js');
  const { KNOWN_COMPONENT_SET } = await import('../src/model/validate-content.js');

  const exported = Object.keys(Components).filter(name => name !== 'default').sort();
  const missingFromRegistry = exported.filter(name => !KNOWN_COMPONENT_SET.has(name));
  const notExported = [...KNOWN_COMPONENT_SET].filter(name => !exported.includes(name)).sort();

  assert.deepEqual(
    missingFromRegistry,
    [],
    `exported but missing from KNOWN_COMPONENTS: ${missingFromRegistry.join(', ')}`,
  );
  assert.deepEqual(
    notExported,
    [],
    `in KNOWN_COMPONENTS but not exported by the barrel: ${notExported.join(', ')}`,
  );
});
