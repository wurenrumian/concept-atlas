import React from 'react';
import mermaid from 'mermaid';

let mermaidReady = false;

function ensureMermaid() {
  if (mermaidReady) return;
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    theme: 'base',
    look: 'handDrawn',
    themeVariables: {
      primaryColor: '#172554',
      primaryTextColor: '#e0f2fe',
      primaryBorderColor: '#38bdf8',
      lineColor: '#64748b',
      secondaryColor: '#172554',
      tertiaryColor: '#0f172a',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    },
  });
  mermaidReady = true;
}

// Data Layer Components
export function ExplainPage({ id, title, summary, children }) {
  return <div data-component="ExplainPage" data-id={id} data-title={title} data-summary={summary}>{children}</div>;
}
ExplainPage.displayName = 'ExplainPage';

export function ConceptGraph({ root, children }) {
  return <div data-component="ConceptGraph" data-root={root}>{children}</div>;
}
ConceptGraph.displayName = 'ConceptGraph';

export function ConceptNode({ id, title, level = 'L2', parent = null, children, input, output, summary }) {
  return <div data-component="ConceptNode" data-id={id} data-title={title} data-level={level} data-parent={parent}>{children}</div>;
}
ConceptNode.displayName = 'ConceptNode';

export function ConceptRef({ id }) {
  return <span data-component="ConceptRef" data-id={id} />;
}
ConceptRef.displayName = 'ConceptRef';

export function Children({ children }) {
  return <div data-component="Children">{children}</div>;
}
Children.displayName = 'Children';

export function Relation({ from, to, type = 'depends-on', label, description, children }) {
  return <div data-component="Relation" data-from={from} data-to={to} data-type={type} data-label={label}>{children || description}</div>;
}
Relation.displayName = 'Relation';

// Content Layer Components
export function Overview({ children }) {
  return <div className="semantic-overview">{children}</div>;
}
Overview.displayName = 'Overview';

export function Definition({ children }) {
  return <div className="semantic-definition">{children}</div>;
}
Definition.displayName = 'Definition';

export function Mechanism({ children }) {
  return <div className="semantic-mechanism">{children}</div>;
}
Mechanism.displayName = 'Mechanism';

export function Implementation({ language = 'text', title = '实现代码', children }) {
  return (
    <div className="semantic-implementation" data-language={language}>
      {title && <div className="impl-header">{title} <span className="lang-badge">{language}</span></div>}
      <pre><code>{typeof children === 'string' ? children.trim() : children}</code></pre>
    </div>
  );
}
Implementation.displayName = 'Implementation';

export function Boundary({ title = '边界与约束', children }) {
  return (
    <div className="semantic-boundary">
      <div className="semantic-tag">⚠ {title}</div>
      <div className="boundary-body">{children}</div>
    </div>
  );
}
Boundary.displayName = 'Boundary';

export function Example({ title = '典型示例', children }) {
  return (
    <div className="semantic-example">
      <div className="semantic-tag">✦ {title}</div>
      <div className="example-body">{children}</div>
    </div>
  );
}
Example.displayName = 'Example';

export function Counterexample({ title = '反例与误区', children }) {
  return (
    <div className="semantic-counterexample">
      <div className="semantic-tag">✕ {title}</div>
      <div className="counter-body">{children}</div>
    </div>
  );
}
Counterexample.displayName = 'Counterexample';

export function Prerequisite({ children }) {
  return <div className="semantic-prerequisite">{children}</div>;
}
Prerequisite.displayName = 'Prerequisite';

export function Input({ children }) {
  return <div className="semantic-input">{children}</div>;
}
Input.displayName = 'Input';

export function Output({ children }) {
  return <div className="semantic-output">{children}</div>;
}
Output.displayName = 'Output';

export function Glossary({ term, children }) {
  return (
    <div className="semantic-glossary-item">
      <span className="term">{term}</span>: <span className="def">{children}</span>
    </div>
  );
}
Glossary.displayName = 'Glossary';

// Presentation Semantic Layer Components (for structuring inside nodes without direct CSS)
export function Compare({ items = [], children }) {
  if (items && items.length > 0) {
    return (
      <div className="semantic-compare-table">
        <table className="compare-grid">
          <thead>
            <tr>
              <th>维度 / 对象</th>
              {items.map((it, idx) => (
                <th key={idx}>{it.label || it.title || `方案 ${idx + 1}`}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items[0]?.rows ? (
              items[0].rows.map((rowKey, rIdx) => (
                <tr key={rIdx}>
                  <td className="compare-row-label">{rowKey}</td>
                  {items.map((it, idx) => (
                    <td key={idx}>{it.values?.[rIdx] || '-'}</td>
                  ))}
                </tr>
              ))
            ) : null}
          </tbody>
        </table>
      </div>
    );
  }
  return <div className="semantic-compare-block">{children}</div>;
}
Compare.displayName = 'Compare';

export function DecisionMatrix({ title = '权衡矩阵', headers = [], rows = [], children }) {
  if (headers.length > 0 && rows.length > 0) {
    return (
      <div className="semantic-decision-matrix">
        {title && <div className="matrix-title">⚖ {title}</div>}
        <table className="matrix-table">
          <thead>
            <tr>
              {headers.map((h, i) => <th key={i}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => <td key={j}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return <div className="semantic-decision-matrix">{children}</div>;
}
DecisionMatrix.displayName = 'DecisionMatrix';

export function Flow({ steps = [], children }) {
  if (steps.length > 0) {
    return (
      <div className="semantic-flow-steps">
        {steps.map((step, idx) => (
          <div key={idx} className="flow-step">
            <span className="step-num">{idx + 1}</span>
            <span className="step-text">{step}</span>
            {idx < steps.length - 1 && <span className="step-arrow">→</span>}
          </div>
        ))}
      </div>
    );
  }
  return <div className="semantic-flow-block">{children}</div>;
}
Flow.displayName = 'Flow';

export function Timeline({ events = [], children }) {
  if (events.length > 0) {
    return (
      <div className="semantic-timeline">
        {events.map((ev, i) => (
          <div key={i} className="timeline-item">
            <div className="timeline-point" />
            <div className="timeline-label">{ev.label || ev.time}</div>
            <div className="timeline-content">{ev.content || ev.desc}</div>
          </div>
        ))}
      </div>
    );
  }
  return <div className="semantic-timeline">{children}</div>;
}
Timeline.displayName = 'Timeline';

export function Callout({ type = 'info', title, children }) {
  return (
    <div className={`semantic-callout callout-${type}`}>
      {title && <div className="callout-title">{title}</div>}
      <div className="callout-content">{children}</div>
    </div>
  );
}
Callout.displayName = 'Callout';

export function Details({ summary = '详细展开', children }) {
  return (
    <details className="semantic-details">
      <summary>{summary}</summary>
      <div className="details-body">{children}</div>
    </details>
  );
}
Details.displayName = 'Details';

export function Columns({ children }) {
  return <div className="semantic-columns">{children}</div>;
}
Columns.displayName = 'Columns';

export function Mermaid({ chart = '', title = '关系草图', width = 'auto', height = 'auto', x = 0, y = 0, position = 'flow' }) {
  const ref = React.useRef(null);
  const id = React.useId().replace(/:/g, '');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    async function renderChart() {
      if (!ref.current || !chart.trim()) return;
      try {
        ensureMermaid();
        const { svg } = await mermaid.render(`mermaid-${id}`, chart.trim());
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          setError('');
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Mermaid 图表语法错误');
      }
    }
    renderChart();
    return () => { cancelled = true; };
  }, [chart, id]);

  return (
    <div className={`semantic-mermaid ${widgetClass(position)}`} style={widgetStyle({ width, height, x, y, position })}>
      <div className="semantic-widget-head">
        <span>{title}</span>
        <code>MERMAID</code>
      </div>
      {error ? <pre className="mermaid-error">{error}</pre> : <div ref={ref} className="mermaid-canvas" />}
    </div>
  );
}
Mermaid.displayName = 'Mermaid';

export function RelationMap({ title = '关系速览', items = [], children, width = 'auto', height = 'auto', x = 0, y = 0, position = 'flow' }) {
  return (
    <div className={`semantic-relation-map ${widgetClass(position)}`} style={widgetStyle({ width, height, x, y, position })}>
      <div className="semantic-widget-head"><span>{title}</span><code>RELATIONS</code></div>
      {items.length > 0 ? (
        <div className="relation-map-grid">
          {items.map((item, index) => (
            <div className="relation-map-row" key={index}>
              <span className="relation-map-source">{item.from || item.source}</span>
              <span className="relation-map-arrow">{item.type || '→'}</span>
              <span className="relation-map-target">{item.to || item.target}</span>
              {item.note && <small>{item.note}</small>}
            </div>
          ))}
        </div>
      ) : children}
    </div>
  );
}
RelationMap.displayName = 'RelationMap';

export function Insight({ title = '关键判断', tone = 'info', children, width = 'auto', height = 'auto', x = 0, y = 0, position = 'flow' }) {
  return (
    <aside className={`semantic-insight insight-${tone} ${widgetClass(position)}`} style={widgetStyle({ width, height, x, y, position })}>
      <div className="insight-kicker">{tone === 'warn' ? '⚠' : tone === 'success' ? '✓' : '◆'} {title}</div>
      <div className="insight-body">{children}</div>
    </aside>
  );
}
Insight.displayName = 'Insight';

export function NoteGrid({ notes = [], children, width = 'auto', height = 'auto', x = 0, y = 0, position = 'flow' }) {
  return (
    <div className={`semantic-note-grid ${widgetClass(position)}`} style={widgetStyle({ width, height, x, y, position })}>
      {notes.length > 0 ? notes.map((note, index) => (
        <div className="semantic-note" key={index}>
          <strong>{note.title || note.label}</strong>
          <span>{note.content || note.text || note.description}</span>
        </div>
      )) : children}
    </div>
  );
}
NoteGrid.displayName = 'NoteGrid';

function widgetStyle({ width, height, x, y, position }) {
  const style = {};
  if (width && width !== 'auto') style.width = width;
  if (height && height !== 'auto') style.height = height;
  if (position === 'absolute') {
    style.position = 'absolute';
    style.left = `${x}px`;
    style.top = `${y}px`;
  } else if (x || y) {
    style.transform = `translate(${x}px, ${y}px)`;
  }
  return style;
}

function widgetClass(position) {
  return position === 'absolute' ? 'semantic-widget-absolute' : '';
}
