import { register } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

// Register before importing the renderer: MDXComponents.jsx imports JSX and CSS.
register('./support/jsx-css-hook.mjs', import.meta.url);

const figures = await import('../src/model/figures.js');
const { registerFigure, resetFigures, getFigureNumber } = figures;

async function render(element) {
  const React = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  return renderToStaticMarkup(element);
}

test('ids are numbered in registration order and registration is idempotent', () => {
  resetFigures();
  registerFigure('document', 'a');
  registerFigure('document', 'a');
  registerFigure('document', 'b');
  assert.equal(getFigureNumber('document', 'a'), 1);
  assert.equal(getFigureNumber('document', 'b'), 2);
  assert.equal(getFigureNumber('document', 'missing'), null);
});

test('each scope numbers independently', () => {
  resetFigures();
  registerFigure('node-a', 'x');
  registerFigure('node-a', 'y');
  registerFigure('node-b', 'x');
  assert.equal(getFigureNumber('node-a', 'y'), 2);
  assert.equal(getFigureNumber('node-b', 'x'), 1);
});

test('a registered Figure numbers itself and resolves its FigureRef', async () => {
  resetFigures();
  registerFigure('document', 'arch');
  const React = await import('react');
  const { Figure, FigureRef } = await import('../src/components/index.js');

  const figure = await render(React.createElement(Figure, { id: 'arch', src: './a.png', caption: '架构' }));
  assert.match(figure, /id="fig-arch"/);
  assert.match(figure, /figure-label">图 1</);

  const ref = await render(React.createElement(FigureRef, { id: 'arch' }));
  assert.match(ref, /semantic-figure-ref/);
  assert.match(ref, /href="#fig-arch"/);
  assert.match(ref, />图 1</);
});

test('an explicit label wins over the automatic number', async () => {
  resetFigures();
  registerFigure('document', 'arch');
  const React = await import('react');
  const { Figure } = await import('../src/components/index.js');
  const html = await render(React.createElement(Figure, { id: 'arch', src: './a.png', label: '图 A' }));
  assert.match(html, /figure-label">图 A</);
  assert.doesNotMatch(html, /图 1</);
});

test('an unresolved FigureRef falls back to a placeholder instead of crashing', async () => {
  resetFigures();
  const React = await import('react');
  const { FigureRef } = await import('../src/components/index.js');
  const html = await render(React.createElement(FigureRef, { id: 'ghost' }));
  assert.match(html, /图 \?/);
});
