import React from 'react';
import { createPortal } from 'react-dom';
import mermaid from 'mermaid';
import katex from 'katex';
import { ZoomIn } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { registerReferences, subscribeReferences, getReferenceIndex } from '../model/citations.js';
import { registerFigure, subscribeFigures, getFigureNumber } from '../model/figures.js';
import { useFigureScope } from './FigureScope.jsx';

// Mermaid reads the active skin/mode from CSS variables so diagrams follow
// the current appearance. A MutationObserver re-renders charts when the
// attributes on <html> change.
const appearanceStore = (() => {
  const listeners = new Set();
  const readKey = () => (typeof document === 'undefined'
    ? ''
    : `${document.documentElement.getAttribute('data-skin') || ''}:${document.documentElement.getAttribute('data-theme') || ''}`);
  let observer = null;
  let lastKey = '';
  return {
    subscribe(listener) {
      listeners.add(listener);
      if (!observer && typeof MutationObserver !== 'undefined') {
        lastKey = readKey();
        observer = new MutationObserver(() => {
          const nextKey = readKey();
          if (nextKey !== lastKey) {
            lastKey = nextKey;
            listeners.forEach(fn => fn());
          }
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-skin', 'data-theme'] });
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && observer) {
          observer.disconnect();
          observer = null;
        }
      };
    },
    getKey: readKey,
  };
})();

function useAppearanceKey() {
  return React.useSyncExternalStore(appearanceStore.subscribe, appearanceStore.getKey, appearanceStore.getKey);
}

const MERMAID_FALLBACKS = {
  primaryColor: '#172554',
  primaryTextColor: '#e0f2fe',
  primaryBorderColor: '#38bdf8',
  lineColor: '#64748b',
  tertiaryColor: '#0f172a',
};

function configureMermaid() {
  const styles = getComputedStyle(document.documentElement);
  const read = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;
  const nodeBg = read('--mermaid-node-bg', MERMAID_FALLBACKS.primaryColor);
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    theme: 'base',
    look: 'handDrawn',
    themeVariables: {
      primaryColor: nodeBg,
      primaryTextColor: read('--mermaid-node-text', MERMAID_FALLBACKS.primaryTextColor),
      primaryBorderColor: read('--mermaid-node-border', MERMAID_FALLBACKS.primaryBorderColor),
      lineColor: read('--mermaid-line', MERMAID_FALLBACKS.lineColor),
      secondaryColor: nodeBg,
      tertiaryColor: read('--mermaid-canvas', MERMAID_FALLBACKS.tertiaryColor),
      fontFamily: read('--font-sans', "'Plus Jakarta Sans', sans-serif"),
    },
  });
}

// Shared helpers ------------------------------------------------------------

function childrenToText(children) {
  if (children === null || children === undefined || typeof children === 'boolean') return '';
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(childrenToText).join('');
  if (React.isValidElement(children) && children.props) return childrenToText(children.props.children);
  return '';
}

function slugify(text) {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'section';
}

const katexCache = new Map();

function renderTex(tex, displayMode) {
  const key = `${displayMode ? 'D' : 'I'}:${tex}`;
  if (katexCache.has(key)) return katexCache.get(key);
  let html;
  try {
    html = katex.renderToString(tex, {
      displayMode,
      throwOnError: false,
      errorColor: 'var(--accent-rose)',
      strict: 'ignore',
      trust: false,
    });
  } catch {
    html = `<code class="math-error">${tex.replace(/[<>&]/g, '')}</code>`;
  }
  katexCache.set(key, html);
  return html;
}

const FONT_PRESETS = {
  compact: { scale: 0.95, lineHeight: 1.7 },
  normal: { scale: 1, lineHeight: 1.8 },
  large: { scale: 1.15, lineHeight: 1.85 },
  xlarge: { scale: 1.3, lineHeight: 1.9 },
};

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
      {title && (
        <div className="semantic-code-head impl-header">
          <span className="semantic-code-title">{title}</span>
          {language && <span className="lang-badge">{language}</span>}
        </div>
      )}
      <pre className="code-block"><code>{typeof children === 'string' ? children.trim() : children}</code></pre>
    </div>
  );
}
Implementation.displayName = 'Implementation';

/**
 * Generic code block for any carrier. `Implementation` is bound to a node's
 * implementation section; `CodeBlock` is meant for shell commands, config,
 * output, prompts and pseudocode that live anywhere in a document.
 * Pass the code as a string through `code` (or as children) so MDX parsing and
 * the validator never confuse code with markup.
 */
export function CodeBlock({ code, language = 'text', title, caption, lineNumbers = false, wrap = false, children }) {
  const raw = typeof code === 'string' ? code : childrenToText(children);
  const text = typeof raw === 'string' ? raw.replace(/^\n+|\s+$/g, '') : '';
  if (!text) return null;
  const showLanguage = Boolean(language) && language !== 'text';
  const showHead = Boolean(title) || showLanguage;
  return (
    <figure className="semantic-code" data-language={language}>
      {showHead && (
        <div className="semantic-code-head">
          {title && <span className="semantic-code-title">{title}</span>}
          {showLanguage && <span className="lang-badge">{language}</span>}
        </div>
      )}
      <pre className={`code-block${lineNumbers ? ' code-block-numbered' : ''}${wrap ? ' code-block-wrap' : ''}`}>
        {lineNumbers
          ? <code>{text.split('\n').map((line, index) => <span className="code-line" key={index}>{line}</span>)}</code>
          : <code>{text}</code>}
      </pre>
      {caption && <figcaption className="semantic-code-caption">{caption}</figcaption>}
    </figure>
  );
}
CodeBlock.displayName = 'CodeBlock';

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

// Learning, provenance and data components --------------------------------

/**
 * A complete derivation, not just its result. `Example` shows an outcome and
 * `Flow` shows stages; a worked example shows *why* each step follows from the
 * last, so it teaches the reasoning rather than reporting the answer.
 */
export function WorkedExample({ title = '推演过程', problem, children }) {
  return (
    <section className="semantic-worked-example">
      <div className="framework-model-head">
        <span className="semantic-tag">✎ {title}</span>
        <code>WORKED EXAMPLE</code>
      </div>
      {problem && <div className="worked-problem">{problem}</div>}
      <ol className="worked-steps">{children}</ol>
    </section>
  );
}
WorkedExample.displayName = 'WorkedExample';

/** One step of a WorkedExample. `reason` records the justification. */
export function Step({ number, title, reason, children }) {
  return (
    <li className="worked-step">
      <div className={`worked-step-marker${number ? '' : ' is-auto'}`}>{number}</div>
      <div className="worked-step-body">
        {title && <strong className="worked-step-title">{title}</strong>}
        {children && <div className="worked-step-content">{children}</div>}
        {reason && <div className="worked-step-reason"><span>为什么</span>{reason}</div>}
      </div>
    </li>
  );
}
Step.displayName = 'Step';

/**
 * Neutral semantic table. `Compare` and `DecisionMatrix` carry an argument;
 * this is the plain tabular form for data that has no comparative stance.
 */
export function DataTable({ title, caption, headers = [], rows = [], children }) {
  const head = Array.isArray(headers) ? headers : [];
  const body = Array.isArray(rows) ? rows : [];
  const hasData = head.length > 0 || body.length > 0;
  return (
    <figure className="semantic-data-table">
      {title && (
        <div className="framework-model-head">
          <span className="semantic-tag">▤ {title}</span>
          <code>TABLE</code>
        </div>
      )}
      {hasData ? (
        <div className="data-table-scroll">
          <table className="data-table">
            {head.length > 0 && (
              <thead>
                <tr>{head.map((cell, index) => <th key={index}>{cell}</th>)}</tr>
              </thead>
            )}
            <tbody>
              {body.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {(Array.isArray(row) ? row : [row]).map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : children}
      {caption && <figcaption className="data-table-caption">{caption}</figcaption>}
    </figure>
  );
}
DataTable.displayName = 'DataTable';

/**
 * States plus transitions. `Flow` is linear and `Timeline` is chronological;
 * a state machine expresses cycles, guarded transitions and terminal states.
 */
export function StateMachine({ title = '状态机', initial, states = [], transitions = [], children }) {
  const list = Array.isArray(states) ? states.filter(Boolean) : [];
  const edges = Array.isArray(transitions) ? transitions.filter(Boolean) : [];
  return (
    <section className="semantic-state-machine">
      <div className="framework-model-head">
        <span className="semantic-tag">⇄ {title}</span>
        {initial && <code>INITIAL · {initial}</code>}
      </div>
      {list.length > 0 ? (
        <>
          <div className="state-machine-states">
            {list.map((state, index) => (
              <div
                key={state.id || index}
                className={`state-node${state.terminal ? ' is-terminal' : ''}${state.id === initial ? ' is-initial' : ''}`}
              >
                <strong>{state.label || state.id}</strong>
                {state.description && <span>{state.description}</span>}
              </div>
            ))}
          </div>
          {edges.length > 0 && (
            <ul className="state-machine-transitions">
              {edges.map((edge, index) => (
                <li key={index}>
                  <span className="state-from">{edge.from}</span>
                  <span className="state-arrow">{edge.event ? `—${edge.event}→` : '→'}</span>
                  <span className="state-to">{edge.to}</span>
                  {edge.guard && <small>[{edge.guard}]</small>}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : children}
    </section>
  );
}
StateMachine.displayName = 'StateMachine';

/** Immediate comprehension check with a revealed answer and explanation. */
export function Quiz({ question, answer, children, tone = 'info' }) {
  const [shown, setShown] = React.useState(false);
  const safeTone = ['info', 'success', 'warn', 'danger'].includes(tone) ? tone : 'info';
  const hasAnswer = answer !== undefined && answer !== null && answer !== '';
  return (
    <aside className={`semantic-quiz quiz-${safeTone}`} data-tone={safeTone}>
      <div className="semantic-tag">? 自测</div>
      {question && <p className="quiz-question">{question}</p>}
      {hasAnswer ? (
        <>
          <button type="button" className="quiz-toggle" aria-expanded={shown} onClick={() => setShown(value => !value)}>
            {shown ? '隐藏答案' : '显示答案'}
          </button>
          {shown && (
            <div className="quiz-answer">
              <strong>{answer}</strong>
              {children && <div className="quiz-explanation">{children}</div>}
            </div>
          )}
        </>
      ) : children}
    </aside>
  );
}
Quiz.displayName = 'Quiz';

const SOURCE_KIND_LABELS = {
  spec: '规范',
  rfc: 'RFC',
  implementation: '实现',
  experiment: '实测',
  experience: '经验',
  reference: '来源',
};

/**
 * Inline provenance for a single claim. `References` lists a bibliography;
 * `Source` marks *this* statement's origin and its kind of authority, which is
 * what separates a language spec from an ABI convention or an observation.
 */
export function Source({ kind = 'reference', label, href, children }) {
  const safeKind = SOURCE_KIND_LABELS[kind] ? kind : 'reference';
  const text = children || label || href;
  if (!text) return null;
  return (
    <span className={`semantic-source source-${safeKind}`} data-kind={safeKind}>
      <span className="source-kind">{SOURCE_KIND_LABELS[safeKind]}</span>
      {href ? <a href={href} target="_blank" rel="noreferrer">{text}</a> : <span>{text}</span>}
    </span>
  );
}
Source.displayName = 'Source';

const CONFIDENCE_LABELS = { high: '高置信', medium: '中等置信', low: '低置信' };

/** Wraps a claim with how strongly it is established, and on what basis. */
export function Confidence({ level = 'medium', basis, children }) {
  const safeLevel = CONFIDENCE_LABELS[level] ? level : 'medium';
  return (
    <div className={`semantic-confidence confidence-${safeLevel}`} data-level={safeLevel}>
      <span className="confidence-badge">{CONFIDENCE_LABELS[safeLevel]}</span>
      <div className="confidence-body">
        {children}
        {basis && <div className="confidence-basis">依据：{basis}</div>}
      </div>
    </div>
  );
}
Confidence.displayName = 'Confidence';

/** Compressed, scannable list of the points a section should leave behind. */
export function KeyTakeaways({ title = '关键要点', items = [], children }) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  return (
    <section className="semantic-key-takeaways">
      <div className="semantic-tag">✓ {title}</div>
      {list.length > 0 ? <ul>{list.map((item, index) => <li key={index}>{item}</li>)}</ul> : children}
    </section>
  );
}
KeyTakeaways.displayName = 'KeyTakeaways';

/** A headline number with unit, change and source — the conclusion a chart implies. */
export function Metric({ label, value, unit, delta, trend, note }) {
  const safeTrend = ['up', 'down', 'flat'].includes(trend)
    ? trend
    : (typeof delta === 'string' && delta.trim().startsWith('-') ? 'down' : (delta ? 'up' : null));
  return (
    <div className="semantic-metric">
      {label && <div className="metric-label">{label}</div>}
      <div className="metric-value">
        {value}
        {unit && <span className="metric-unit">{unit}</span>}
      </div>
      {delta && <div className={`metric-delta trend-${safeTrend || 'flat'}`}>{delta}</div>}
      {note && <div className="metric-note">{note}</div>}
    </div>
  );
}
Metric.displayName = 'Metric';

/** Before/after code comparison, for explaining a fix or a refactor. */
export function CodeDiff({ title = '代码对比', language = 'text', before, after, beforeLabel = '修改前', afterLabel = '修改后', caption }) {
  const beforeText = typeof before === 'string' ? before.replace(/^\n+|\s+$/g, '') : '';
  const afterText = typeof after === 'string' ? after.replace(/^\n+|\s+$/g, '') : '';
  if (!beforeText && !afterText) return null;
  const showLanguage = Boolean(language) && language !== 'text';
  return (
    <figure className="semantic-code-diff" data-language={language}>
      <div className="semantic-code-head">
        {title && <span className="semantic-code-title">{title}</span>}
        {showLanguage && <span className="lang-badge">{language}</span>}
      </div>
      <div className="code-diff-panes">
        <div className="code-diff-pane pane-before">
          <div className="code-diff-label">{beforeLabel}</div>
          <pre className="code-block"><code>{beforeText}</code></pre>
        </div>
        <div className="code-diff-pane pane-after">
          <div className="code-diff-label">{afterLabel}</div>
          <pre className="code-block"><code>{afterText}</code></pre>
        </div>
      </div>
      {caption && <figcaption className="semantic-code-caption">{caption}</figcaption>}
    </figure>
  );
}
CodeDiff.displayName = 'CodeDiff';

/**
 * Inline term with a hover/focus definition, so dense prose does not need to
 * break into a block-level `Glossary` for every word. Keyboard reachable.
 */
export function Term({ name, definition, children }) {
  const term = name || childrenToText(children);
  const description = definition || (name ? childrenToText(children) : '');
  if (!term) return null;
  return (
    <span className="semantic-term" tabIndex={0} data-term={term}>
      {term}
      {description && <span className="term-popover" role="tooltip">{description}</span>}
    </span>
  );
}
Term.displayName = 'Term';

function DecisionBranch({ node, depth }) {
  if (!node) return null;
  const kids = Array.isArray(node.branches) ? node.branches.filter(Boolean) : [];
  return (
    <li className={`decision-branch tone-${node.tone || 'info'}`}>
      <div className="decision-node">
        {node.condition && <span className="decision-condition">{node.condition}</span>}
        {node.outcome && <strong className="decision-outcome">{node.outcome}</strong>}
        {node.note && <small>{node.note}</small>}
      </div>
      {kids.length > 0 && (
        <ul className="decision-children">
          {kids.map((child, index) => <DecisionBranch key={index} node={child} depth={depth + 1} />)}
        </ul>
      )}
    </li>
  );
}

/** Branching decision paths with conditions — distinct from a linear Flow. */
export function DecisionTree({ title = '决策路径', question, branches = [], children }) {
  const list = Array.isArray(branches) ? branches.filter(Boolean) : [];
  return (
    <section className="semantic-decision-tree">
      <div className="framework-model-head">
        <span className="semantic-tag">⑂ {title}</span>
        <code>DECISION</code>
      </div>
      {question && <div className="decision-question">{question}</div>}
      {list.length > 0 ? (
        <ul className="decision-tree-root">
          {list.map((branch, index) => <DecisionBranch key={index} node={branch} depth={0} />)}
        </ul>
      ) : children}
    </section>
  );
}
DecisionTree.displayName = 'DecisionTree';

/** Reinforcing or balancing feedback loop, closing back on its first node. */
export function FeedbackLoop({ title = '反馈回路', type = 'reinforcing', nodes = [], children }) {
  const list = Array.isArray(nodes) ? nodes.filter(Boolean) : [];
  const safeType = type === 'balancing' ? 'balancing' : 'reinforcing';
  const polarity = safeType === 'balancing' ? '−' : '+';
  return (
    <section className={`semantic-feedback-loop loop-${safeType}`}>
      <div className="framework-model-head">
        <span className="semantic-tag">↻ {title}</span>
        <code>{safeType === 'balancing' ? 'BALANCING' : 'REINFORCING'}</code>
      </div>
      {list.length > 0 ? (
        <div className="feedback-loop-track">
          {list.map((node, index) => (
            <React.Fragment key={index}>
              <div className="feedback-node">
                <strong>{node.label || node.title}</strong>
                {node.description && <span>{node.description}</span>}
              </div>
              {index < list.length - 1 && <span className="feedback-arrow" aria-hidden="true">{polarity}</span>}
            </React.Fragment>
          ))}
          <span className="feedback-return" aria-hidden="true">{polarity} ↺</span>
        </div>
      ) : children}
    </section>
  );
}
FeedbackLoop.displayName = 'FeedbackLoop';

export function Columns({ children }) {
  return <div className="semantic-columns">{children}</div>;
}
Columns.displayName = 'Columns';

const ScrollOutlineContext = React.createContext(null);

function ReadingProgress() {
  const barRef = React.useRef(null);

  React.useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${ratio})`;
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="reading-progress" aria-hidden="true">
      <span className="reading-progress-bar" ref={barRef} />
    </div>
  );
}

export function ScrollToc({ items = [], activeId = null, title = '目录' }) {
  if (items.length < 2) return null;
  return (
    <nav className="scroll-toc" aria-label="目录">
      <div className="scroll-toc-title">{title}</div>
      <ol className="scroll-toc-list">
        {items.map(item => (
          <li key={item.id} className={item.id === activeId ? 'active' : undefined}>
            <a href={`#${item.id}`}>{item.title}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
ScrollToc.displayName = 'ScrollToc';

export function ScrollDocument({ spacing = 'comfortable', fontSize = 'normal', scale, lineHeight, toc = true, progress = true, children }) {
  const safeSpacing = ['compact', 'comfortable', 'airy'].includes(spacing) ? spacing : 'comfortable';
  const preset = FONT_PRESETS[fontSize] || FONT_PRESETS.normal;
  const [items, setItems] = React.useState([]);
  const [activeId, setActiveId] = React.useState(null);

  // Stable across renders: sections register once on mount and clean up on
  // unmount, so the context value never churns and cannot loop.
  const register = React.useCallback(item => {
    setItems(previous => {
      const existing = previous.find(entry => entry.id === item.id);
      if (existing) return existing.title === item.title ? previous : previous.map(entry => (entry.id === item.id ? item : entry));
      return [...previous, item];
    });
    return () => setItems(previous => previous.filter(entry => entry.id !== item.id));
  }, []);

  React.useEffect(() => {
    if (items.length < 2 || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActiveId(visible[0].target.id);
    }, { rootMargin: '-15% 0px -75% 0px', threshold: 0 });
    items.forEach(item => {
      const node = document.getElementById(item.id);
      if (node) observer.observe(node);
    });
    return () => observer.disconnect();
  }, [items]);

  const outline = React.useMemo(() => ({ register }), [register]);
  const style = {
    '--reading-scale': String(scale ?? preset.scale),
    '--reading-line-height': String(lineHeight ?? preset.lineHeight),
  };

  const showToc = toc && items.length >= 2;

  return (
    <article className={`continuous-document continuous-spacing-${safeSpacing}${showToc ? ' has-toc' : ''}`} data-font-size={fontSize} style={style}>
      {progress && <ReadingProgress />}
      <ScrollOutlineContext.Provider value={outline}>
        {showToc && <ScrollToc items={items} activeId={activeId} />}
        <div className="continuous-content">
          {children}
        </div>
      </ScrollOutlineContext.Provider>
    </article>
  );
}
ScrollDocument.displayName = 'ScrollDocument';

export function ScrollHeader({ label = '连续阅读', title, children }) {
  return <header className="continuous-header"><p>{label}</p>{title && <h1>{title}</h1>}<div>{children}</div></header>;
}
ScrollHeader.displayName = 'ScrollHeader';

export function ScrollSection({ title, id, wide = false, spacing = 'inherit', children }) {
  const outline = React.useContext(ScrollOutlineContext);
  const anchor = id || (title ? slugify(title) : '');
  const safeSpacing = ['compact', 'comfortable', 'airy'].includes(spacing) ? ` continuous-spacing-${spacing}` : '';

  React.useEffect(() => {
    if (!outline || !title || !anchor) return undefined;
    return outline.register({ id: anchor, title });
  }, [outline, anchor, title]);

  return (
    <section id={anchor || undefined} className={`continuous-section${wide ? ' continuous-section-wide' : ''}${safeSpacing}`}>
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

/**
 * Enlarged reader for a diagram. It re-renders the chart under a fresh id so
 * the full-size copy never collides with the inline SVG, then hands the result
 * to the shared zoom overlay (wheel zoom, drag to pan, Esc to close).
 */
function MermaidZoom({ chart, title, onClose }) {
  const ref = React.useRef(null);
  const appearanceKey = useAppearanceKey();
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    async function renderZoom() {
      if (!ref.current || !chart.trim()) return;
      try {
        configureMermaid();
        const renderId = `mermaid-zoom-${Math.random().toString(36).slice(2, 10)}`;
        const { svg } = await mermaid.render(renderId, chart.trim());
        if (!cancelled && ref.current) ref.current.innerHTML = svg;
      } catch (err) {
        if (!cancelled) setError(err.message || 'Mermaid 图表语法错误');
      }
    }
    renderZoom();
    return () => { cancelled = true; };
  }, [chart, appearanceKey]);

  return (
    <ZoomOverlay title={title || '关系草图'} caption={title} onClose={onClose}>
      {error
        ? <pre className="mermaid-error">{error}</pre>
        : <div className="mermaid-zoom-canvas" ref={ref} />}
    </ZoomOverlay>
  );
}

export function Mermaid({ chart = '', title = '关系草图', width = 'auto', height = 'auto', x = 0, y = 0, position = 'flow' }) {
  const ref = React.useRef(null);
  const id = React.useId().replace(/:/g, '');
  const appearanceKey = useAppearanceKey();
  const [error, setError] = React.useState('');
  const [zoomed, setZoomed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function renderChart() {
      if (!ref.current || !chart.trim()) return;
      try {
        configureMermaid();
        const renderId = `mermaid-${id}-${appearanceKey.replace(/[^a-z0-9]/gi, '')}`;
        const { svg } = await mermaid.render(renderId, chart.trim());
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
  }, [chart, id, appearanceKey]);

  const canZoom = Boolean(chart.trim()) && !error;
  const openZoom = () => { if (canZoom) setZoomed(true); };
  const onKeyDown = event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openZoom();
    }
  };

  return (
    <div className={`semantic-mermaid ${widgetClass(position)}`} style={widgetStyle({ width, height, x, y, position })}>
      <div className="semantic-widget-head">
        <span>{title}</span>
        <div className="mermaid-tools">
          <code>MERMAID</code>
          <button type="button" onClick={openZoom} disabled={!canZoom} aria-label={`放大阅读：${title}`}>
            <ZoomIn size={12} />放大阅读
          </button>
        </div>
      </div>
      {error ? (
        <pre className="mermaid-error">{error}</pre>
      ) : (
        <div
          className="mermaid-canvas"
          role="button"
          tabIndex={0}
          aria-label={`放大阅读：${title}`}
          onClick={openZoom}
          onKeyDown={onKeyDown}
        >
          <div className="mermaid-canvas-inner" ref={ref} />
        </div>
      )}
      {zoomed && <MermaidZoom chart={chart} title={title} onClose={() => setZoomed(false)} />}
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

// Math ----------------------------------------------------------------------

// Named MathInline internally: exporting a function literally called `Math`
// would shadow the global Math object for the whole module and break Math.max
// and friends. It is exported as `Math` so MDX can use <Math>.
function MathInline({ formula, children }) {
  const tex = (formula || childrenToText(children)).trim();
  if (!tex) return null;
  return <span className="semantic-math" dangerouslySetInnerHTML={{ __html: renderTex(tex, false) }} />;
}
MathInline.displayName = 'Math';
export { MathInline as Math };

export function MathBlock({ title = '公式', formula, variables = [], children }) {
  const tex = (formula || childrenToText(children)).trim();
  if (!tex) return null;
  return (
    <section className="semantic-model-formula semantic-math-block">
      <div className="framework-model-head">
        <span className="semantic-tag">∑ {title}</span>
        <span className="framework-model-type">公式</span>
      </div>
      <div className="math-block-expression" dangerouslySetInnerHTML={{ __html: renderTex(tex, true) }} />
      {variables.length > 0 && (
        <dl className="model-formula-variables">
          {variables.map((variable, index) => (
            <React.Fragment key={index}>
              <dt dangerouslySetInnerHTML={{ __html: renderTex(variable.symbol || variable.name || '', false) }} />
              <dd>{variable.description || variable.value}</dd>
            </React.Fragment>
          ))}
        </dl>
      )}
    </section>
  );
}
MathBlock.displayName = 'MathBlock';

// Charts --------------------------------------------------------------------

const CHART_COLORS = 6;

function chartColor(index) {
  return { '--chart-color': `var(--chart-${(index % CHART_COLORS) + 1})` };
}

function normalizePoints(data) {
  return (Array.isArray(data) ? data : [])
    .map((point, index) => {
      if (typeof point === 'number') return { label: String(index + 1), value: point };
      if (!point || typeof point !== 'object') return null;
      const value = Number(point.value ?? point.y ?? 0);
      return { label: String(point.label ?? point.x ?? index + 1), value: Number.isFinite(value) ? value : 0 };
    })
    .filter(Boolean);
}

function niceMax(value) {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
}

export function Chart({ title = '图表', type = 'bar', data = [], series = [], labels = [], unit = '', showValues = true, width = 'auto', height = 'auto', x = 0, y = 0, position = 'flow' }) {
  const points = normalizePoints(data);
  const seriesList = (Array.isArray(series) ? series : []).filter(Boolean).map((entry, index) => ({
    name: entry.name || entry.label || `系列 ${index + 1}`,
    colorIndex: index + 1,
    values: (Array.isArray(entry.values) ? entry.values : []).map(value => Number(value) || 0),
  }));
  const allValues = [...points.map(point => point.value), ...seriesList.flatMap(entry => entry.values)];
  const max = niceMax(Math.max(1, ...allValues));

  const VIEW_W = 600;
  const VIEW_H = 260;
  const PAD = { top: 22, right: 18, bottom: 40, left: 44 };
  const innerW = VIEW_W - PAD.left - PAD.right;
  const innerH = VIEW_H - PAD.top - PAD.bottom;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(ratio => ({ ratio, value: max * ratio }));

  const body = (() => {
    if (type === 'pie') {
      if (!points.length) return null;
      const total = points.reduce((sum, point) => sum + Math.max(0, point.value), 0) || 1;
      const radius = Math.min(innerW, innerH) / 2;
      const cx = PAD.left + innerW / 2;
      const cy = PAD.top + innerH / 2;
      let start = -Math.PI / 2;
      const arcs = points.map((point, index) => {
        const angle = (Math.max(0, point.value) / total) * Math.PI * 2;
        const end = start + angle;
        const x1 = cx + radius * Math.cos(start);
        const y1 = cy + radius * Math.sin(start);
        const x2 = cx + radius * Math.cos(end);
        const y2 = cy + radius * Math.sin(end);
        const largeArc = angle > Math.PI ? 1 : 0;
        const d = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        start = end;
        return <path key={index} className="chart-slice" style={chartColor(index)} d={d} />;
      });
      return (
        <>
          <g className="chart-pie">{arcs}</g>
          <g className="chart-legend">
            {points.map((point, index) => (
              <g key={index} transform={`translate(${PAD.left + 8}, ${PAD.top + index * 22})`}>
                <rect className="chart-legend-swatch" style={chartColor(index)} width="10" height="10" rx="2" />
                <text className="chart-legend-label" x="18" y="9">{point.label} · {Math.round((Math.max(0, point.value) / total) * 100)}%</text>
              </g>
            ))}
          </g>
        </>
      );
    }

    const grid = (
      <g className="chart-grid">
        {ticks.map((tick, index) => {
          const yPos = PAD.top + innerH - tick.ratio * innerH;
          return (
            <g key={index}>
              <line x1={PAD.left} y1={yPos} x2={PAD.left + innerW} y2={yPos} />
              <text className="chart-axis-value" x={PAD.left - 8} y={yPos + 3}>{Math.round(tick.value)}</text>
            </g>
          );
        })}
      </g>
    );

    if (type === 'line') {
      const count = Math.max(1, seriesList[0]?.values.length || 0, labels.length);
      const stepX = count > 1 ? innerW / (count - 1) : 0;
      const xFor = idx => PAD.left + idx * stepX;
      const yFor = value => PAD.top + innerH - (value / max) * innerH;
      return (
        <>
          {grid}
          {seriesList.map((entry, seriesIndex) => (
            <g key={seriesIndex}>
              <polyline
                className="chart-line"
                pathLength="1"
                style={chartColor(seriesIndex)}
                points={entry.values.map((value, idx) => `${xFor(idx)},${yFor(value)}`).join(' ')}
              />
              {entry.values.map((value, idx) => (
                <circle key={idx} className="chart-point" style={chartColor(seriesIndex)} cx={xFor(idx)} cy={yFor(value)} r="3" />
              ))}
            </g>
          ))}
          {(labels.length ? labels : seriesList[0]?.values.map((_, i) => String(i + 1)) || []).map((label, idx) => (
            <text key={idx} className="chart-axis-label" x={xFor(idx)} y={VIEW_H - PAD.bottom + 20} textAnchor="middle">{label}</text>
          ))}
          <g className="chart-legend">
            {seriesList.map((entry, index) => (
              <g key={index} transform={`translate(${PAD.left + index * 130}, ${PAD.top - 10})`}>
                <rect className="chart-legend-swatch" style={chartColor(index)} width="10" height="10" rx="2" />
                <text className="chart-legend-label" x="16" y="9">{entry.name}</text>
              </g>
            ))}
          </g>
        </>
      );
    }

    const bars = points.length
      ? points
      : (seriesList[0]?.values.map((value, index) => ({ label: labels[index] || String(index + 1), value })) || []);
    const barCount = Math.max(1, bars.length);
    const slot = innerW / barCount;
    const barWidth = Math.min(56, slot * 0.6);
    return (
      <>
        {grid}
        {bars.map((bar, index) => {
          const barHeight = (bar.value / max) * innerH;
          const xPos = PAD.left + slot * index + (slot - barWidth) / 2;
          const yPos = PAD.top + innerH - barHeight;
          return (
            <g key={index}>
              <rect className="chart-bar" style={chartColor(index)} x={xPos} y={yPos} width={barWidth} height={Math.max(0, barHeight)} rx="3" />
              {showValues && <text className="chart-bar-value" x={xPos + barWidth / 2} y={yPos - 6} textAnchor="middle">{bar.value}</text>}
              <text className="chart-axis-label" x={xPos + barWidth / 2} y={VIEW_H - PAD.bottom + 20} textAnchor="middle">{bar.label}</text>
            </g>
          );
        })}
      </>
    );
  })();

  return (
    <div className={`semantic-chart ${widgetClass(position)}`} style={widgetStyle({ width, height, x, y, position })}>
      <div className="semantic-widget-head"><span>{title}</span><code>CHART · {type.toUpperCase()}{unit ? ` · ${unit}` : ''}</code></div>
      {body ? (
        <svg className="chart-canvas" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label={title} preserveAspectRatio="xMidYMid meet">
          {body}
        </svg>
      ) : <div className="chart-empty">没有可绘制的数据</div>}
    </div>
  );
}
Chart.displayName = 'Chart';

// Figures -------------------------------------------------------------------

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 6;

/**
 * Full-viewport zoom viewer shared by images and diagrams. Rendered through a
 * portal so it escapes the transformed/rotated ancestor surfaces (`position:
 * fixed` would otherwise be contained by them). Supports wheel zoom, drag to
 * pan, double-click to toggle 1x/2x, and Escape to close.
 */
function ZoomOverlay({ title, caption, label, onClose, children }) {
  const [scale, setScale] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [dragging, setDragging] = React.useState(false);
  const stageRef = React.useRef(null);
  const closeRef = React.useRef(null);
  const dragRef = React.useRef(null);
  const movedRef = React.useRef(false);
  const scaleRef = React.useRef(scale);
  scaleRef.current = scale;

  const clampScale = value => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, +value.toFixed(3)));
  const zoomBy = delta => setScale(value => clampScale(value + delta));
  const reset = () => { setScale(1); setOffset({ x: 0, y: 0 }); };
  // Cursor-anchored zoom feels wrong at 1x; recentre whenever we return to it.
  const settle = value => { if (value <= 1) setOffset({ x: 0, y: 0 }); };

  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    // React binds `wheel` passively, so preventDefault needs a native listener.
    const onWheel = event => {
      event.preventDefault();
      const next = clampScale(scaleRef.current * Math.exp(-event.deltaY * 0.0015));
      setScale(next);
      settle(next);
    };
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, []);

  React.useEffect(() => {
    const onKeyDown = event => {
      if (event.key === 'Escape') { event.stopPropagation(); onClose(); }
      else if (event.key === '+' || event.key === '=') zoomBy(0.25);
      else if (event.key === '-' || event.key === '_') zoomBy(-0.25);
      else if (event.key === '0') reset();
    };
    window.addEventListener('keydown', onKeyDown, true);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const onPointerDown = event => {
    if (event.target.closest('button')) return;
    dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
    movedRef.current = false;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = event => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!movedRef.current && Math.hypot(dx, dy) < 6) return;
    movedRef.current = true;
    setOffset({ x: drag.ox + dx, y: drag.oy + dy });
  };

  const onPointerUp = event => {
    if (dragRef.current?.id === event.pointerId) {
      dragRef.current = null;
      setDragging(false);
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
  };

  return createPortal(
    <div
      className="image-zoom-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`放大查看：${title}`}
      onClick={event => { if (event.target === event.currentTarget && !movedRef.current) onClose(); }}
    >
      <div
        ref={stageRef}
        className={`image-zoom-stage${dragging ? ' is-dragging' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() => { const next = scaleRef.current > 1 ? 1 : 2; setScale(next); settle(next); }}
        onClick={event => { if (movedRef.current) { event.stopPropagation(); movedRef.current = false; } }}
      >
        <div className="image-zoom-target" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}>
          {children}
        </div>
      </div>
      {title && <p className="image-zoom-caption">{label && <b>{label}</b>}{caption}</p>}
      <div className="image-zoom-toolbar">
        <button type="button" onClick={() => zoomBy(-0.25)} aria-label="缩小" title="缩小（−）">−</button>
        <span aria-live="polite">{Math.round(scale * 100)}%</span>
        <button type="button" onClick={() => zoomBy(0.25)} aria-label="放大" title="放大（＋）">＋</button>
        <button type="button" onClick={reset} aria-label="重置缩放" title="重置（0）">↺</button>
        <button type="button" ref={closeRef} onClick={onClose} aria-label="关闭" title="关闭（Esc）">✕</button>
      </div>
    </div>,
    document.body,
  );
}

function ImageZoom({ src, alt, caption, label, onClose }) {
  const title = alt || caption || '图片';
  return (
    <ZoomOverlay title={title} caption={caption || alt} label={label} onClose={onClose}>
      <img src={src} alt={alt || ''} draggable="false" />
    </ZoomOverlay>
  );
}

export function Figure({ id, src, alt = '', caption, label, inline, width = 'auto', height = 'auto', x = 0, y = 0, position = 'flow' }) {
  const scope = useFigureScope();
  // `inline` is a build-time hint consumed by vite's asset plugin; binding it
  // here keeps it out of the DOM and documents that the component accepts it.
  void inline;
  const number = React.useSyncExternalStore(
    subscribeFigures,
    () => getFigureNumber(scope, id),
    () => getFigureNumber(scope, id),
  );
  React.useEffect(() => { registerFigure(scope, id); }, [scope, id]);
  const [zoomed, setZoomed] = React.useState(false);
  const title = alt || caption || '图片';
  // An explicit `label` wins; otherwise a named figure numbers itself.
  const displayLabel = label || (id && number ? `图 ${number}` : undefined);

  return (
    <figure
      id={id ? `fig-${id}` : undefined}
      className={`semantic-figure ${widgetClass(position)}`}
      style={widgetStyle({ width, height, x, y, position })}
    >
      {src ? (
        <button
          type="button"
          className="figure-zoom-trigger"
          onClick={() => setZoomed(true)}
          aria-label={`放大查看：${title}`}
        >
          <img src={src} alt={alt} loading="lazy" />
          <span className="figure-zoom-hint" aria-hidden="true"><ZoomIn size={12} />点击放大</span>
        </button>
      ) : <div className="figure-placeholder">缺少图片 src</div>}
      {(caption || displayLabel) && (
        <figcaption>
          {displayLabel && <span className="figure-label">{displayLabel}</span>}
          {caption}
        </figcaption>
      )}
      {zoomed && <ImageZoom src={src} alt={alt} caption={caption} label={displayLabel} onClose={() => setZoomed(false)} />}
    </figure>
  );
}
Figure.displayName = 'Figure';
export const Image = Figure;

/**
 * In-text reference to a numbered figure. `<Figure id="arch" />` numbers itself
 * in document order and `<FigureRef id="arch" />` renders "图 N", so inserting a
 * figure never requires renumbering the prose by hand. Links to the figure.
 */
export function FigureRef({ id, children }) {
  const scope = useFigureScope();
  const number = React.useSyncExternalStore(
    subscribeFigures,
    () => getFigureNumber(scope, id),
    () => getFigureNumber(scope, id),
  );
  const text = children ?? (number ? `图 ${number}` : '图 ?');
  return id
    ? <a className="semantic-figure-ref" href={`#fig-${id}`}>{text}</a>
    : <span className="semantic-figure-ref" data-missing="true">{text}</span>;
}
FigureRef.displayName = 'FigureRef';

// Citations -----------------------------------------------------------------

export function Cite({ id, children }) {
  const index = React.useSyncExternalStore(
    subscribeReferences,
    () => getReferenceIndex(id),
    () => null,
  );
  const uid = React.useId().replace(/:/g, '');
  return (
    <sup className="semantic-cite" data-missing={index ? undefined : 'true'}>
      <a href={`#ref-${id}`} id={`cite-${id}-${uid}`}>{children ?? (index ? `[${index}]` : '[?]')}</a>
    </sup>
  );
}
Cite.displayName = 'Cite';

export function References({ title = '参考文献', items = [], children }) {
  const key = JSON.stringify(items || []);
  React.useEffect(() => { registerReferences(items); }, [key]);
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  return (
    <section className="semantic-references">
      <div className="framework-model-head"><span className="semantic-tag">❡ {title}</span><code>REFERENCES</code></div>
      {list.length > 0 ? (
        <ol className="reference-list">
          {list.map((item, index) => (
            <li key={item.id || index} id={item.id ? `ref-${item.id}` : undefined} className="reference-item">
              {item.authors && <span className="reference-authors">{item.authors}</span>}
              {item.year && <span className="reference-year">{item.year}</span>}
              {item.title && (item.url
                ? <a className="reference-title" href={item.url} target="_blank" rel="noreferrer">{item.title}</a>
                : <span className="reference-title">{item.title}</span>)}
              {item.source && <span className="reference-source">{item.source}</span>}
              {item.note && <span className="reference-note">{item.note}</span>}
            </li>
          ))}
        </ol>
      ) : children}
    </section>
  );
}
References.displayName = 'References';

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
