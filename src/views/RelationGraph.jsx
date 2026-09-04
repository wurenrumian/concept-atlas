import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Search, Filter, ZoomIn, ZoomOut, RotateCcw, ArrowRight, Layers, Eye } from 'lucide-react';
import { RELATION_TYPES, LEVEL_DEFS } from '../model/relation-types.js';

export function RelationGraph({
  graph,
  currentNodeId,
  onSelectNode,
  onSwitchView,
  theme = 'dark',
}) {
  const { nodes, relations } = graph;
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  // States
  const [selectedNodeId, setSelectedNodeId] = useState(currentNodeId || graph.meta.rootId);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [filterRelationType, setFilterRelationType] = useState('ALL');
  const [highlightNeighbors, setHighlightNeighbors] = useState(true);
  const [graphMode, setGraphMode] = useState('hierarchy');

  // Convert nodes map to array
  const allNodes = useMemo(() => Array.from(nodes.values()), [nodes]);

  // Active focused node details
  const focusedNode = nodes.get(selectedNodeId) || null;

  useEffect(() => {
    if (currentNodeId && nodes.has(currentNodeId)) {
      setSelectedNodeId(currentNodeId);
    }
  }, [currentNodeId, nodes]);

  // Compute filtered nodes and links
  const { graphNodes, graphLinks } = useMemo(() => {
    let filteredNodes = allNodes;

    if (filterLevel !== 'ALL') {
      filteredNodes = filteredNodes.filter(n => n.level === filterLevel);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filteredNodes = filteredNodes.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.id.toLowerCase().includes(q) ||
        (n.summary && n.summary.toLowerCase().includes(q))
      );
    }

    const matchedIds = new Set(filteredNodes.map(n => n.id));
    // Preserve one-hop context for filtered matches instead of showing isolated nodes.
    const nodeIds = new Set(matchedIds);
    allNodes.forEach(n => {
      if (n.parent && matchedIds.has(n.id)) nodeIds.add(n.parent);
      if (n.parent && matchedIds.has(n.parent)) nodeIds.add(n.id);
    });
    relations.forEach(r => {
      if (matchedIds.has(r.from)) nodeIds.add(r.to);
      if (matchedIds.has(r.to)) nodeIds.add(r.from);
    });
    filteredNodes = allNodes.filter(n => nodeIds.has(n.id));

    // Relations include parent-child (tree) and graph relations
    const links = [];

    // Tree edges (parent -> child)
    allNodes.forEach(n => {
      if (n.parent && nodes.has(n.parent)) {
        if (nodeIds.has(n.parent) && nodeIds.has(n.id)) {
          if (filterRelationType === 'ALL' || filterRelationType === 'parent-child') {
            links.push({
              source: n.parent,
              target: n.id,
              type: 'parent-child',
              label: '父子',
              typeInfo: RELATION_TYPES['parent-child']
            });
          }
        }
      }
    });

    // Semantic relations
    relations.forEach(r => {
      if (nodeIds.has(r.from) && nodeIds.has(r.to)) {
        if (filterRelationType === 'ALL' || filterRelationType === r.type) {
          links.push({
            source: r.from,
            target: r.to,
            type: r.type,
            label: r.typeLabel || r.type,
            description: r.description,
            typeInfo: r.typeInfo || RELATION_TYPES[r.type] || { color: '#94a3b8' }
          });
        }
      }
    });

    return {
      graphNodes: filteredNodes.map(n => ({ ...n })),
      graphLinks: links
    };
  }, [allNodes, nodes, relations, filterLevel, filterRelationType, searchQuery]);

  // Neighbors of focused node
  const { connectedNodeIds, directRelations } = useMemo(() => {
    if (!selectedNodeId) return { connectedNodeIds: new Set(), directRelations: [] };

    const ids = new Set([selectedNodeId]);
    const dirRels = [];

    graphLinks.forEach(link => {
      const srcId = typeof link.source === 'object' ? link.source.id : link.source;
      const tgtId = typeof link.target === 'object' ? link.target.id : link.target;

      if (srcId === selectedNodeId) {
        ids.add(tgtId);
        dirRels.push({ targetId: tgtId, direction: 'out', link });
      }
      if (tgtId === selectedNodeId) {
        ids.add(srcId);
        dirRels.push({ targetId: srcId, direction: 'in', link });
      }
    });

    return { connectedNodeIds: ids, directRelations: dirRels };
  }, [selectedNodeId, graphLinks]);

  // Setup D3 Force Simulation
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 900;
    const height = containerRef.current.clientHeight || 650;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous

    // Marker definitions for directed arrows
    const defs = svg.append('defs');
    Object.keys(RELATION_TYPES).forEach(typeKey => {
      const typeDef = RELATION_TYPES[typeKey];
      defs.append('marker')
        .attr('id', `arrow-${typeKey}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 24)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', typeDef.color || '#87a6ff');
    });

    // Container group with zoom/pan
    const g = svg.append('g').attr('class', 'zoom-container');

    const zoomBehavior = d3.zoom()
      .scaleExtent([0.2, 3])
      .filter((event) => event.type !== 'wheel' || event.ctrlKey || event.metaKey)
      .wheelDelta((event) => {
        const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
        return -delta * 0.0015;
      })
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoomBehavior);

    const isConceptMode = graphMode === 'concept';
    const visibleGraphLinks = isConceptMode
      ? graphLinks.filter(link => link.type !== 'parent-child')
      : graphLinks.filter(link => link.type === 'parent-child');
    // Hierarchy mode is deterministic. Concept mode intentionally restores
    // the exploratory, draggable force graph for cross-layer relationships.
    const positionedNodes = isConceptMode
      ? graphNodes.map((node, index) => ({
          ...node,
          x: width / 2 + ((index % 4) - 1.5) * 80,
          y: height / 2 + (Math.floor(index / 4) - 1) * 80,
        }))
      : layoutTree(graphNodes, width, height);
    const nodeById = new Map(positionedNodes.map(node => [node.id, node]));
    const positionedLinks = decorateParallelLinks(visibleGraphLinks
      .map(link => ({
        ...link,
        source: nodeById.get(typeof link.source === 'object' ? link.source.id : link.source),
        target: nodeById.get(typeof link.target === 'object' ? link.target.id : link.target),
      }))
      .filter(link => link.source && link.target));

    const simulation = isConceptMode
      ? d3.forceSimulation(positionedNodes)
          .force('link', d3.forceLink(positionedLinks).id(d => d.id).distance(130))
          .force('center', d3.forceCenter(width / 2, height / 2))
          .force('collision', d3.forceCollide().radius(34).strength(0.35))
      : null;

    // Links group
    const linkGroup = g.append('g').attr('class', 'links');
    const links = linkGroup.selectAll('g.link-item')
      .data(positionedLinks)
      .enter()
      .append('g')
      .attr('class', 'link-item');

    const linkPaths = links.append('path')
      .attr('class', 'graph-edge')
      .attr('stroke', d => d.typeInfo?.color || '#526b8d')
      .attr('stroke-width', d => d.type === 'parent-child' ? 2 : 1.5)
      .attr('stroke-dasharray', d => d.typeInfo?.strokeDasharray || 'none')
      .attr('marker-end', d => d.typeInfo?.hasArrow ? `url(#arrow-${d.type})` : null)
      .attr('opacity', d => d.type === 'parent-child' ? 0.9 : 0.48);

    // Keep the canvas uncluttered. Relation details remain available in the
    // inspector; a native SVG tooltip provides quick context on hover.
    links.append('title')
      .text(d => `${d.label}${d.description ? `：${d.description}` : ''}`);

    const linkLabels = links.append('text')
      .attr('class', 'graph-edge-label')
      .attr('fill', d => d.typeInfo?.color || '#94a3b8')
      .attr('font-size', '10px')
      .attr('text-anchor', 'middle')
      .attr('dy', -5)
      // Parent-child is visually self-explanatory and its repeated label
      // only creates collisions with actual semantic relation labels.
      .text(d => d.type === 'parent-child' ? '' : d.label);

    // Nodes group
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const nodesSelection = nodeGroup.selectAll('g.node-item')
      .data(positionedNodes)
      .enter()
      .append('g')
      .attr('class', d => `node-item ${d.id === selectedNodeId ? 'selected' : ''}`)
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNodeId(d.id);
        onSelectNode(d.id);
      });

    if (isConceptMode) {
      nodesSelection.call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );
    }

    // Outer glow for selected or level
    nodesSelection.append('circle')
      .attr('r', d => (d.level === 'L0' ? 24 : d.level === 'L1' ? 20 : 16))
      .attr('fill', d => LEVEL_DEFS[d.level]?.color || '#87a6ff')
      .attr('fill-opacity', 0.2)
      .attr('stroke', d => LEVEL_DEFS[d.level]?.color || '#87a6ff')
      .attr('stroke-width', d => d.id === selectedNodeId ? 3 : 1.5);

    // Inner center dot
    nodesSelection.append('circle')
      .attr('r', d => (d.level === 'L0' ? 10 : d.level === 'L1' ? 7 : 5))
      .attr('fill', d => LEVEL_DEFS[d.level]?.color || '#87a6ff');

    // Node Title Label
    nodesSelection.append('text')
      .attr('dy', d => (d.level === 'L0' ? 38 : 30))
      .attr('text-anchor', 'middle')
      .attr('fill', theme === 'light' ? '#0f172a' : '#f8fafc')
      .attr('font-size', '12px')
      .attr('font-family', "'Plus Jakarta Sans', -apple-system, sans-serif")
      .attr('font-weight', d => d.id === selectedNodeId ? '700' : '500')
      .text(d => d.title);

    // Node Level Pill
    nodesSelection.append('text')
      .attr('dy', -22)
      .attr('text-anchor', 'middle')
      .attr('fill', d => LEVEL_DEFS[d.level]?.color || '#94a3b8')
      .attr('font-size', '9px')
      .text(d => d.level);

    const renderPositions = () => {
      linkPaths.attr('d', linkPath);
      positionEdgeLabels(positionedLinks, positionedNodes, width, height);
      linkLabels
        .attr('x', d => d.labelX ?? linkMidpoint(d).x)
        .attr('y', d => d.labelY ?? linkMidpoint(d).y)
        .attr('display', d => d.labelVisible ? null : 'none');
      nodesSelection.attr('transform', d => `translate(${d.x},${d.y})`);
    };

    if (simulation) {
      simulation.on('tick', renderPositions);
    } else {
      renderPositions();
    }

    // Auto-focus selected node center
    if (!isConceptMode && selectedNodeId) {
      const targetNode = positionedNodes.find(n => n.id === selectedNodeId);
      if (targetNode) {
        const transform = d3.zoomIdentity
          .translate(width / 2 - targetNode.x, height / 2 - targetNode.y)
          .scale(1.1);
        svg.transition().duration(500).call(zoomBehavior.transform, transform);
      }
    }

    return () => {
      simulation?.stop();
      svg.on('.zoom', null);
    };
  }, [graphNodes, graphLinks, selectedNodeId, theme, graphMode]);

  return (
    <div className="relation-graph-layout">
      {/* Visual Canvas Area */}
      <div className="graph-main" ref={containerRef}>
        {/* Top Control Bar */}
        <div className="graph-control-bar">
          <div className="graph-mode-switch" role="tablist" aria-label="图谱模式">
            <button
              className={graphMode === 'hierarchy' ? 'active' : ''}
              onClick={() => setGraphMode('hierarchy')}
              role="tab"
              aria-selected={graphMode === 'hierarchy'}
            >
              层级结构
            </button>
            <button
              className={graphMode === 'concept' ? 'active' : ''}
              onClick={() => setGraphMode('concept')}
              role="tab"
              aria-selected={graphMode === 'concept'}
            >
              概念关系
            </button>
          </div>
          <div className="search-box">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="搜索概念或关键词…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <span className="filter-label">层级:</span>
            <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
              <option value="ALL">全部层级 (L0-L4)</option>
              {Object.keys(LEVEL_DEFS).map(lvl => (
                <option key={lvl} value={lvl}>{lvl} · {LEVEL_DEFS[lvl].name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <span className="filter-label">关系类型:</span>
            <select value={filterRelationType} onChange={e => setFilterRelationType(e.target.value)}>
              <option value="ALL">全部关系类型</option>
              {Object.keys(RELATION_TYPES).map(typeKey => (
                <option key={typeKey} value={typeKey}>{RELATION_TYPES[typeKey].label} ({typeKey})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Legend Ribbon */}
        <div className="graph-legend-ribbon">
          <div className="legend-title">图例说明:</div>
          <div className="legend-items">
            {Object.keys(RELATION_TYPES).filter(typeKey => graphMode !== 'concept' || typeKey !== 'parent-child').slice(0, 7).map(typeKey => (
              <div key={typeKey} className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: RELATION_TYPES[typeKey].color }} />
                <span>{RELATION_TYPES[typeKey].label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SVG Container */}
        <svg ref={svgRef} className="graph-svg" width="100%" height="100%" />
      </div>

      {/* Right Details Panel */}
      <aside className="graph-side-panel">
        {focusedNode ? (
          <div className="graph-inspector">
            <div className="panel-badge" style={{ color: LEVEL_DEFS[focusedNode.level]?.color }}>
              {LEVEL_DEFS[focusedNode.level]?.tag || focusedNode.level}
            </div>
            <h2 className="panel-node-title">{focusedNode.title}</h2>
            <p className="panel-summary">{focusedNode.summary || '暂无一句话概览'}</p>

            {/* Jump to Node Explorer Button */}
            <button
              className="jump-explorer-btn"
              onClick={() => {
                onSelectNode(focusedNode.id);
                onSwitchView('explore');
              }}
            >
              <span>跳转到该节点的探索页</span>
              <ArrowRight size={14} />
            </button>

            <div className="panel-divider" />

            {/* Direct Relations in graph */}
            <div className="panel-section">
              <div className="section-title">直接邻接关系网络 ({directRelations.length})</div>
              <div className="panel-rel-list">
                {directRelations.length > 0 ? (
                  directRelations.map((item, i) => {
                    const targetN = nodes.get(item.targetId);
                    const isOut = item.direction === 'out';
                    return (
                      <div
                        key={i}
                        className="panel-rel-card"
                        onClick={() => setSelectedNodeId(item.targetId)}
                      >
                        <div className="rel-card-header">
                          <span className="rel-tag" style={{ color: item.link.typeInfo?.color }}>
                            {item.link.label}
                          </span>
                          <span className="rel-dir">{isOut ? '→ 指向' : '← 来自'}</span>
                        </div>
                        <div className="rel-target-title">
                          {targetN ? targetN.title : item.targetId}
                        </div>
                        {item.link.description && (
                          <div className="rel-target-desc">{item.link.description}</div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-subtext">该节点在当前筛选下无连接</div>
                )}
              </div>
            </div>

            {/* Input / Output */}
            {(focusedNode.input || focusedNode.output) && (
              <div className="panel-section">
                <div className="section-title">数据流转 (I/O)</div>
                <div className="io-capsule">
                  {focusedNode.input && <div><b>输入：</b>{focusedNode.input}</div>}
                  {focusedNode.output && <div><b>输出：</b>{focusedNode.output}</div>}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-inspector">
            <Eye size={28} />
            <p>在图谱中点击任意概念节点，查看其详情和连接关系</p>
          </div>
        )}
      </aside>
    </div>
  );
}

function layoutTree(nodes, width, height) {
  if (nodes.length === 0) return [];

  const nodeMap = new Map(nodes.map(node => [node.id, { ...node, children: [] }]));
  nodes.forEach(node => {
    if (node.parent && nodeMap.has(node.parent)) {
      nodeMap.get(node.parent).children.push(nodeMap.get(node.id));
    }
  });

  const roots = Array.from(nodeMap.values()).filter(node => !node.parent || !nodeMap.has(node.parent));
  const treeData = { id: '__atlas-root__', children: roots };
  const root = d3.hierarchy(treeData);
  const tree = d3.tree().nodeSize([110, 155]);
  tree(root);

  const visible = root.descendants().filter(node => node.data.id !== '__atlas-root__');
  const minX = Math.min(...visible.map(node => node.x));
  const maxX = Math.max(...visible.map(node => node.x));
  const treeWidth = Math.max(maxX - minX, 1);
  const offsetX = Math.max((width - treeWidth) / 2 - minX, 60 - minX);
  const offsetY = 105;

  return visible.map(node => ({
    ...node.data,
    x: node.x + offsetX,
    y: node.depth * 155 + offsetY,
  }));
}

function decorateParallelLinks(links) {
  const groups = new Map();
  links.forEach(link => {
    if (link.type === 'parent-child') return;
    const sourceId = link.source.id;
    const targetId = link.target.id;
    const key = [sourceId, targetId].sort().join('::');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(link);
  });

  groups.forEach(group => {
    group.forEach((link, index) => {
      link.parallelIndex = index;
      link.parallelCount = group.length;
    });
  });
  return links;
}

function linkPath(link) {
  const { source, target } = link;
  if (link.type === 'parent-child') {
    const midY = source.y + (target.y - source.y) / 2;
    return `M${source.x},${source.y} V${midY} H${target.x} V${target.y}`;
  }

  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const length = Math.max(Math.hypot(dx, dy), 1);
  const normalX = -dy / length;
  const normalY = dx / length;
  const offset = ((link.parallelIndex ?? 0) - ((link.parallelCount ?? 1) - 1) / 2) * 26;
  const controlX = (source.x + target.x) / 2 + normalX * offset;
  const controlY = (source.y + target.y) / 2 + normalY * offset;
  return `M${source.x},${source.y} Q${controlX},${controlY} ${target.x},${target.y}`;
}

function positionEdgeLabels(links, nodes, width, height) {
  const occupied = [];
  const nodeBoxes = nodes.map(node => ({
    left: node.x - 28,
    right: node.x + 28,
    top: node.y - 28,
    bottom: node.y + 28,
  }));

  links.forEach(link => {
    link.labelVisible = false;
  });

  const candidates = links
    .filter(link => link.type !== 'parent-child' && link.label)
    .map(link => {
      const midpoint = linkMidpoint(link);
      const halfWidth = Math.max(18, Math.min(70, link.label.length * 5.2));
      return { link, midpoint, halfWidth };
    })
    .sort((a, b) => a.midpoint.y - b.midpoint.y);

  candidates.forEach(({ link, midpoint, halfWidth }) => {
    const positions = [
      [midpoint.x, midpoint.y],
      [midpoint.x, midpoint.y - 20],
      [midpoint.x, midpoint.y + 20],
      [midpoint.x - 28, midpoint.y],
      [midpoint.x + 28, midpoint.y],
      [midpoint.x, midpoint.y - 38],
      [midpoint.x, midpoint.y + 38],
    ];

    const position = positions.find(([x, y]) => {
      const box = { left: x - halfWidth, right: x + halfWidth, top: y - 8, bottom: y + 8 };
      if (box.left < 8 || box.right > width - 8 || box.top < 70 || box.bottom > height - 8) return false;
      if (occupied.some(other => boxesOverlap(box, other, 6))) return false;
      if (nodeBoxes.some(node => boxesOverlap(box, node, 4))) return false;
      return true;
    });

    if (position) {
      const [x, y] = position;
      link.labelX = x;
      link.labelY = y;
      link.labelVisible = true;
      occupied.push({ left: x - halfWidth, right: x + halfWidth, top: y - 8, bottom: y + 8 });
    }
  });
}

function boxesOverlap(a, b, padding = 0) {
  return !(
    a.right + padding < b.left ||
    a.left - padding > b.right ||
    a.bottom + padding < b.top ||
    a.top - padding > b.bottom
  );
}

function linkMidpoint(link) {
  if (link.type === 'parent-child') {
    return {
      x: (link.source.x + link.target.x) / 2,
      y: (link.source.y + link.target.y) / 2,
    };
  }

  const dx = link.target.x - link.source.x;
  const dy = link.target.y - link.source.y;
  const length = Math.max(Math.hypot(dx, dy), 1);
  const offset = ((link.parallelIndex ?? 0) - ((link.parallelCount ?? 1) - 1) / 2) * 26;
  return {
    x: (link.source.x + link.target.x) / 2 - (dy / length) * offset,
    y: (link.source.y + link.target.y) / 2 + (dx / length) * offset,
  };
}
