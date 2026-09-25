import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * `src/` is the single source of truth and the npm template is generated from
 * it. A committed output that drifts from its source is a bug that only shows
 * up in a published tarball, so lock it down here. Prepack-only copies
 * (`packaged-skill/`) are gitignored and skipped by `--check`.
 */
test('the committed package template is in sync with src/', () => {
  const output = execFileSync(process.execPath, ['scripts/sync-template.mjs', '--check'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.match(output, /in sync/);
});
