import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMdxSource, countBySeverity, detectFeatures, extractPageTitle, KNOWN_COMPONENT_SET } from '../src/model/validate-content.js';

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

test('data shapes written as prose braces are flagged as MDX expressions', () => {
  const result = validateMdxSource(atlas(`${rootNode}\n    <Definition>data（{label, value} 数组）</Definition>`));
  assert.ok(warningsOf(result).includes('PROSE_EXPRESSION'));

  const safe = validateMdxSource(atlas(`${rootNode}\n    <Definition>data（\`{label, value}\` 数组）</Definition>`));
  assert.ok(!warningsOf(safe).includes('PROSE_EXPRESSION'));

  const literals = validateMdxSource(atlas(`${rootNode}\n    <Flow steps={[{title: 'a'}]} />`));
  assert.ok(!warningsOf(literals).includes('PROSE_EXPRESSION'));
});

test('leading frontmatter is flagged because MDX renders it as text', () => {
  const withFm = validateMdxSource(`---\ntitle: doc\n---\n\n${atlas(rootNode)}`);
  assert.ok(warningsOf(withFm).includes('FRONTMATTER_UNSUPPORTED'));

  const without = validateMdxSource(atlas(rootNode));
  assert.ok(!warningsOf(without).includes('FRONTMATTER_UNSUPPORTED'));
});

test('detectFeatures reports which optional renderers a document needs', () => {
  const proseOnly = detectFeatures(`<ScrollDocument><ScrollProse>一段话</ScrollProse></ScrollDocument>`);
  assert.deepEqual(proseOnly, { math: false, mermaid: false });

  const mathOnly = detectFeatures(`${atlas(rootNode)}\n  <MathBlock formula="E = mc^2" />`);
  assert.deepEqual(mathOnly, { math: true, mermaid: false });

  const both = detectFeatures(`${atlas(rootNode)}\n  <Mermaid chart="flowchart LR; A-->B" />`);
  assert.deepEqual(both, { math: false, mermaid: true });

  const inlineMath = detectFeatures(`${atlas(rootNode)}\n  <Overview>符号 <Math>x</Math> 表示变量。</Overview>`);
  assert.equal(inlineMath.math, true);
});

test('detectFeatures ignores samples inside code fences and inline code', () => {
  const fenced = detectFeatures(`${atlas(rootNode)}\n\n\`\`\`mdx\n<Mermaid chart="flowchart LR; A-->B" />\n<MathBlock formula="E = mc^2" />\n\`\`\``);
  assert.deepEqual(fenced, { math: false, mermaid: false });

  const inline = detectFeatures(`${atlas(rootNode)}\n  <Definition>写作 \`<Mermaid>\` 表示图表节点。</Definition>`);
  assert.equal(inline.mermaid, false);
});

test('extractPageTitle reads the tab title from the carrier shell', () => {
  assert.equal(extractPageTitle(atlas(rootNode)), 'T');
  assert.equal(extractPageTitle('<ScrollDocument>\n  <ScrollHeader title="用概念模型组织一次技术判断">intro</ScrollHeader>\n</ScrollDocument>'), '用概念模型组织一次技术判断');

  // Expression titles and missing shells fall back to null so the build keeps
  // the carrier's default <title>.
  assert.equal(extractPageTitle('<ExplainPage id="p" title={dynamic} summary="S"></ExplainPage>'), null);
  assert.equal(extractPageTitle('<ScrollDocument>\n  <ScrollProse>没有标题</ScrollProse>\n</ScrollDocument>'), null);
});

test('extractPageTitle decodes JSX entities without double-decoding', () => {
  assert.equal(extractPageTitle('<ExplainPage id="p" title="A &amp; B" summary="S"></ExplainPage>'), 'A & B');
  assert.equal(extractPageTitle('<ExplainPage id="p" title="&amp;lt;" summary="S"></ExplainPage>'), '&lt;');
});
