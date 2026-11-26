import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateMdxSource } from '../src/model/validate-content.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docs = [
  'README.md',
  'docs/README.md',
  'docs/FRAMEWORK.md',
  'docs/USAGE.md',
  'packages/concept-atlas-dense-explain/README.md'
];
const read = relative => readFileSync(path.join(repoRoot, relative), 'utf8');

test('project documentation has a clear entry point and role split', () => {
  assert.match(read('README.md'), /\[内容编写指南\]\(docs\/FRAMEWORK\.md\)/);
  assert.match(read('README.md'), /\[CLI 与开发指南\]\(docs\/USAGE\.md\)/);
  assert.match(read('README.md'), /\[完整文档索引\]\(docs\/README\.md\)/);
  assert.match(read('docs/FRAMEWORK.md'), /^# Concept Atlas 内容编写指南/);
  assert.match(read('docs/USAGE.md'), /^# Concept Atlas CLI 与开发指南/);
  assert.ok(read('docs/README.md').includes('../skills/concept-atlas-dense-explain/SKILL.md'));
});

test('relative Markdown links in project docs resolve', () => {
  for (const relative of docs) {
    const source = read(relative);
    for (const match of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const target = match[1].trim();
      if (/^(https?:|mailto:|#|data:)/.test(target)) continue;
      const clean = target.split('#')[0].split('?')[0];
      if (!clean) continue;
      const resolved = path.resolve(repoRoot, path.dirname(relative), clean);
      assert.ok(existsSync(resolved), `${relative} links to missing ${target}`);
    }
  }
});

test('docs avoid stale API examples and overbroad offline claims', () => {
  const combined = docs.map(read).join('\n');
  const cli = read('packages/concept-atlas-dense-explain/bin/cli.mjs');
  assert.doesNotMatch(combined, /fully offline single file with no CDN call/i);
  assert.doesNotMatch(cli, /fully offline single file/i);
  assert.doesNotMatch(combined, /错误 prop 会直接报错/);
  assert.doesNotMatch(combined, /<Flow\s+title=/);
  assert.doesNotMatch(combined, /`tone` 支持 `info`、`warn`、`success`/);
  assert.match(cli, /create\/guide default to scroll; validate\/build detect/);
  assert.match(combined, /guide.*assets\//i);
});

test('Atlas examples give every ConceptNode a summary', () => {
  for (const relative of ['README.md', 'docs/FRAMEWORK.md']) {
    const source = read(relative);
    for (const match of source.matchAll(/<ConceptNode\b([\s\S]*?)>/g)) {
      assert.match(match[1], /\bsummary=/, `${relative} has a ConceptNode without summary`);
    }
  }
});

test('complete MDX examples in the docs validate', () => {
  for (const relative of ['README.md', 'docs/FRAMEWORK.md']) {
    const source = read(relative);
    for (const match of source.matchAll(/```mdx\n([\s\S]*?)```/g)) {
      const example = match[1];
      if (!example.includes('<ExplainPage') && !example.includes('<ScrollDocument')) continue;
      const mode = example.includes('<ExplainPage') ? 'atlas' : 'scroll';
      const errors = validateMdxSource(example, { mode }).diagnostics.filter(
        diagnostic => diagnostic.severity === 'error'
      );
      assert.deepEqual(errors, [], `${relative} has an invalid ${mode} example`);
    }
  }
});
