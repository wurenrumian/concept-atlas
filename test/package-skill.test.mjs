import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageRoot = path.join(repoRoot, 'packages', 'concept-atlas-dense-explain');

test('the npm tarball contains the complete portable skill', () => {
  const output = execSync('npm pack --dry-run 2>&1', {
    cwd: packageRoot,
    encoding: 'utf8'
  });

  for (const required of [
    'packaged-skill/SKILL.md',
    'packaged-skill/references/authoring.md',
    'packaged-skill/references/cli.md',
    'packaged-skill/references/components.md',
    'packaged-skill/references/diagnostics.md',
    'packaged-skill/references/atlas-guide.mdx',
    'packaged-skill/references/scroll-guide.mdx',
    'packaged-skill/references/assets/sample-diagram.svg'
  ]) {
    assert.ok(output.includes(required), `npm tarball is missing ${required}`);
  }
});
