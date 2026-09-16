import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMdxSource, countBySeverity, KNOWN_COMPONENT_SET } from '../src/model/validate-content.js';

const codes = result => result.diagnostics.map(item => item.code);
const errorsOf = result => result.diagnostics.filter(item => item.severity === 'error').map(item => item.code);
const warningsOf = result => result.diagnostics.filter(item => item.severity === 'warning').map(item => item.code);

const atlas = body => `<ExplainPage id="p" title="T" summary="S">\n  <ConceptGraph root="root">\n${body}\n  </ConceptGraph>\n</ExplainPage>`;

const rootNode = `    <ConceptNode id="root" title="根" level="L0" summary="根">
      <Definition>定义。</Definition>
    </ConceptNode>`;

test('a valid atlas document has no diagnostics', () => {
  const result = validateMdxSource(atlas(rootNode));
  assert.equal(result.carrier, 'atlas');
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.stats.nodes, 1);
});

test('a valid scroll document has no diagnostics', () => {
  const source = `<ScrollDocument>\n  <ScrollHeader title="T">intro</ScrollHeader>\n  <ScrollSection title="A"><ScrollProse>p</ScrollProse></ScrollSection>\n  <ScrollSection title="B"><ScrollProse>p</ScrollProse></ScrollSection>\n</ScrollDocument>`;
  const result = validateMdxSource(source);
  assert.equal(result.carrier, 'scroll');
  assert.deepEqual(result.diagnostics, []);
});

test('unknown component names are errors, known names are not', () => {
  const bad = validateMdxSource(atlas(`${rootNode}\n    <ConceptNoed id="x" />`));
  assert.ok(errorsOf(bad).includes('UNKNOWN_COMPONENT'));

  const good = validateMdxSource(atlas(`${rootNode}\n    <Insight>ok</Insight>`));
  assert.deepEqual(errorsOf(good), []);
  assert.ok(KNOWN_COMPONENT_SET.has('Insight'));
});

test('concept graph integrity: duplicate id, missing parent, unresolved refs and relations', () => {
  const source = atlas(`    <ConceptNode id="root" title="根" level="L0" summary="根">
      <Definition>定义。</Definition>
      <Children><ConceptRef id="ghost" /></Children>
    </ConceptNode>
    <ConceptNode id="root" title="dup" level="L2" parent="nope">
      <Overview>dup</Overview>
    </ConceptNode>
    <Relation from="root" to="ghost" type="uses" label="使用" />`);
  const result = validateMdxSource(source);
  const errors = errorsOf(result);
  assert.ok(errors.includes('DUPLICATE_NODE_ID'));
  assert.ok(errors.includes('MISSING_PARENT'));
  assert.ok(errors.includes('REF_UNRESOLVED'));
  assert.ok(errors.includes('RELATION_TO_UNRESOLVED'));
});

test('graph root must resolve', () => {
  const result = validateMdxSource(atlas(rootNode).replace('root="root"', 'root="missing"'));
  assert.ok(errorsOf(result).includes('GRAPH_ROOT_UNRESOLVED'));
});

test('carrier errors: missing, conflict, and mode mismatch', () => {
  assert.ok(errorsOf(validateMdxSource('<ConceptNode id="a" title="a" level="L0" summary="s" />')).includes('CARRIER_MISSING'));

  const conflict = validateMdxSource(`<ExplainPage id="p" title="T" summary="S"><ConceptGraph root="r"><ConceptNode id="r" title="r" level="L0" summary="s"><Definition>d</Definition></ConceptNode></ConceptGraph><ScrollDocument><ScrollHeader title="T">x</ScrollHeader></ScrollDocument></ExplainPage>`);
  assert.ok(errorsOf(conflict).includes('CARRIER_CONFLICT'));

  const mismatch = validateMdxSource(atlas(rootNode), { mode: 'scroll' });
  assert.ok(errorsOf(mismatch).includes('CARRIER_MODE_MISMATCH'));
});

test('array props accept arrays and reject strings or non-array expressions', () => {
  const stringSteps = validateMdxSource(atlas(`${rootNode}\n    <Flow steps="nope" />`));
  assert.ok(warningsOf(stringSteps).includes('PROP_EXPECTS_ARRAY'));

  const objectSteps = validateMdxSource(atlas(`${rootNode}\n    <Flow steps={{a: 1}} />`));
  assert.ok(warningsOf(objectSteps).includes('PROP_EXPECTS_ARRAY'));

  const arraySteps = validateMdxSource(atlas(`${rootNode}\n    <Flow steps={[{title: 'a'}]} />`));
  assert.ok(!warningsOf(arraySteps).includes('PROP_EXPECTS_ARRAY'));
});

test('math children containing braces are flagged; formula prop is fine', () => {
  const bad = validateMdxSource(atlas(`${rootNode}\n    <Math>r_{\\text{ann}}</Math>`));
  assert.ok(warningsOf(bad).includes('MATH_CHILDREN_BRACES'));

  const good = validateMdxSource(atlas(`${rootNode}\n    <Math formula="r_{\\text{ann}} = 1" />`));
  assert.ok(!warningsOf(good).includes('MATH_CHILDREN_BRACES'));
});

test('component samples in inline and fenced code are ignored', () => {
  const source = atlas(`${rootNode}
      <Example title="示例">\`<ConceptNode id="idea" level="L2" parent="root">x</ConceptNode>\`</Example>
      <Details summary="more">
\`\`\`mdx
<ConceptNode id="fenced" title="x" level="L2" parent="missing" />
\`\`\`
      </Details>`);
  const result = validateMdxSource(source);
  assert.deepEqual(errorsOf(result), []);
  assert.equal(result.stats.nodes, 1);
});

test('missing relative figure assets warn instead of failing', () => {
  const source = atlas(`${rootNode}\n    <Figure src="./missing.png" alt="x" />`);
  const result = validateMdxSource(source, {
    filePath: 'C:/tmp/doc.mdx',
    assetExists: () => false,
  });
  assert.ok(warningsOf(result).includes('ASSET_MISSING'));
  assert.deepEqual(errorsOf(result), []);
});

test('strict mode promotes structural warnings to errors and counts severities', () => {
  const source = atlas(`    <ConceptNode id="root" title="根" level="L1" summary="根">
      <Definition>定义。</Definition>
    </ConceptNode>`);
  const relaxed = validateMdxSource(source);
  assert.ok(warningsOf(relaxed).includes('NO_ROOT_LEVEL'));
  const strict = validateMdxSource(source, { strict: true });
  assert.ok(errorsOf(strict).includes('NO_ROOT_LEVEL'));
  assert.equal(countBySeverity(relaxed.diagnostics).error, 0);
});

test('relation type and label are checked', () => {
  const result = validateMdxSource(atlas(`${rootNode}
    <ConceptNode id="other" title="other" level="L1" parent="root"><Overview>o</Overview></ConceptNode>
    <Relation from="root" to="other" type="supports" />`));
  const warnings = warningsOf(result);
  assert.ok(warnings.includes('UNKNOWN_RELATION_TYPE'));
  assert.ok(warnings.includes('RELATION_MISSING_LABEL'));
});
