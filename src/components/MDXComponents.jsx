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
export function ExplainPage({ id, title, summary, layout = 'editorial', density = 'reading', children }) {
  return <div data-component="ExplainPage" data-id={id} data-title={title} data-summary={summary} data-layout={layout} data-density={density}>{children}</div>;
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
            <span className="step-text">{typeof step === 'object' ? <><strong>{step.title || step.label || `步骤 ${idx + 1}`}</strong>{step.description && <small>{step.description}</small>}</> : step}</span>
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

export function FrameworkModel({ title = '结构化模型', type = 'elements', elements = [], question, children }) {
  const labels = { elements: '要素', stages: '阶段', layers: '层级', cycle: '循环' };
  return (
    <section className={`semantic-framework-model model-${type}`}>
      <div className="framework-model-head">
        <span className="semantic-tag">▦ {title}</span>
        <span className="framework-model-type">{labels[type] || type}</span>
      </div>
      {question && <div className="framework-model-question">{question}</div>}
      {elements.length > 0 ? (
        <div className="framework-model-elements">
          {elements.map((element, index) => (
            <div className="framework-model-element" key={index}>
              <span className="framework-model-index">{String(index + 1).padStart(2, '0')}</span>
              <strong>{element.title || element.label || element.name}</strong>
              {element.description && <span>{element.description}</span>}
            </div>
          ))}
        </div>
      ) : children}
    </section>
  );
}
FrameworkModel.displayName = 'FrameworkModel';

export function MatrixModel({ title = '二维矩阵', xLabel = '横轴', yLabel = '纵轴', cells = [], children }) {
  return (
    <section className="semantic-model-matrix">
      <div className="framework-model-head"><span className="semantic-tag">▦ {title}</span></div>
      {cells.length > 0 ? (
        <div className="model-matrix-grid">
          <div className="model-matrix-axis model-matrix-y">{yLabel}</div>
          <div className="model-matrix-axis model-matrix-x">{xLabel}</div>
          {cells.map((cell, index) => (
            <div className={`model-matrix-cell tone-${cell.tone || 'info'}`} key={index}>
              <strong>{cell.title || cell.label}</strong>
              {cell.description && <span>{cell.description}</span>}
            </div>
          ))}
        </div>
      ) : children}
    </section>
  );
}
MatrixModel.displayName = 'MatrixModel';

export function FormulaModel({ title = '公式模型', formula, variables = [], children }) {
  return (
    <section className="semantic-model-formula">
      <div className="framework-model-head"><span className="semantic-tag">∑ {title}</span></div>
      {formula && <div className="model-formula-expression"><code>{formula}</code></div>}
      {variables.length > 0 ? <dl className="model-formula-variables">{variables.map((variable, index) => <React.Fragment key={index}><dt>{variable.symbol || variable.name}</dt><dd>{variable.description || variable.value}</dd></React.Fragment>)}</dl> : children}
    </section>
  );
}
FormulaModel.displayName = 'FormulaModel';

export function PyramidModel({ title = '金字塔模型', levels = [], children }) {
  return (
    <section className="semantic-model-pyramid">
      <div className="framework-model-head"><span className="semantic-tag">△ {title}</span></div>
      {levels.length > 0 ? (
        <div className="model-pyramid-levels">
          {levels.map((level, index) => (
            <div className="model-pyramid-level" key={index} style={{ '--pyramid-width': `${Math.max(38, 100 - index * 12)}%` }}>
              <strong>{level.title || level.label}</strong>
              {level.description && <span>{level.description}</span>}
            </div>
          ))}
        </div>
      ) : children}
    </section>
  );
}
PyramidModel.displayName = 'PyramidModel';

export function FunnelModel({ title = '漏斗模型', steps = [], children }) {
  return (
    <section className="semantic-model-funnel">
      <div className="framework-model-head"><span className="semantic-tag">▽ {title}</span></div>
      {steps.length > 0 ? (
        <div className="model-funnel-steps">
          {steps.map((step, index) => (
            <div className="model-funnel-step" key={index} style={{ '--funnel-width': `${Math.max(40, 100 - index * 12)}%` }}>
              <strong>{step.title || step.label}</strong>
              {step.description && <span>{step.description}</span>}
            </div>
          ))}
        </div>
      ) : children}
    </section>
  );
}
FunnelModel.displayName = 'FunnelModel';

export function Callout({ type = 'info', title, children }) {
  const tone = ['info', 'success', 'warn', 'danger'].includes(type) ? type : 'info';
  return (
    <aside className={`semantic-callout callout-${tone}${title ? ' has-callout-title' : ''}`} data-tone={tone}>
      {title && <div className="callout-title">{title}</div>}
      <div className="callout-content">{children}</div>
    </aside>
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

export function LearningObjectives({ items = [], children }) {
  const goals = Array.isArray(items) ? items.filter(Boolean) : [];
  return (
    <section className="semantic-learning-objectives">
      <div className="semantic-tag">◎ 学习目标</div>
      {goals.length > 0 ? <ul>{goals.map((item, index) => <li key={index}>{item}</li>)}</ul> : children}
    </section>
  );
}
LearningObjectives.displayName = 'LearningObjectives';

export function KeyQuestion({ children }) {
  return (
    <aside className="semantic-key-question">
      <span className="semantic-tag">? 引导问题</span>
      <strong>{children}</strong>
    </aside>
  );
}
KeyQuestion.displayName = 'KeyQuestion';

export function Evidence({ command, observes, children }) {
  return (
    <div className="semantic-evidence">
      <div className="semantic-tag">⌕ 可验证证据</div>
      {command && <code className="evidence-command">{command}</code>}
      {(observes || children) && <div className="evidence-observes">{observes || children}</div>}
    </div>
  );
}
Evidence.displayName = 'Evidence';

export function Invariant({ title = '不变量', children }) {
  return (
    <div className="semantic-invariant">
      <div className="semantic-tag">◆ {title}</div>
      <div>{children}</div>
    </div>
  );
}
Invariant.displayName = 'Invariant';

export function FailureMode({ symptom, cause, evidence, remedy, children }) {
  const rows = [['现象', symptom], ['原因', cause], ['证据', evidence], ['建议', remedy]].filter(([, value]) => value);
  return (
    <div className="semantic-failure-mode">
      <div className="semantic-tag">⚠ 故障模式</div>
      {rows.length > 0 && <dl>{rows.map(([label, value]) => <React.Fragment key={label}><dt>{label}</dt><dd>{value}</dd></React.Fragment>)}</dl>}
      {children && <div className="failure-details">{children}</div>}
    </div>
  );
}
FailureMode.displayName = 'FailureMode';

export function Tradeoff({ title = '工程权衡', options = [], children }) {
  return (
    <div className="semantic-tradeoff">
      <div className="semantic-tag">⚖ {title}</div>
      {options.length > 0 ? (
        <div className="tradeoff-options">
          {options.map((option, index) => (
            <div className="tradeoff-option" key={index}>
              <strong>{option.name || option.label || `方案 ${index + 1}`}</strong>
              {option.benefit && <span><b>收益</b>{option.benefit}</span>}
              {option.cost && <span><b>代价</b>{option.cost}</span>}
              {option.when && <span><b>适用</b>{option.when}</span>}
            </div>
          ))}
        </div>
      ) : children}
    </div>
  );
}
Tradeoff.displayName = 'Tradeoff';

export function Columns({ children }) {
  return <div className="semantic-columns">{children}</div>;
}
Columns.displayName = 'Columns';

export function ScrollDocument({ spacing = 'comfortable', children }) {
  const safeSpacing = ['compact', 'comfortable', 'airy'].includes(spacing) ? spacing : 'comfortable';
  return <article className={`continuous-document continuous-spacing-${safeSpacing}`}>{children}</article>;
}
ScrollDocument.displayName = 'ScrollDocument';

export function ScrollHeader({ label = '连续阅读', title, children }) {
  return <header className="continuous-header"><p>{label}</p>{title && <h1>{title}</h1>}<div>{children}</div></header>;
}
ScrollHeader.displayName = 'ScrollHeader';

export function ScrollSection({ title, wide = false, spacing = 'inherit', children }) {
  const safeSpacing = ['compact', 'comfortable', 'airy'].includes(spacing) ? ` continuous-spacing-${spacing}` : '';
  return (
    <section className={`continuous-section${wide ? ' continuous-section-wide' : ''}${safeSpacing}`}>
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}
ScrollSection.displayName = 'ScrollSection';

export function ScrollProse({ children }) {
  return <div className="continuous-prose">{children}</div>;
}
ScrollProse.displayName = 'ScrollProse';

export function ScrollPair({ children }) {
  return <section className="continuous-model-pair">{children}</section>;
}
ScrollPair.displayName = 'ScrollPair';

export function ScrollGrid({ columns = 3, children }) {
  const count = [2, 3, 4].includes(Number(columns)) ? Number(columns) : 3;
  return <div className={`continuous-grid continuous-grid-${count}`}>{children}</div>;
}
ScrollGrid.displayName = 'ScrollGrid';

/** Optional layout primitives. They express intent while the template owns the CSS. */
export function Stack({ gap = 'md', children }) {
  return <div className={`semantic-stack gap-${gap}`}>{children}</div>;
}
Stack.displayName = 'Stack';

export function Grid({ columns = 'auto', gap = 'md', children }) {
  return <div className={`semantic-grid grid-${columns} gap-${gap}`}>{children}</div>;
}
Grid.displayName = 'Grid';

export function Split({ ratio = '1fr 1fr', children }) {
  return <div className="semantic-split" style={{ '--split-ratio': ratio }}>{children}</div>;
}
Split.displayName = 'Split';

export function Tabs({ items = [], children }) {
  return <div className="semantic-tabs" data-tab-count={items.length || undefined}>{items.length ? items.map((item, i) => <details key={i} open={i === 0}><summary>{item.label || item.title}</summary><div>{item.content}</div></details>) : children}</div>;
}
Tabs.displayName = 'Tabs';

export function Mermaid({ chart = '', title = '关系草图', width = 'auto', height = 'auto', x = 0, y = 0, position = 'flow' }) {
  const ref = React.useRef(null);
  const id = React.useId().replace(/:/g, '');
  const [error, setError] = React.useState('');
  const [scale, setScale] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });

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

  const zoom = (delta) => setScale(value => Math.max(0.5, Math.min(3, +(value + delta).toFixed(2))));
  const reset = () => { setScale(1); setPan({ x: 0, y: 0 }); };
  return (
    <div className={`semantic-mermaid ${widgetClass(position)}`} style={widgetStyle({ width, height, x, y, position })}>
      <div className="semantic-widget-head">
        <span>{title}</span>
        <div className="mermaid-tools"><code>MERMAID</code><button type="button" onClick={() => zoom(-0.1)} aria-label="缩小图表">−</button><span>{Math.round(scale * 100)}%</span><button type="button" onClick={() => zoom(0.1)} aria-label="放大图表">＋</button><button type="button" onClick={reset} aria-label="重置图表">↺</button></div>
      </div>
      {error ? <pre className="mermaid-error">{error}</pre> : <div className="mermaid-canvas" onWheel={(event) => { event.preventDefault(); zoom(event.deltaY < 0 ? 0.1 : -0.1); }}><div className="mermaid-canvas-inner" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }} ref={ref} /></div>}
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

export function RelationPath({ title = '关系链', steps = [], children }) {
  const safeSteps = Array.isArray(steps) ? steps.filter(Boolean) : [];
  return (
    <div className="semantic-relation-path">
      {title && <div className="semantic-widget-head"><span>{title}</span><code>PATH</code></div>}
      {safeSteps.length > 0 ? (
        <div className="relation-path-steps">
          {safeSteps.map((step, index) => (
            <React.Fragment key={index}>
              <div className={`relation-path-node tone-${step.tone || 'info'}`}>
                <span className="relation-path-kicker">{step.level || `0${index + 1}`}</span>
                <strong>{step.node || step.title}</strong>
                {step.note && <small>{step.note}</small>}
              </div>
              {index < safeSteps.length - 1 && <div className="relation-path-edge"><span>{safeSteps[index].relation || '→'}</span></div>}
            </React.Fragment>
          ))}
        </div>
      ) : children}
    </div>
  );
}
RelationPath.displayName = 'RelationPath';

export function Insight({ title = '关键判断', tone = 'info', children, width = 'auto', height = 'auto', x = 0, y = 0, position = 'flow' }) {
  const safeTone = ['info', 'success', 'warn', 'danger'].includes(tone) ? tone : 'info';
  return (
    <aside className={`semantic-insight insight-${safeTone} ${widgetClass(position)}`} data-tone={safeTone} style={widgetStyle({ width, height, x, y, position })}>
      <div className="insight-kicker">{title}</div>
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
