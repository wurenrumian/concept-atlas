import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { transform } from 'esbuild';

// Lets the test runner import the real renderer: `.jsx` is transformed with
// esbuild and `.css` imports are stubbed, since Node cannot load them directly.
export async function load(url, context, nextLoad) {
  if (url.endsWith('.css')) {
    return { format: 'module', source: 'export default {};', shortCircuit: true };
  }
  if (url.endsWith('.jsx')) {
    const source = await readFile(fileURLToPath(url), 'utf8');
    const result = await transform(source, { loader: 'jsx', format: 'esm', jsx: 'automatic' });
    return { format: 'module', source: result.code, shortCircuit: true };
  }
  return nextLoad(url, context);
}
