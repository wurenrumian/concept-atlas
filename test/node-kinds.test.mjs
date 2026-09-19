import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NODE_KINDS, NODE_KIND_NAMES, NODE_KIND_SET, normalizeKind, kindInfo } from '../src/model/node-kinds.js';
import { normalizeNode, buildGraphModel } from '../src/model/concept-schema.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('every node kind declares a label, description and a var() tone', () => {
  assert.ok(NODE_KIND_NAMES.length >= 8);
  for (const id of NODE_KIND_NAMES) {
    const def = NODE_KINDS[id];
    assert.match(def.label, /\S/, `${id} needs a label`);
    assert.match(def.description, /\S/, `${id} needs a description`);
    // The tone is consumed inline by badges and D3; it must be a theme token.
    assert.equal(def.tone, `var(--kind-${id})`, `${id} tone must reference its token`);
  }
});

test('normalizeKind accepts registered ids and rejects everything else', () => {
  assert.equal(normalizeKind('failure'), 'failure');
  assert.equal(normalizeKind('nope'), null);
  assert.equal(normalizeKind(''), null);
  assert.equal(normalizeKind(undefined), null);
  assert.ok(NODE_KIND_SET.has('mechanism'));
  assert.equal(kindInfo('failure').label, '故障');
  assert.equal(kindInfo(null), null);
  assert.equal(kindInfo('nope'), null);
});

test('tokens.css defines every kind tone in both themes', () => {
  const css = readFileSync(path.join(repoRoot, 'src', 'styles', 'tokens.css'), 'utf8');
  const darkBlock = css.slice(css.indexOf(':root'), css.indexOf('[data-theme="light"]'));
  const lightBlock = css.slice(css.indexOf('[data-theme="light"]'));
  for (const id of NODE_KIND_NAMES) {
    const name = `--kind-${id}`;
    assert.ok(darkBlock.includes(name), `missing ${name} in dark tokens`);
    assert.ok(lightBlock.includes(name), `missing ${name} in light tokens`);
  }
});

test('normalizeNode defaults kind and structured argument fields', () => {
  const node = normalizeNode({ id: 'a', title: 'A', kind: 'mechanism' });
  assert.equal(node.kind, 'mechanism');
  assert.deepEqual(node.invariants, []);
  assert.deepEqual(node.evidence, []);
  assert.deepEqual(node.failureModes, []);
  assert.deepEqual(node.tradeoffs, []);
  assert.deepEqual(node.learningObjectives, []);
  assert.deepEqual(node.keyQuestions, []);

  const invalid = normalizeNode({ id: 'b', title: 'B', kind: 'nope' });
  assert.equal(invalid.kind, null);
});

test('buildGraphModel reports unknown kinds and keeps valid ones', () => {
  const model = buildGraphModel({
    meta: {},
    nodes: [
      { id: 'r', title: 'R', level: 'L0', kind: 'system' },
      { id: 'x', title: 'X', level: 'L1', parent: 'r', kind: 'bogus' },
    ],
    relations: [],
  });
  assert.equal(model.nodes.get('r').kind, 'system');
  assert.equal(model.nodes.get('x').kind, null);
  assert.ok(model.diagnostics.map(d => d.code).includes('UNKNOWN_KIND'));
});
