import React from 'react';
import { ChevronRight, ArrowUpRight, CornerDownRight, ArrowLeft, Network, CornerLeftUp, ZoomIn, ZoomOut, RotateCcw, Link as LinkIcon } from 'lucide-react';
import { getAncestorPath, getSiblingNodes } from '../model/concept-schema.js';
import { LEVEL_DEFS } from '../model/relation-types.js';
import { NODE_KINDS } from '../model/node-kinds.js';
import { FigureScopeProvider } from '../components/FigureScope.jsx';

export function NodeExplorer({
  graph,
  currentNodeId,
  onSelectNode,
  onSwitchView,
  selectedLevel,
  onSelectLevel
}) {
  const { nodes, relations } = graph;
  const [canvasScale, setCanvasScale] = React.useState(1);
  const [canvasPan, setCanvasPan] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const dragRef = React.useRef(null);
  const suppressClickRef = React.useRef(false);
  const viewportRef = React.useRef(null);
  const boardRef = React.useRef(null);
  const canvasScaleRef = React.useRef(canvasScale);
  const canvasPanRef = React.useRef(canvasPan);
  canvasScaleRef.current = canvasScale;
  canvasPanRef.current = canvasPan;

  const updateScale = (nextScale) => {
    const scale = Math.max(0.65, Math.min(1.6, +nextScale.toFixed(2)));
    setCanvasScale(scale);
  };

  // Keep the board from being scrolled entirely out of view.
  const clampCanvasPan = (x, y, scale = canvasScale) => {
    const viewport = viewportRef.current;
    const board = boardRef.current;
    if (!viewport || !board) return { x, y };
    const margin = 64;
    const clampAxis = (value, content, view) =>
      Math.max(Math.min(view - content, 0) - margin, Math.min(margin, value));
    return {
      x: clampAxis(x, board.offsetWidth * scale, viewport.clientWidth),
      y: clampAxis(y, board.offsetHeight * scale, viewport.clientHeight),
    };
  };

  // Wheel scrolls the canvas vertically; Ctrl/Cmd + wheel zooms around the
  // pointer. React's onWheel is passive, so bind a native listener instead.
  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;

    const handleWheel = (event) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        const scale = canvasScaleRef.current;
        const pan = canvasPanRef.current;
        const rect = viewport.getBoundingClientRect();
        const factor = Math.exp(-event.deltaY * 0.002);
        const nextScale = Math.max(0.65, Math.min(1.6, +(scale * factor).toFixed(3)));
        const focusX = event.clientX - rect.left;
        const focusY = event.clientY - rect.top;
        const contentX = (focusX - pan.x) / scale;
        const contentY = (focusY - pan.y) / scale;
        setCanvasScale(nextScale);
        setCanvasPan(clampCanvasPan(focusX - contentX * nextScale, focusY - contentY * nextScale, nextScale));
        return;
      }

      event.preventDefault();
      const stepX = event.shiftKey ? event.deltaY : event.deltaX;
      const stepY = event.shiftKey ? 0 : event.deltaY;
      const pan = canvasPanRef.current;
      setCanvasPan(clampCanvasPan(pan.x - stepX, pan.y - stepY, canvasScaleRef.current));
    };

    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', handleWheel);
  }, []);

  const handleCanvasPointerDown = (event) => {
    if (event.target.closest('button, a, input, select, textarea')) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panX: canvasPan.x,
      panY: canvasPan.y,
      moved: false,
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleCanvasPointerMove = (event) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    event.preventDefault();
    const distance = Math.hypot(event.clientX - dragRef.current.startX, event.clientY - dragRef.current.startY);
    if (distance < 6) return;
    dragRef.current.moved = true;
    setCanvasPan(clampCanvasPan(
      dragRef.current.panX + event.clientX - dragRef.current.startX,
      dragRef.current.panY + event.clientY - dragRef.current.startY,
      canvasScale
    ));
  };

  const handleCanvasPointerUp = (event) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      suppressClickRef.current = dragRef.current.moved;
      dragRef.current = null;
      setIsDragging(false);
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
  };
  const currentNode = nodes.get(currentNodeId) || nodes.get(graph.meta.rootId) || null;

  if (!currentNode) {
    return <div className="empty-state">未找到概念节点</div>;
  }

  const ancestorPath = getAncestorPath(nodes, currentNode.id);
  const siblings = getSiblingNodes(nodes, currentNode.id);
  const parentNode = currentNode.parent ? nodes.get(currentNode.parent) : null;
  const childNodes = currentNode.children
    .filter(id => nodes.has(id))
    .map(id => nodes.get(id));
  const visibleChildNodes = selectedLevel ? childNodes.filter(node => node.level === selectedLevel) : childNodes;
  const visibleSiblings = selectedLevel ? siblings.filter(node => node.level === selectedLevel) : siblings;

  // Node-specific relations
  const outgoingRelations = relations.filter(r => r.from === currentNode.id);
  const incomingRelations = relations.filter(r => r.to === currentNode.id);

  // Level definition
  const levelInfo = LEVEL_DEFS[currentNode.level] || { name: currentNode.level, tag: currentNode.level, color: 'var(--level-l0)' };
  const kindDef = currentNode.kind ? NODE_KINDS[currentNode.kind] || null : null;

  return (
    <div className="node-explorer-layout">
      {/* 1. Left Column: Macro Context */}
      <aside className="explorer-side left-side">
        <div className="side-section">
          <div className="side-label">当前路径 (祖先路径)</div>
          <div className="ancestor-breadcrumbs">
            {ancestorPath.map((node, index) => {
              const isCurrent = node.id === currentNode.id;
              return (
                <button
                  type="button"
                  key={node.id}
                  className={`breadcrumb-node ${isCurrent ? 'active' : ''}`}
                  onClick={() => onSelectNode(node.id)}
                  title={node.title}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  <span className="bc-level-pill" style={{ borderColor: LEVEL_DEFS[node.level]?.color }}>
                    {node.level}
                  </span>
                  <span className="bc-title">{node.title}</span>
                  {index < ancestorPath.length - 1 && <ChevronRight size={14} className="bc-arrow" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="side-section">
          <div className="side-label">同层节点</div>
          <div className="sibling-list">
            {visibleSiblings.length > 0 ? (
              visibleSiblings.map(sib => (
                <button
                  key={sib.id}
                  className="sibling-btn"
                  onClick={() => onSelectNode(sib.id)}
                >
                  <span className="sib-dot" style={{ backgroundColor: LEVEL_DEFS[sib.level]?.color }} />
                  <span className="sib-title">{sib.title}</span>
                  <span className="sib-lvl">{sib.level}</span>
                </button>
              ))
            ) : (
              <div className="empty-subtext">无同层其他节点</div>
            )}
          </div>
        </div>

        <details className="side-section tree-section compact-tree">
          <summary className="side-label">完整层级树</summary>
          <div className="concept-nav-tree">
            {renderNavTree(nodes, graph.meta.rootId, currentNode.id, onSelectNode)}
          </div>
        </details>
      </aside>

      {/* 2. Middle Column: Current Node Explanation Card */}
      <FigureScopeProvider scope={currentNode.id}>
      <main className="explorer-center">
        <HierarchyStrip
          ancestorPath={ancestorPath}
          currentNode={currentNode}
          childNodes={childNodes}
          onSelectNode={onSelectNode}
        />
        <div className="center-scrollable">
          {/* Header toolbar */}
          <div className="center-toolbar">
            <div className="level-indicators">
              {Object.keys(LEVEL_DEFS).map(lvl => (
                <button
                  key={lvl}
                  className={`level-pill ${(selectedLevel === lvl || (!selectedLevel && currentNode.level === lvl)) ? 'active' : ''}`}
                  onClick={() => onSelectLevel && onSelectLevel(selectedLevel === lvl ? null : lvl)}
                  title={LEVEL_DEFS[lvl].desc}
                >
                  {lvl}
                </button>
              ))}
              {selectedLevel && <button className="level-pill level-pill-clear" onClick={() => onSelectLevel && onSelectLevel(null)}>全部</button>}
            </div>
          </div>

          <div
            ref={viewportRef}
            className={`draft-viewport ${isDragging ? 'is-dragging' : ''}`}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onPointerCancel={handleCanvasPointerUp}
            onClickCapture={(event) => {
              if (!suppressClickRef.current) return;
              event.preventDefault();
              event.stopPropagation();
              suppressClickRef.current = false;
            }}
          >
            <div className="draft-floating-tools">
              <button
                className="view-graph-btn"
                onClick={() => onSwitchView('graph')}
                title="在图谱中聚焦此节点"
              >
                <Network size={14} />
                <span>查看全局关系</span>
              </button>
              <div className="draft-zoom-controls" aria-label="草稿缩放">
                <button onClick={() => updateScale(canvasScale - 0.1)} title="缩小">
                  <ZoomOut size={14} />
                </button>
                <span>{Math.round(canvasScale * 100)}%</span>
                <button onClick={() => updateScale(canvasScale + 0.1)} title="放大">
                  <ZoomIn size={14} />
                </button>
                <button onClick={() => { setCanvasScale(1); setCanvasPan({ x: 0, y: 0 }); }} title="重置画布">
                  <RotateCcw size={13} />
                </button>
              </div>
            </div>
            <div
              ref={boardRef}
              className="draft-board"
              style={{
                transform: `translate(${canvasPan.x}px, ${canvasPan.y}px) scale(${canvasScale})`,
              }}
            >
          {/* Compact concept note header */}
          <article className="concept-hero-card">
            <div className="hero-level-banner" style={{ color: levelInfo.color }}>
              <span className="badge">{levelInfo.tag}</span>
              {kindDef && (
                <span
                  className="kind-badge"
                  style={{ color: kindDef.tone, borderColor: kindDef.tone }}
                  title={kindDef.description}
                >
                  {kindDef.label}
                </span>
              )}
              <span className="desc">{levelInfo.desc}</span>
            </div>

            <h1 className="hero-title">{currentNode.title}</h1>

            {currentNode.summary && (
              <p className="hero-summary">{currentNode.summary}</p>
            )}

            {/* I/O and Path chips */}
            <div className="hero-meta-chips">
              {currentNode.input && (
                <div className="meta-chip">
                  <span className="chip-label">输入</span>
                  <span className="chip-value">{currentNode.input}</span>
                </div>
              )}
              {currentNode.output && (
                <div className="meta-chip">
                  <span className="chip-label">输出</span>
                  <span className="chip-value">{currentNode.output}</span>
                </div>
              )}
              {currentNode.invariants.length > 0 && (
                <div className="meta-chip">
                  <span className="chip-label">不变量</span>
                  <span className="chip-value">{currentNode.invariants.length}</span>
                </div>
              )}
              {currentNode.evidence.length > 0 && (
                <div className="meta-chip">
                  <span className="chip-label">证据</span>
                  <span className="chip-value">{currentNode.evidence.length}</span>
                </div>
              )}
              {currentNode.failureModes.length > 0 && (
                <div className="meta-chip">
                  <span className="chip-label">故障模式</span>
                  <span className="chip-value">{currentNode.failureModes.length}</span>
                </div>
              )}
              <div className="meta-chip">
                <span className="chip-label">完整路径</span>
                <span className="chip-value">{ancestorPath.map(n => n.title).join(' / ')}</span>
              </div>
            </div>

          </article>

          {/* Core Mechanism / Definition Section */}
          <div className="content-blocks">
            {currentNode.overview && (
              <section className="node-block">
                <div className="block-head">
                  <h2>概览理解</h2>
                  <small>一句话宏观认知</small>
                </div>
                <div className="block-body">{currentNode.overview}</div>
              </section>
            )}

            {currentNode.definition && (
              <section className="node-block">
                <div className="block-head">
                  <h2>概念定义</h2>
                  <small>准确定义与本质属性</small>
                </div>
                <div className="block-body">{currentNode.definition}</div>
              </section>
            )}

            {currentNode.mechanism && (
              <section className="node-block">
                <div className="block-head">
                  <h2>核心机制</h2>
                  <small>工作原理与状态流转</small>
                </div>
                <div className="block-body">{currentNode.mechanism}</div>
              </section>
            )}

            {/* Implementation code if present */}
            {currentNode.implementation && (
              <section className="node-block">
                <div className="block-head">
                  <h2>{currentNode.implementation.title}</h2>
                  <span className="impl-lang">{currentNode.implementation.language}</span>
                </div>
                <div className="block-body">
                  <pre className="code-block">
                    <code>{currentNode.implementation.code}</code>
                  </pre>
                </div>
              </section>
            )}

            {/* Examples & Counterexamples */}
            {currentNode.examples.length > 0 && (
              <section className="node-block">
                <div className="block-head">
                  <h2>典型示例</h2>
                  <small>具象化阐释</small>
                </div>
                <div className="block-body">
                  {currentNode.examples.map((ex, i) => (
                    <div key={i} className="example-item">
                      <div className="ex-title">{ex.title}</div>
                      <div className="ex-content">{ex.content}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {currentNode.counterexamples.length > 0 && (
              <section className="node-block highlight-warn">
                <div className="block-head">
                  <h2>反例与常见误区</h2>
                  <small>加深概念边界的辨析</small>
                </div>
                <div className="block-body">
                  {currentNode.counterexamples.map((cex, i) => (
                    <div key={i} className="counterexample-item">
                      <div className="cex-title">✕ {cex.title}</div>
                      <div className="cex-content">{cex.content}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Custom presentation sections (Compare, Flow, etc.) */}
            {currentNode.customSections.map((sec, i) => (
              sec?.props?.position === 'absolute' ? (
                <React.Fragment key={i}>{sec}</React.Fragment>
              ) : (
                <section key={i} className="node-block custom-section">
                  {sec}
                </section>
              )
            ))}

            {/* Sub-node Exploration Cards (Drill Down Entrance) */}
            {visibleChildNodes.length > 0 && (
              <section className="node-block drill-down-section">
                <div className="block-head">
                  <h2>深入下钻：子概念节点</h2>
                  <small>点击卡片探索更深机制</small>
                </div>
                <div className="subnodes-grid">
                  {visibleChildNodes.map(child => (
                    <button
                      key={child.id}
                      className="subnode-card"
                      onClick={() => onSelectNode(child.id)}
                    >
                      <div className="sn-header">
                        <span className="sn-level" style={{ color: LEVEL_DEFS[child.level]?.color }}>
                          {child.level}
                        </span>
                        <ArrowUpRight size={16} className="sn-arrow" />
                      </div>
                      <h3 className="sn-title">{child.title}</h3>
                      <p className="sn-summary">{child.summary || '点击进入该概念下钻探索…'}</p>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
          <NodeInspector
            currentNode={currentNode}
            nodes={nodes}
            outgoingRelations={outgoingRelations}
            incomingRelations={incomingRelations}
            onSelectNode={onSelectNode}
          />
            </div>
          </div>
        </div>
      </main>
      </FigureScopeProvider>
    </div>
  );
}

function HierarchyStrip({ ancestorPath, currentNode, childNodes, onSelectNode }) {
  const parent = ancestorPath.length > 1 ? ancestorPath[ancestorPath.length - 2] : null;

  return (
    <nav className="hierarchy-strip" aria-label="概念层级导航">
      <div className="hierarchy-strip-main">
        <span className="hierarchy-strip-label">当前位置</span>
        <div className="hierarchy-strip-path">
        {ancestorPath.slice(0, -1).map(node => (
          <button key={node.id} onClick={() => onSelectNode(node.id)} title={`返回 ${node.title}`}>
            <span>{node.level}</span>{node.title}<ChevronRight size={11} />
          </button>
        ))}
        <strong><span>{currentNode.level}</span>{currentNode.title}</strong>
        </div>
        {parent && (
          <button className="hierarchy-parent-link" onClick={() => onSelectNode(parent.id)}>
            <CornerLeftUp size={12} /> 返回父级
          </button>
        )}
      </div>
      {childNodes.length > 0 && <div className="hierarchy-strip-children">
        <span className="hierarchy-strip-label">继续下钻</span>
        <div className="hierarchy-child-scroll">{childNodes.map(child => (
          <button key={child.id} onClick={() => onSelectNode(child.id)} title={`进入 ${child.title}`}>
            {child.title}<ChevronRight size={12} />
          </button>
        ))}</div>
      </div>}
    </nav>
  );
}

function NodeInspector({ currentNode, nodes, outgoingRelations, incomingRelations, onSelectNode }) {
  const relationCard = (rel, targetId, direction) => {
    const target = nodes.get(targetId);
    return (
      <button className="inline-relation" key={`${direction}-${rel.from}-${rel.to}-${rel.type}`} onClick={() => target && onSelectNode(target.id)}>
        <span className="inline-relation-type" style={{ color: rel.typeInfo?.color }}>{rel.typeLabel}</span>
        <span className="inline-relation-main">
          <b>{target ? target.title : targetId}</b>
          {direction === 'out' ? <CornerDownRight size={13} /> : <ArrowLeft size={13} />}
        </span>
        {rel.description && <small>{rel.description}</small>}
      </button>
    );
  };

  return (
    <section className="inline-inspector">
      <div className="inline-inspector-head">
        <div>
          <span className="side-label">当前节点的延伸笔记</span>
          <h2>关联、边界与前置知识</h2>
        </div>
        <span className="inline-inspector-count">{outgoingRelations.length + incomingRelations.length} 条关系</span>
      </div>
      <div className="inline-inspector-grid">
        {currentNode.prerequisites.length > 0 && (
          <div className="inline-note-block">
            <span className="insp-label">前置知识</span>
            <div className="inline-pill-flow">
              {currentNode.prerequisites.map((item, index) => <span className="insp-pill" key={index}>{item}</span>)}
            </div>
          </div>
        )}
        {currentNode.boundaries.length > 0 && (
          <div className="inline-note-block">
            <span className="insp-label">边界条件</span>
            {currentNode.boundaries.map((boundary, index) => (
              <div className="inline-boundary" key={index}><b>{boundary.title}</b><span>{boundary.content}</span></div>
            ))}
          </div>
        )}
        <div className="inline-note-block relation-column">
          <span className="insp-label">延伸关系 · 出</span>
          {outgoingRelations.length > 0 ? outgoingRelations.map(rel => relationCard(rel, rel.to, 'out')) : <span className="empty-subtext">暂无向外关联</span>}
        </div>
        <div className="inline-note-block relation-column">
          <span className="insp-label">前驱关系 · 入</span>
          {incomingRelations.length > 0 ? incomingRelations.map(rel => relationCard(rel, rel.from, 'in')) : <span className="empty-subtext">暂无前驱来源</span>}
        </div>
        {currentNode.glossary.length > 0 && (
          <div className="inline-note-block">
            <span className="insp-label">关键术语表</span>
            <dl className="glossary-dl">
              {currentNode.glossary.map((term, index) => (
                <React.Fragment key={index}>
                  <dt>{term.term}</dt>
                  <dd>{term.definition}</dd>
                </React.Fragment>
              ))}
            </dl>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Recursive tree navigator helper
 */
function renderNavTree(nodes, rootId, currentNodeId, onSelectNode) {
  if (!rootId || !nodes.has(rootId)) return null;

  function renderBranch(id, depth = 0) {
    const node = nodes.get(id);
    if (!node) return null;
    const isCurrent = id === currentNodeId;

    return (
      <div key={id} className="tree-node-item">
        <button
          className={`tree-node-btn ${isCurrent ? 'active' : ''}`}
          style={{ paddingLeft: `${12 + depth * 14}px` }}
          onClick={() => onSelectNode(id)}
        >
          <span className="node-bullet" style={{ backgroundColor: LEVEL_DEFS[node.level]?.color || 'var(--level-l0)' }} />
          <span className="tree-title">{node.title}</span>
          <span className="tree-level">{node.level}</span>
        </button>
        {node.children.length > 0 && (
          <div className="tree-children-branch">
            {node.children.map(childId => renderBranch(childId, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return renderBranch(rootId, 0);
}
