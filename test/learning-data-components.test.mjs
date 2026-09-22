import { register } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

// Register before importing the renderer: MDXComponents.jsx imports JSX and CSS.
register('./support/jsx-css-hook.mjs', import.meta.url);

async function render(element) {
  const React = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  return renderToStaticMarkup(element);
}

test('worked example renders numbered steps with a reason per step', async () => {
  const React = await import('react');
  const { WorkedExample, Step } = await import('../src/components/index.js');
  const html = await render(
    React.createElement(WorkedExample, { title: '推演', problem: '为什么失败' },
      React.createElement(Step, { number: '1', title: '确认格式', reason: '格式不符会被拒绝' }, 'readelf -h app'),
      React.createElement(Step, { title: '检查依赖' }, 'ldd app'),
    ),
  );
  assert.match(html, /semantic-worked-example/);
  assert.match(html, /worked-problem/);
  assert.match(html, /worked-step-reason/);
  // An explicit number prints; a bare Step falls back to a CSS counter.
  assert.match(html, /worked-step-marker">1</);
  assert.match(html, /worked-step-marker is-auto/);
});

test('data table renders headers, rows and caption', async () => {
  const React = await import('react');
  const { DataTable } = await import('../src/components/index.js');
  const html = await render(
    React.createElement(DataTable, {
      title: '对比',
      caption: '先分类再定位',
      headers: ['异常', '信号'],
      rows: [['缺页', '可恢复'], ['段错误', 'SIGSEGV']],
    }),
  );
  assert.match(html, /semantic-data-table/);
  assert.match(html, /<th>异常<\/th>/);
  assert.match(html, /<td>缺页<\/td>/);
  assert.match(html, /data-table-caption/);
});

test('state machine renders states and transitions', async () => {
  const React = await import('react');
  const { StateMachine } = await import('../src/components/index.js');
  const html = await render(
    React.createElement(StateMachine, {
      title: '进程状态',
      initial: 'new',
      states: [{ id: 'new', label: '新建' }, { id: 'done', label: '终止', terminal: true }],
      transitions: [{ from: 'new', to: 'done', event: 'exit', guard: 'pid == 0' }],
    }),
  );
  assert.match(html, /semantic-state-machine/);
  assert.match(html, /state-node is-initial/);
  assert.match(html, /state-node is-terminal/);
  assert.match(html, /state-machine-transitions/);
  assert.match(html, /\[pid == 0\]/);
});

test('quiz hides the answer until revealed', async () => {
  const React = await import('react');
  const { Quiz } = await import('../src/components/index.js');
  const html = await render(
    React.createElement(Quiz, { question: '谁解析符号？', answer: '链接阶段' }, '链接器负责匹配引用与定义。'),
  );
  assert.match(html, /semantic-quiz/);
  assert.match(html, /quiz-toggle/);
  assert.match(html, /aria-expanded="false"/);
  // Server render shows the collapsed state, so the answer must not leak.
  assert.doesNotMatch(html, /链接阶段/);
});

test('source and confidence render their provenance signals', async () => {
  const React = await import('react');
  const { Source, Confidence } = await import('../src/components/index.js');
  const html = await render(
    React.createElement('div', null,
      React.createElement(Source, { kind: 'spec', label: 'ABI', href: 'https://example.com' }),
      React.createElement(Confidence, { level: 'high', basis: '规范 + 实测' }, '该约束成立。'),
    ),
  );
  assert.match(html, /semantic-source source-spec/);
  assert.match(html, /source-kind">规范</);
  assert.match(html, /semantic-confidence confidence-high/);
  assert.match(html, /confidence-basis/);
});

test('key takeaways, metric and code diff render', async () => {
  const React = await import('react');
  const { KeyTakeaways, Metric, CodeDiff } = await import('../src/components/index.js');
  const html = await render(
    React.createElement('div', null,
      React.createElement(KeyTakeaways, { items: ['要点一', '要点二'] }),
      React.createElement(Metric, { label: 'P99', value: '128', unit: 'ms', delta: '-18%', trend: 'down' }),
      React.createElement(CodeDiff, { language: 'javascript', before: 'const a = b.c;', after: 'const a = b?.c;' }),
    ),
  );
  assert.match(html, /semantic-key-takeaways/);
  assert.match(html, /semantic-metric/);
  assert.match(html, /metric-value">128<span class="metric-unit">ms<\/span>/);
  assert.match(html, /metric-delta trend-down/);
  assert.match(html, /semantic-code-diff/);
  assert.match(html, /code-diff-pane pane-before/);
});

test('term, decision tree and feedback loop render', async () => {
  const React = await import('react');
  const { Term, DecisionTree, FeedbackLoop } = await import('../src/components/index.js');
  const html = await render(
    React.createElement('div', null,
      React.createElement(Term, { name: '缺页异常' }, '访问未驻留页时的可恢复异常'),
      React.createElement(DecisionTree, {
        question: '先看哪一层',
        branches: [{ condition: '有构建错误', outcome: '先修构建', tone: 'danger' }],
      }),
      React.createElement(FeedbackLoop, {
        type: 'balancing',
        nodes: [{ label: '负载上升' }, { label: '扩容' }],
      }),
    ),
  );
  assert.match(html, /semantic-term/);
  assert.match(html, /term-popover/);
  assert.match(html, /semantic-decision-tree/);
  assert.match(html, /decision-branch tone-danger/);
  assert.match(html, /semantic-feedback-loop loop-balancing/);
  assert.match(html, /feedback-node/);
});

test('every new component is restated in each style pack', async () => {
  const { readFileSync } = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const packs = Object.fromEntries(
    ['manuscript', 'shadcn', 'elastic'].map(name => [
      name,
      readFileSync(path.join(root, 'src', 'styles', 'packs', `${name}.css`), 'utf8'),
    ]),
  );
  // A reader switching packs must never see one of the new components fall back
  // to the classic chassis, so each pack names the container and its inner units.
  const selectors = [
    '.semantic-worked-example', '.worked-step-marker',
    '.semantic-data-table',
    '.semantic-state-machine', '.state-node',
    '.semantic-quiz', '.quiz-toggle',
    '.semantic-source', '.semantic-confidence', '.confidence-badge',
    '.semantic-key-takeaways', '.semantic-metric', '.metric-value',
    '.semantic-code-diff', '.code-diff-label',
    '.semantic-term', '.term-popover',
    '.semantic-decision-tree', '.decision-node',
    '.semantic-feedback-loop', '.feedback-node',
  ];
  for (const [pack, css] of Object.entries(packs)) {
    for (const selector of selectors) {
      assert.ok(css.includes(`[data-style='${pack}'] ${selector}`), `${pack} pack missing ${selector}`);
    }
  }
});

test('the validator accepts every new component and its array props', async () => {
  const { validateMdxSource } = await import('../src/model/validate-content.js');
  const source = `<ExplainPage id="p" title="T" summary="S">
  <ConceptGraph root="root">
    <ConceptNode id="root" title="根" level="L0" summary="根">
      <WorkedExample title="推演"><Step number="1" reason="因为">动作</Step></WorkedExample>
      <DataTable headers={['a']} rows={[['b']]} />
      <StateMachine states={[{id:'a'}]} transitions={[{from:'a',to:'a'}]} />
      <Quiz question="q" answer="a" />
      <KeyTakeaways items={['x']} />
      <Metric label="l" value="1" />
      <CodeDiff before="a" after="b" />
      <DecisionTree branches={[{condition:'c',outcome:'o'}]} />
      <FeedbackLoop nodes={[{label:'n'}]} />
      <Source kind="spec" label="s" />
      <Confidence level="high">c</Confidence>
      <Term name="t">d</Term>
    </ConceptNode>
  </ConceptGraph>
</ExplainPage>`;
  const result = validateMdxSource(source);
  const codes = result.diagnostics.map(item => item.code);
  assert.equal(result.carrier, 'atlas');
  assert.ok(!codes.includes('UNKNOWN_COMPONENT'), `unexpected unknown component: ${codes.join(', ')}`);
  assert.ok(!codes.includes('PROP_EXPECTS_ARRAY'), `unexpected array-prop warning: ${codes.join(', ')}`);
});

const atlas = body => `<ExplainPage id="p" title="T" summary="S">\n  <ConceptGraph root="root">\n${body}\n  </ConceptGraph>\n</ExplainPage>`;
const warningsOf = result => result.diagnostics.filter(item => item.severity === 'warning').map(item => item.code);
const codesOf = result => result.diagnostics.map(item => item.code);

test('new array props warn on a string and pass on an array', async () => {
  const { validateMdxSource } = await import('../src/model/validate-content.js');
  // Every entry added to ARRAY_PROPS needs a regression test: a typo in the
  // registry would otherwise disable the warning silently.
  const props = [
    ['DataTable', 'headers'],
    ['DataTable', 'rows'],
    ['StateMachine', 'states'],
    ['StateMachine', 'transitions'],
    ['KeyTakeaways', 'items'],
    ['DecisionTree', 'branches'],
    ['FeedbackLoop', 'nodes'],
  ];
  for (const [name, prop] of props) {
    const bad = validateMdxSource(atlas(`<${name} ${prop}="nope" />`));
    assert.ok(warningsOf(bad).includes('PROP_EXPECTS_ARRAY'), `${name}.${prop} should warn on a string`);
    const good = validateMdxSource(atlas(`<${name} ${prop}={[]} />`));
    assert.ok(!warningsOf(good).includes('PROP_EXPECTS_ARRAY'), `${name}.${prop} should accept an array`);
  }
});

test('a node whose only substance is a new component is not flagged empty', async () => {
  const { validateMdxSource } = await import('../src/model/validate-content.js');
  const bodies = [
    '<WorkedExample title="t"><Step number="1">a</Step></WorkedExample>',
    '<DataTable headers={["a"]} rows={[["b"]]} />',
    '<StateMachine states={[{id:"a"}]} transitions={[{from:"a",to:"a"}]} />',
    '<Quiz question="q" answer="a" />',
    '<KeyTakeaways items={["x"]} />',
    '<Metric label="l" value="1" />',
    '<CodeDiff before="a" after="b" />',
    '<DecisionTree branches={[{condition:"c",outcome:"o"}]} />',
    '<FeedbackLoop nodes={[{label:"n"}]} />',
  ];
  for (const body of bodies) {
    const source = atlas(`<ConceptNode id="root" title="根" level="L0" summary="根">${body}</ConceptNode>`);
    assert.ok(!codesOf(validateMdxSource(source)).includes('NODE_NO_CORE_CONTENT'), `${body} should count as core content`);
  }
});

test('new components inside a node are kept as renderable custom sections', async () => {
  const React = await import('react');
  const C = await import('../src/components/index.js');
  const { extractConceptData } = await import('../src/model/normalize-content.js');
  const page = React.createElement(C.ExplainPage, { id: 'p', title: 'T', summary: 'S' },
    React.createElement(C.ConceptGraph, { root: 'root' },
      React.createElement(C.ConceptNode, { id: 'root', title: '根', level: 'L0', summary: '根' },
        React.createElement(C.Definition, null, '定义'),
        React.createElement(C.DataTable, { headers: ['a'], rows: [['b']] }),
        React.createElement(C.Quiz, { question: 'q', answer: 'a' }),
      ),
    ),
  );
  const raw = extractConceptData(page);
  const names = raw.nodes[0].customSections.map(el => el.type.displayName || el.type.name);
  assert.ok(names.includes('DataTable'), `custom sections missing DataTable: ${names.join(', ')}`);
  assert.ok(names.includes('Quiz'), `custom sections missing Quiz: ${names.join(', ')}`);
});

test('text inside new components is reachable by search', async () => {
  const React = await import('react');
  const C = await import('../src/components/index.js');
  const { nodeSearchText, searchNodes } = await import('../src/app/search.js');
  const node = {
    id: 'n',
    title: '节点',
    customSections: [
      React.createElement(C.DataTable, { headers: ['异常'], rows: [['缺页异常']] }),
      React.createElement(C.Quiz, { question: '哪个阶段解析符号？', answer: '链接阶段' }),
      React.createElement(C.Metric, { label: 'P99 延迟', value: '128' }),
      React.createElement(C.StateMachine, { title: '进程状态', states: [{ id: 'ready', label: '就绪' }] }),
    ],
  };
  const text = nodeSearchText(node);
  assert.match(text, /缺页异常/);
  assert.match(text, /链接阶段/);
  assert.match(text, /p99 延迟/);
  assert.match(text, /就绪/);
  assert.deepEqual(searchNodes([node], '链接阶段').map(item => item.id), ['n']);
});

test('new components fall back safely on missing data', async () => {
  const React = await import('react');
  const { Source, Term, CodeDiff, StateMachine, FeedbackLoop } = await import('../src/components/index.js');
  const html = await render(
    React.createElement('div', null,
      React.createElement(Source, {}),
      React.createElement(Term, {}),
      React.createElement(CodeDiff, {}),
      React.createElement(StateMachine, { states: [] }, React.createElement('em', null, 'state-fallback')),
      React.createElement(FeedbackLoop, { nodes: [] }, React.createElement('em', null, 'loop-fallback')),
    ),
  );
  // No data means no empty shell is emitted.
  assert.doesNotMatch(html, /semantic-source/);
  assert.doesNotMatch(html, /semantic-term/);
  assert.doesNotMatch(html, /semantic-code-diff/);
  // Fallback children render instead of an empty model.
  assert.match(html, /state-fallback/);
  assert.match(html, /loop-fallback/);
});

test('metric infers a trend and feedback loop reports its polarity', async () => {
  const React = await import('react');
  const { Metric, FeedbackLoop } = await import('../src/components/index.js');
  const down = await render(React.createElement(Metric, { label: 'x', value: '1', delta: '-5%' }));
  assert.match(down, /metric-delta trend-down/);
  const up = await render(React.createElement(Metric, { label: 'x', value: '1', delta: '+5%' }));
  assert.match(up, /metric-delta trend-up/);
  const flat = await render(React.createElement(Metric, { label: 'x', value: '1' }));
  assert.doesNotMatch(flat, /metric-delta/);

  const balancing = await render(React.createElement(FeedbackLoop, { type: 'balancing', nodes: [{ label: 'a' }, { label: 'b' }] }));
  assert.match(balancing, /loop-balancing/);
  assert.match(balancing, /− ↺/);
  const reinforcing = await render(React.createElement(FeedbackLoop, { type: 'reinforcing', nodes: [{ label: 'a' }] }));
  assert.match(reinforcing, /loop-reinforcing/);
  assert.match(reinforcing, /\+ ↺/);
});
