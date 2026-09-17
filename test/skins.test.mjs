import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const { SKINS, DEFAULT_SKIN, SKIN_IDS, normalizeSkin, COMPONENT_STYLES, DEFAULT_STYLE, STYLE_IDS, normalizeStyle } = await import('../src/model/skins.js');
const { RELATION_TYPES, LEVEL_DEFS } = await import('../src/model/relation-types.js');

test('every registered skin has dark & light token blocks', () => {
  const tokensCss = readFileSync(path.join(repoRoot, 'src', 'styles', 'tokens.css'), 'utf8');
  const skinsCss = readFileSync(path.join(repoRoot, 'src', 'styles', 'skins.css'), 'utf8');
  for (const skin of SKINS) {
    // The default skin owns the base token blocks in tokens.css; every other
    // skin must ship full palette overrides in skins.css.
    const css = skin.id === DEFAULT_SKIN ? tokensCss : skinsCss;
    const darkSelector = skin.id === DEFAULT_SKIN
      ? '[data-theme="dark"]'
      : `[data-skin="${skin.id}"][data-theme="dark"]`;
    const lightSelector = skin.id === DEFAULT_SKIN
      ? '[data-theme="light"]'
      : `[data-skin="${skin.id}"][data-theme="light"]`;
    assert.ok(css.includes(darkSelector), `missing dark block for ${skin.id}`);
    assert.ok(css.includes(lightSelector), `missing light block for ${skin.id}`);
    assert.match(skin.label, /\S/);
    assert.match(skin.swatch.dark, /^#[0-9a-f]{6}$/);
    assert.match(skin.swatch.light, /^#[0-9a-f]{6}$/);
    assert.match(skin.swatch.accent, /^#[0-9a-f]{6}$/);
  }
});

test('default skin is registered and unknown ids normalize to null', () => {
  assert.ok(SKIN_IDS.has(DEFAULT_SKIN));
  assert.equal(normalizeSkin(DEFAULT_SKIN), DEFAULT_SKIN);
  assert.equal(normalizeSkin('does-not-exist'), null);
  assert.ok(STYLE_IDS.has(DEFAULT_STYLE));
  assert.equal(normalizeStyle(DEFAULT_STYLE), DEFAULT_STYLE);
  assert.equal(normalizeStyle('does-not-exist'), null);
});

test('every component style pack has matching CSS rules', () => {
  const css = readFileSync(path.join(repoRoot, 'src', 'styles', 'concept-explain.css'), 'utf8');
  // `classic` is the un-scoped base; the manuscript pack is scoped overrides.
  // The manuscript pack is scoped overrides on top of the classic base; it
  // must cover annotations-adjacent records, plates, notes, flow and math.
  for (const rule of [
    `[data-style='manuscript'] .semantic-evidence`,
    `[data-style='manuscript'] .semantic-note`,
    `[data-style='manuscript'] .math-block-expression`,
    `[data-style='manuscript'] .flow-box`,
    `[data-style='manuscript'] .semantic-chart`,
  ]) {
    assert.ok(css.includes(rule), `manuscript pack missing ${rule}`);
  }
  // Callout/insight keep the canonical boxed look in both packs: the base
  // must NOT be overridden by the manuscript pack.
  assert.ok(!css.includes(`[data-style='manuscript'] .semantic-callout`));
  assert.ok(!css.includes(`[data-style='manuscript'] .insight-kicker`));
});

test('relation and level colors are themeable var() references', () => {
  for (const def of Object.values(RELATION_TYPES)) {
    assert.match(def.color, /^var\(--rel-[\w-]+\)$/, `relation color must be a var(): ${def.color}`);
  }
  for (const def of Object.values(LEVEL_DEFS)) {
    assert.match(def.color, /^var\(--level-l[0-4]\)$/, `level color must be a var(): ${def.color}`);
  }
});

test('tokens.css defines every relation/level variable in both modes', () => {
  const css = readFileSync(path.join(repoRoot, 'src', 'styles', 'tokens.css'), 'utf8');
  const darkBlock = css.slice(css.indexOf(':root'), css.indexOf('[data-theme="light"]'));
  const lightBlock = css.slice(css.indexOf('[data-theme="light"]'));
  const names = [
    ...Object.keys(RELATION_TYPES).map(id => `--rel-${id}`),
    '--rel-default',
    ...Object.keys(LEVEL_DEFS).map(id => `--level-${id.toLowerCase()}`),
  ];
  for (const name of names) {
    assert.ok(darkBlock.includes(name), `missing ${name} in dark tokens`);
    assert.ok(lightBlock.includes(name), `missing ${name} in light tokens`);
  }
});
