import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateMdxSource, countBySeverity } from '../src/model/validate-content.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const args = process.argv.slice(2);
const strict = args.includes('--strict');
const explicit = args.filter(arg => !arg.startsWith('--'));

const files = explicit.length
  ? explicit.map(file => path.resolve(file))
  : ['content/components-demo.mdx', 'content/compile-runtime.mdx', 'content/scroll-reading-demo.mdx']
    .map(file => path.join(rootDir, file));

let errors = 0;

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.error(`missing file: ${file}`);
    errors += 1;
    continue;
  }
  const source = fs.readFileSync(file, 'utf8');
  const result = validateMdxSource(source, {
    filePath: file,
    strict,
    assetExists: spec => fs.existsSync(path.resolve(path.dirname(file), spec)),
  });
  const { error, warning } = countBySeverity(result.diagnostics);
  errors += error;
  console.log(`${path.relative(rootDir, file)}  ${result.carrier || 'unknown'}  errors=${error} warnings=${warning}`);
  for (const item of result.diagnostics) {
    const label = item.severity === 'error' ? 'error' : 'warn ';
    console.log(`  ${label} ${item.line}:${item.column}  ${item.code}  ${item.message}`);
  }
}

if (errors) {
  console.error(`\nConcept Atlas content validation failed: ${errors} error(s).`);
  process.exit(1);
}
console.log('\nConcept Atlas content validation passed.');
