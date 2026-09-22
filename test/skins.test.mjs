import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stylesRoot = path.join(repoRoot, 'src', 'styles');

// The entry stylesheet is an @import manifest, so structure lives across
// core.css + packs/*.css. Tests that scan rules must read the whole tree.
function readAllStyles() {
  const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.name.endsWith('.css') ? [readFileSync(full, 'utf8')] : [];
  });
  return walk(stylesRoot).join('\n');
}

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
  const css = readAllStyles();
  // `classic` is the un-scoped base; the manuscript pack is scoped overrides.
  // The manuscript pack is scoped overrides on top of the classic base; it
  // must cover annotations-adjacent records, plates, notes, flow and math.
  for (const rule of [
    `[data-style='manuscript'] .semantic-evidence`,
    `[data-style='manuscript'] .semantic-note`,
    `[data-style='manuscript'] .math-block-expression`,
    `[data-style='manuscript'] .semantic-chart`,
  ]) {
    assert.ok(css.includes(rule), `manuscript pack missing ${rule}`);
  }
  // Manuscript re-reads every annotation as a margin note. Insight, callout
  // and guiding question must all be overridden together so the trio stays
  // visually consistent instead of mixing the boxed chassis with marginalia.
  for (const rule of [
    `[data-style='manuscript'] .semantic-insight`,
    `[data-style='manuscript'] .semantic-callout`,
    `[data-style='manuscript'] .semantic-key-question`,
    `[data-style='manuscript'] .callout-title`,
    `[data-style='manuscript'] .insight-kicker`,
    `[data-style='manuscript'] .semantic-flow-steps`,
    `[data-style='manuscript'] .semantic-references`,
    `[data-style='manuscript'] .semantic-example`,
    `[data-style='manuscript'] .semantic-definition`,
  ]) {
    assert.ok(css.includes(rule), `manuscript pack missing ${rule}`);
  }
});

test('component style packs re-voice typography through shared font tokens', () => {
  const tokensCss = readFileSync(path.join(repoRoot, 'src', 'styles', 'tokens.css'), 'utf8');
  const css = readAllStyles();

  // tokens.css owns the family stacks; packs only remap the role tokens.
  for (const token of ['--font-sans', '--font-serif', '--font-mono', '--font-body', '--font-heading', '--font-lead', '--font-label', '--font-data']) {
    assert.ok(tokensCss.includes(token), `tokens.css missing ${token}`);
  }

  // Structure rules must never hardcode a family stack again.
  const families = [...css.matchAll(/font-family:\s*([^;]+);/g)].map(match => match[1].trim());
  assert.ok(families.length > 0, 'expected font-family declarations in the stylesheets');
  for (const family of families) {
    assert.match(family, /^(inherit|var\(--font-[\w-]+\))$/, `font-family must consume a font token: ${family}`);
  }

  // Each pack must declare its heading voice so switching packs visibly changes type.
  for (const pack of ['classic', 'manuscript', 'shadcn', 'elastic']) {
    const block = css.slice(css.indexOf(`[data-style='${pack}']`));
    assert.ok(block.includes('--font-heading:'), `${pack} pack must set --font-heading`);
  }
});

test('new component packs restate the shared grammar without a new palette', () => {
  const css = readAllStyles();
  // Each pack must cover the same surfaces as manuscript so a reader switching
  // packs never sees a component fall back to the classic chassis.
  for (const pack of ['shadcn', 'elastic']) {
    for (const rule of [
      `[data-style='${pack}'] .semantic-insight`,
      `[data-style='${pack}'] .semantic-callout`,
      `[data-style='${pack}'] .semantic-key-question`,
      `[data-style='${pack}'] .semantic-flow-steps`,
      `[data-style='${pack}'] .semantic-references`,
      `[data-style='${pack}'] .semantic-chart`,
      `[data-style='${pack}'] .math-block-expression`,
    ]) {
      assert.ok(css.includes(rule), `${pack} pack missing ${rule}`);
    }
    // Each pack restates structure only: its token block may not hardcode colors.
    const block = css.slice(css.indexOf(`[data-style='${pack}'] {`), css.indexOf(`[data-style='${pack}'] .semantic-learning-objectives`));
    assert.doesNotMatch(block, /#[0-9a-fA-F]{3,8}\b/, `${pack} pack must not hardcode colors`);
  }
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
