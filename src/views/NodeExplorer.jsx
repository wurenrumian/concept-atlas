import React from 'react';
import { ChevronRight, ArrowUpRight, CornerDownRight, ArrowLeft, Network, CornerLeftUp } from 'lucide-react';
import { getAncestorPath, getSiblingNodes } from '../model/concept-schema.js';
import { LEVEL_DEFS } from '../model/relation-types.js';

export function NodeExplorer({
  graph,
  currentNodeId,
  onSelectNode,
  onSwitchView,
  selectedLevel,
  onSelectLevel
}) {
  const { nodes, relations } = graph;
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

  // Node-specific relations
  const outgoingRelations = relations.filter(r => r.from === currentNode.id);
  const incomingRelations = relations.filter(r => r.to === currentNode.id);

  // Level definition
  const levelInfo = LEVEL_DEFS[currentNode.level] || { name: currentNode.level, tag: currentNode.level, color: '#87a6ff' };

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
                <div
                  key={node.id}
                  className={`breadcrumb-node ${isCurrent ? 'active' : ''}`}
                  onClick={() => onSelectNode(node.id)}
                  title={node.title}
                >
                  <span className="bc-level-pill" style={{ borderColor: LEVEL_DEFS[node.level]?.color }}>
                    {node.level}
                  </span>
                  <span className="bc-title">{node.title}</span>
                  {index < ancestorPath.length - 1 && <ChevronRight size={14} className="bc-arrow" />}
                </div>
              );
            })}
          </div>
        </div>

        {parentNode && (
          <div className="side-section">
            <button className="back-parent-btn" onClick={() => onSelectNode(parentNode.id)}>
              <CornerLeftUp size={14} />
              <span>返回父级：{parentNode.title}</span>
            </button>
          </div>
        )}

        <div className="side-section">
          <div className="side-label">同层节点</div>
          <div className="sibling-list">
            {siblings.length > 0 ? (
              siblings.map(sib => (
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

        <div className="side-section tree-section">
          <div className="side-label">概念层级树</div>
          <div className="concept-nav-tree">
            {renderNavTree(nodes, graph.meta.rootId, currentNode.id, onSelectNode)}
          </div>
        </div>
      </aside>

      {/* 2. Middle Column: Current Node Explanation Card */}
      <main className="explorer-center">
        <div className="center-scrollable">
          {/* Header toolbar */}
          <div className="center-toolbar">
            <div className="node-id-tag">
              CONCEPT ID · <code>{currentNode.id}</code>
            </div>
            <div className="level-indicators">
              {Object.keys(LEVEL_DEFS).map(lvl => (
                <button
                  key={lvl}
                  className={`level-pill ${currentNode.level === lvl ? 'active' : ''}`}
                  onClick={() => onSelectLevel && onSelectLevel(lvl)}
                  title={LEVEL_DEFS[lvl].desc}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <button
              className="view-graph-btn"
              onClick={() => onSwitchView('graph')}
              title="在图谱中聚焦此节点"
            >
              <Network size={14} />
              <span>查看全局关系</span>
            </button>
          </div>

          {/* Hero Explanatory Card */}
          <article className="concept-hero-card">
            <div className="hero-level-banner" style={{ color: levelInfo.color }}>
              <span className="badge">{levelInfo.tag}</span>
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
              <div className="meta-chip">
                <span className="chip-label">完整路径</span>
                <span className="chip-value">{ancestorPath.map(n => n.title).join(' / ')}</span>
              </div>
            </div>

            {/* Upstream -> Current -> Downstream flow ribbon */}
            <div className="local-flow-ribbon">
              <button
                className={`flow-box upstream ${parentNode ? 'clickable' : 'disabled'}`}
                onClick={() => parentNode && onSelectNode(parentNode.id)}
                disabled={!parentNode}
              >
                <span className="box-type">上游阶段</span>
                <span className="box-title">{parentNode ? parentNode.title : '已是根节点'}</span>
              </button>
              <div className="flow-arrow">➔</div>
              <div className="flow-box current-focus">
                <span className="box-type">当前聚焦</span>
                <span className="box-title">{currentNode.title}</span>
              </div>
              <div className="flow-arrow">➔</div>
              <div className={`flow-box downstream ${childNodes.length > 0 ? 'clickable' : 'disabled'}`}>
                <span className="box-type">下钻子节点 ({childNodes.length})</span>
                {childNodes.length > 0 ? (
                  <div className="flow-node-list">
                    {childNodes.map(child => (
                      <button
                        key={child.id}
                        className="flow-node-link"
                        onClick={() => onSelectNode(child.id)}
                        title={`切换到：${child.title}`}
                      >
                        <span>{child.title}</span>
                        <ChevronRight size={12} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="box-title">已是最末节点</span>
                )}
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
              <section key={i} className="node-block custom-section">
                {sec}
              </section>
            ))}

            {/* Sub-node Exploration Cards (Drill Down Entrance) */}
            {childNodes.length > 0 && (
              <section className="node-block drill-down-section">
                <div className="block-head">
                  <h2>深入下钻：子概念节点</h2>
                  <small>点击卡片探索更深机制</small>
                </div>
                <div className="subnodes-grid">
                  {childNodes.map(child => (
                    <div
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
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      {/* 3. Right Column: Inspector and Local Relations */}
      <aside className="explorer-side right-side">
        <div className="inspector-container">
          <div className="inspector-head">
            <div className="insp-title">局部细节与知识网络</div>
            <div className="insp-sub">随当前节点动态聚焦</div>
          </div>

          {/* Prerequisites */}
          {currentNode.prerequisites.length > 0 && (
            <div className="insp-group">
              <div className="insp-label">前置知识 (Prerequisites)</div>
              <ul className="insp-pill-list">
                {currentNode.prerequisites.map((p, i) => (
                  <li key={i} className="insp-pill prereq-pill">{p}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Boundaries */}
          {currentNode.boundaries.length > 0 && (
            <div className="insp-group">
              <div className="insp-label">边界条件与约束 (Boundaries)</div>
              <div className="boundary-list">
                {currentNode.boundaries.map((b, i) => (
                  <div key={i} className="boundary-card">
                    <div className="b-title">{b.title}</div>
                    <div className="b-content">{b.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Outgoing Relations (当前节点 → 其他节点) */}
          <div className="insp-group">
            <div className="insp-label">延伸关联 (Outgoing Relations)</div>
            {outgoingRelations.length > 0 ? (
              <div className="relation-links">
                {outgoingRelations.map((rel, i) => {
                  const targetNode = nodes.get(rel.to);
                  return (
                    <div
                      key={i}
                      className="relation-link-card"
                      onClick={() => targetNode && onSelectNode(targetNode.id)}
                    >
                      <div className="rel-type-tag" style={{ color: rel.typeInfo.color, borderColor: rel.typeInfo.color }}>
                        {rel.typeLabel}
                      </div>
                      <div className="rel-target">
                        <span className="target-name">{targetNode ? targetNode.title : rel.to}</span>
                        <CornerDownRight size={13} />
                      </div>
                      {rel.description && (
                        <div className="rel-desc">{rel.description}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-subtext">暂无向外关联</div>
            )}
          </div>

          {/* Incoming Relations (其他节点 → 当前节点) */}
          <div className="insp-group">
            <div className="insp-label">前驱来源 (Incoming Relations)</div>
            {incomingRelations.length > 0 ? (
              <div className="relation-links">
                {incomingRelations.map((rel, i) => {
                  const sourceNode = nodes.get(rel.from);
                  return (
                    <div
                      key={i}
                      className="relation-link-card"
                      onClick={() => sourceNode && onSelectNode(sourceNode.id)}
                    >
                      <div className="rel-type-tag" style={{ color: rel.typeInfo.color, borderColor: rel.typeInfo.color }}>
                        {rel.typeLabel}
                      </div>
                      <div className="rel-target">
                        <span className="target-name">{sourceNode ? sourceNode.title : rel.from}</span>
                        <ArrowLeft size={13} />
                      </div>
                      {rel.description && (
                        <div className="rel-desc">{rel.description}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-subtext">暂无前驱来源</div>
            )}
          </div>

          {/* Glossary terms */}
          {currentNode.glossary.length > 0 && (
            <div className="insp-group">
              <div className="insp-label">关键术语表</div>
              <dl className="glossary-dl">
                {currentNode.glossary.map((g, i) => (
                  <React.Fragment key={i}>
                    <dt>{g.term}</dt>
                    <dd>{g.definition}</dd>
                  </React.Fragment>
                ))}
              </dl>
            </div>
          )}
        </div>
      </aside>
    </div>
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
          <span className="node-bullet" style={{ backgroundColor: LEVEL_DEFS[node.level]?.color || '#87a6ff' }} />
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
