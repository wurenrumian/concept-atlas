import { register } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

// Register before importing the renderer: MDXComponents.jsx imports JSX and CSS.
register('./support/jsx-css-hook.mjs', import.meta.url);

async function render(element) {
  const { renderToStaticMarkup } = await import('react-dom/server');
  return renderToStaticMarkup(element);
}

test('Quote renders a pull-quote with an attributed citation', async () => {
  const React = await import('react');
  const { Quote } = await import('../src/components/index.js');
  const html = await render(
    React.createElement(
      Quote,
      { author: 'Dijkstra', source: 'EWD 249', href: 'https://example.com' },
      React.createElement('p', null, '简洁是可靠性的前提。')
    )
  );
  assert.match(html, /class="semantic-quote"/);
  assert.match(html, /class="quote-body"/);
  assert.match(html, /class="quote-attribution"/);
  assert.match(html, /Dijkstra/);
  assert.match(html, /href="https:\/\/example\.com"/);
});

test('Quote without attribution omits the footer', async () => {
  const React = await import('react');
  const { Quote } = await import('../src/components/index.js');
  const html = await render(React.createElement(Quote, null, '只有正文'));
  assert.doesNotMatch(html, /quote-attribution/);
});

test('Checklist maps statuses onto marks and defaults string items to unknown', async () => {
  const React = await import('react');
  const { Checklist } = await import('../src/components/index.js');
  const html = await render(
    React.createElement(Checklist, {
      title: '上线前',
      items: [
        { text: '依赖已锁定', status: 'pass' },
        { text: '压测通过', status: 'fail', note: 'P99 超标' },
        '尚未确认的项'
      ]
    })
  );
  assert.match(html, /data-status="pass"/);
  assert.match(html, /data-status="fail"/);
  assert.match(html, /data-status="unknown"/);
  assert.match(html, /checklist-note/);
  assert.match(html, /☑ 上线前/);
});

test('LastReviewed renders a dated stamp and vanishes when empty', async () => {
  const React = await import('react');
  const { LastReviewed } = await import('../src/components/index.js');
  const stamped = await render(
    React.createElement(LastReviewed, {
      date: '2026-09-29',
      by: '架构组',
      note: '随 ABI 变更重审'
    })
  );
  assert.match(stamped, /<time[^>]*datetime="2026-09-29"/i);
  assert.match(stamped, /reviewed-by/);
  const empty = await render(React.createElement(LastReviewed, {}));
  assert.equal(empty, '');
});

test('PropertyList renders a name/value ledger with notes', async () => {
  const React = await import('react');
  const { PropertyList } = await import('../src/components/index.js');
  const html = await render(
    React.createElement(PropertyList, {
      title: '运行时参数',
      items: [
        { name: 'heap', value: '4Gi', note: '可按需上调' },
        { name: 'gc', value: 'zgc' }
      ]
    })
  );
  assert.match(html, /class="property-list"/);
  assert.equal((html.match(/class="property-row"/g) || []).length, 2);
  assert.match(html, /property-note/);
  assert.match(html, /≡ 运行时参数/);
});

test('TreeView nests children and keeps depth markers', async () => {
  const React = await import('react');
  const { TreeView } = await import('../src/components/index.js');
  const html = await render(
    React.createElement(TreeView, {
      title: '模块',
      items: [
        { label: 'core', description: '内核', children: [{ label: 'sched' }, { label: 'mm' }] }
      ]
    })
  );
  assert.match(html, /class="semantic-tree"/);
  assert.match(html, /data-depth="0"/);
  assert.match(html, /data-depth="1"/);
  assert.match(html, /tree-children/);
  assert.match(html, /sched/);
});

test('CodeTabs renders one collapsible listing per variant', async () => {
  const React = await import('react');
  const { CodeTabs } = await import('../src/components/index.js');
  const html = await render(
    React.createElement(CodeTabs, {
      title: '同一逻辑的两种写法',
      items: [
        { label: 'JavaScript', language: 'javascript', code: 'const x = 1;' },
        { label: 'Rust', language: 'rust', code: 'let x = 1;' }
      ]
    })
  );
  assert.match(html, /class="semantic-code-tabs"/);
  assert.equal((html.match(/<details/g) || []).length, 2);
  assert.match(html, /code-tab-label/);
  assert.match(html, /lang-badge/);
  assert.match(html, /const x = 1;/);
});

test('AnnotatedCode marks the noted lines and lists the notes', async () => {
  const React = await import('react');
  const { AnnotatedCode } = await import('../src/components/index.js');
  const html = await render(
    React.createElement(AnnotatedCode, {
      language: 'bash',
      title: '诊断',
      code: 'ldd app\nreadelf -d app',
      notes: [{ line: 2, text: '确认动态依赖' }]
    })
  );
  assert.match(html, /class="semantic-annotated-code"/);
  assert.match(html, /code-block-numbered/);
  assert.match(html, /code-line is-annotated/);
  assert.match(html, /annotated-code-note/);
  assert.match(html, /L2/);
  assert.match(html, /确认动态依赖/);
});
