import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { register } from 'node:module';
import { parse } from '@babel/parser';
import { SKINS, COMPONENT_STYLES } from '../src/model/skins.js';
import { ARRAY_PROPS } from '../src/model/validate-content.js';

// The real barrel is the component-name source of truth. Register before
// importing it because MDXComponents.jsx contains JSX and CSS imports.
register('./support/jsx-css-hook.mjs', import.meta.url);

// The shipped skill is the only documentation an agent gets, so it has to stay
// in step with the renderer. These checks are structural: they catch missing
// props, diagnostics, skins and style packs, not merely a missing name.
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (...parts) => readFileSync(path.join(repoRoot, ...parts), 'utf8');

const componentsSource = read('src', 'components', 'MDXComponents.jsx');
const catalogue = read('skills', 'concept-atlas-dense-explain', 'references', 'components.md');
const diagnostics = read('skills', 'concept-atlas-dense-explain', 'references', 'diagnostics.md');
const skill = read('skills', 'concept-atlas-dense-explain', 'SKILL.md');
const cli = read('skills', 'concept-atlas-dense-explain', 'references', 'cli.md');
const skillDocs = `${skill}\n${cli}`;

function objectPatternProps(pattern) {
  if (!pattern || pattern.type !== 'ObjectPattern') return [];
  return pattern.properties
    .filter(property => property.type === 'ObjectProperty')
    .map(property => property.key.name || property.key.value)
    .filter(Boolean);
}

function componentSignatures() {
  const ast = parse(componentsSource, { sourceType: 'module', plugins: ['jsx'] });
  const signatures = new Map();
  const arrayDefaults = new Map();

  const addFunction = declaration => {
    if (declaration?.type !== 'FunctionDeclaration') return;
    const name = declaration.id.name;
    const pattern = declaration.params[0];
    signatures.set(name, objectPatternProps(pattern));
    const arrays = (pattern?.properties || [])
      .filter(
        property =>
          property.type === 'ObjectProperty' &&
          property.value.type === 'AssignmentPattern' &&
          property.value.right.type === 'ArrayExpression'
      )
      .map(property => property.key.name || property.key.value);
    arrayDefaults.set(name, arrays);
  };

  for (const statement of ast.program.body) {
    if (statement.type === 'FunctionDeclaration') addFunction(statement);
    if (statement.type === 'ExportNamedDeclaration') addFunction(statement.declaration);
  }

  for (const statement of ast.program.body) {
    if (statement.type !== 'ExportNamedDeclaration') continue;
    const declaration = statement.declaration;

    if (declaration?.type === 'VariableDeclaration') {
      for (const declarator of declaration.declarations) {
        if (declarator.id.type !== 'Identifier' || declarator.init?.type !== 'Identifier') continue;
        const source = declarator.init.name;
        if (!signatures.has(source)) continue;
        signatures.set(declarator.id.name, [...signatures.get(source)]);
        arrayDefaults.set(declarator.id.name, [...(arrayDefaults.get(source) || [])]);
      }
    }

    for (const specifier of statement.specifiers || []) {
      if (specifier.type !== 'ExportSpecifier' || !signatures.has(specifier.local.name)) continue;
      signatures.set(specifier.exported.name, [...signatures.get(specifier.local.name)]);
      arrayDefaults.set(specifier.exported.name, [
        ...(arrayDefaults.get(specifier.local.name) || [])
      ]);
    }
  }

  return { signatures, arrayDefaults };
}

// These fields are consumed by normalize-content.js / NodeExplorer rather than
// by the ConceptNode render function, but they are valid public MDX props.
const MODEL_ONLY_PROPS = { ConceptNode: ['summary', 'kind', 'input', 'output'] };

function authorApi() {
  const { signatures } = componentSignatures();
  for (const [name, props] of Object.entries(MODEL_ONLY_PROPS)) {
    signatures.set(name, [...new Set([...(signatures.get(name) || []), ...props])]);
  }
  return signatures;
}

function documentedApi() {
  const section = catalogue.split('## Props at a glance')[1]?.split('## Shapes and traps')[0];
  assert.ok(section, 'components.md has no Props at a glance section');
  const api = new Map();

  for (const line of section.split('\n')) {
    if (!line.startsWith('|')) continue;
    const cells = line.split(/(?<!\\)\|/).map(cell => cell.trim());
    if (cells.length < 3 || cells[1] === 'Component' || /^-+$/.test(cells[1])) continue;

    const names = [...cells[1].matchAll(/`([A-Z]\w+)`/g)].map(match => match[1]);
    if (!names.length) continue;

    const props = new Set();
    for (const segment of cells[2].split(/,\s*/)) {
      const match = segment.match(/^`([A-Za-z]\w*)`/);
      if (match) props.add(match[1]);
    }

    for (const name of names) {
      assert.ok(!api.has(name), `duplicate Props table row for ${name}`);
      api.set(name, props);
    }
  }

  return api;
}

function diagnosticCodes() {
  const codes = new Set();
  for (const match of read('src', 'model', 'validate-content.js').matchAll(
    /'([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+)'/g
  )) {
    codes.add(match[1]);
  }
  return [...codes].sort();
}

function documentedDiagnostics(heading, nextHeading) {
  const afterHeading = diagnostics.split(heading)[1];
  const section = nextHeading ? afterHeading?.split(nextHeading)[0] : afterHeading;
  assert.ok(section, `diagnostics.md is missing ${heading}`);
  return new Set([...section.matchAll(/`([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+)`/g)].map(m => m[1]));
}

test('every exported component has one complete, bidirectional author-API row', async () => {
  const Components = await import('../src/components/index.js');
  const actual = authorApi();
  const documented = documentedApi();
  const exported = Object.keys(Components)
    .filter(name => name !== 'default')
    .sort();

  assert.deepEqual(
    exported.filter(name => !actual.has(name)),
    [],
    'component signatures missing from MDXComponents.jsx'
  );
  assert.deepEqual(
    exported.filter(name => !documented.has(name)),
    [],
    `components missing from the Props table: ${exported.filter(name => !documented.has(name)).join(', ')}`
  );
  assert.deepEqual(
    [...documented.keys()].filter(name => !exported.includes(name)).sort(),
    [],
    'Props table documents components that are not exported'
  );

  for (const name of exported) {
    const actualProps = [...new Set(actual.get(name))].sort();
    const documentedProps = [...documented.get(name)].sort();
    assert.deepEqual(
      documentedProps,
      actualProps,
      `${name} prop drift: missing ${actualProps.filter(p => !documentedProps.includes(p)).join(', ') || 'none'}; undocumented ${documentedProps.filter(p => !actualProps.includes(p)).join(', ') || 'none'}`
    );
  }
});

test('every array default is covered by the validator array-prop registry', () => {
  const { arrayDefaults } = componentSignatures();
  for (const [component, props] of arrayDefaults) {
    for (const prop of props) {
      assert.ok(
        ARRAY_PROPS[component]?.includes(prop),
        `${component}.${prop} defaults to [] but is missing from ARRAY_PROPS`
      );
    }
  }
  for (const [component, props] of Object.entries(ARRAY_PROPS)) {
    for (const prop of props) {
      assert.ok(
        arrayDefaults.get(component)?.includes(prop),
        `ARRAY_PROPS documents ${component}.${prop}, but the component has no [] default`
      );
    }
  }
});

test('diagnostics are completely classified as errors or warnings', () => {
  const errors = documentedDiagnostics(
    '## Errors — fix before building',
    '## Warnings — fix when cheap'
  );
  const warnings = documentedDiagnostics(
    '## Warnings — fix when cheap',
    '## Promoted by `--strict`'
  );
  const promoted = documentedDiagnostics('## Promoted by `--strict`', null);
  const actual = diagnosticCodes();

  assert.deepEqual(
    [...errors].filter(code => warnings.has(code)),
    [],
    'a code is both error and warning'
  );
  assert.deepEqual(
    actual.sort(),
    [...new Set([...errors, ...warnings])].sort(),
    'diagnostic classification drift'
  );
  assert.deepEqual(
    [...promoted].filter(code => !warnings.has(code)),
    [],
    'strict-only code is not a warning'
  );
});

test('every skin and style pack is named in the skill references', () => {
  const ids = [...SKINS.map(skin => skin.id), ...COMPONENT_STYLES.map(style => style.id)];
  const missing = ids.filter(id => !new RegExp(`\\b${id}\\b`).test(skillDocs));
  assert.deepEqual(missing, [], `skins/styles missing from the skill: ${missing.join(', ')}`);
});

test('the skill keeps its identity, scope, and progressive-disclosure pointers', () => {
  const front = skill.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(front, 'SKILL.md has no frontmatter');
  assert.match(front[1], /^name: concept-atlas-dense-explain$/m);
  const description = front[1].match(/^description: (.+)$/m)?.[1] ?? '';
  assert.ok(description.length > 80, 'description is too short to trigger reliably');
  assert.ok(description.length <= 700, 'description is too long to scan as trigger metadata');
  assert.match(description, /standalone/i, 'description should name the standalone output');
  assert.match(description, /source document/i, 'description should cover document conversion');
  assert.match(description, /Not for/i, 'description should exclude adjacent deliverables');
  assert.ok(skill.split('\n').length < 120, 'SKILL.md should stay a compact workflow entry point');
  assert.match(skill, /references\/authoring\.md/, 'SKILL.md should point to authoring guidance');
  assert.match(skill, /references\/cli\.md/, 'SKILL.md should route CLI details to its reference');
  assert.match(catalogue, /reserved data attributes with no current visual or model effect/);
  assert.match(diagnostics, /error\|warn line:column CODE message/);
  assert.match(
    skill,
    /--mode atlas\|scroll --json/,
    'JSON validation should keep the selected mode'
  );
  assert.match(
    skill,
    /diagrams need no chart CDN/i,
    'offline guidance should distinguish diagrams from fonts/assets'
  );
  assert.doesNotMatch(
    skill,
    /fully offline single file with no CDN call/i,
    'offline claim is too broad'
  );
});
