import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { register } from 'node:module';

register('./support/jsx-css-hook.mjs', import.meta.url);

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function render(element) {
  const { renderToStaticMarkup } = await import('react-dom/server');
  return renderToStaticMarkup(element);
}

test('Timeline renders label and time together instead of dropping time', async () => {
  const React = await import('react');
  const { Timeline } = await import('../src/components/index.js');
  const html = await render(
    React.createElement(Timeline, {
      events: [{ label: '发布', time: '2026-11', content: '校验通过' }]
    })
  );
  assert.match(html, /发布/);
  assert.match(html, /class="timeline-time">2026-11</);
  assert.match(html, /校验通过/);
});

test('Compare preserves falsy cell values', async () => {
  const React = await import('react');
  const { Compare } = await import('../src/components/index.js');
  const html = await render(
    React.createElement(Compare, {
      items: [{ label: '值', rows: ['零', '假', '空'], values: [0, false, ''] }]
    })
  );
  assert.match(html, /<td>0<\/td>/);
  assert.doesNotMatch(html, /<td>-<\/td>/);
});

test('Chart normalizes an unknown type to a bar chart and badge', async () => {
  const React = await import('react');
  const { Chart } = await import('../src/components/index.js');
  const html = await render(
    React.createElement(Chart, { type: 'scatter', data: [{ label: 'A', value: 2 }] })
  );
  assert.match(html, /CHART · BAR/);
  assert.match(html, /class="chart-bar"/);
  assert.doesNotMatch(html, /CHART · SCATTER/);
});

test('Grid column counts have real CSS rules', () => {
  const css = readFileSync(path.join(repoRoot, 'src', 'styles', 'core.css'), 'utf8');
  for (const columns of [2, 3, 4]) {
    assert.ok(
      css.includes(`.semantic-grid.grid-${columns} {`),
      `Grid columns=${columns} has no layout rule`
    );
  }
});

test('atlas defaults match the direct-render component headings', async () => {
  const React = await import('react');
  const Components = await import('../src/components/index.js');
  const { extractConceptData } = await import('../src/model/normalize-content.js');
  const page = React.createElement(
    Components.ExplainPage,
    { id: 'p', title: '标题', summary: '摘要' },
    React.createElement(
      Components.ConceptGraph,
      { root: 'root' },
      React.createElement(
        Components.ConceptNode,
        { id: 'root', title: '根', level: 'L0', summary: '根' },
        React.createElement(Components.Implementation, null, 'code'),
        React.createElement(Components.Boundary, null, '边界'),
        React.createElement(Components.Counterexample, null, '反例')
      )
    )
  );
  const node = extractConceptData(page).nodes[0];
  assert.equal(node.implementation.title, '实现代码');
  assert.equal(node.boundaries[0].title, '边界与约束');
  assert.equal(node.counterexamples[0].title, '反例与误区');
});

test('RelationPath, DecisionTree and StateMachine render their documented fields', async () => {
  const React = await import('react');
  const { RelationPath, DecisionTree, StateMachine } = await import('../src/components/index.js');
  const html = await render(
    React.createElement(
      React.Fragment,
      null,
      React.createElement(RelationPath, {
        steps: [
          { level: 'L0', node: '起点', relation: '导致' },
          { level: 'L1', node: '结果' }
        ]
      }),
      React.createElement(DecisionTree, {
        branches: [{ condition: '条件', outcome: '结果', note: '补充说明' }]
      }),
      React.createElement(StateMachine, {
        states: [{ id: 'a', label: '状态', description: '状态说明' }]
      })
    )
  );
  assert.match(html, /导致/);
  assert.match(html, /补充说明/);
  assert.match(html, /状态说明/);
});

test('Term children without a name do not invent a definition', async () => {
  const React = await import('react');
  const { Term } = await import('../src/components/index.js');
  const html = await render(React.createElement(Term, null, '术语'));
  assert.match(html, /data-term="术语"/);
  assert.doesNotMatch(html, /term-popover/);
});
