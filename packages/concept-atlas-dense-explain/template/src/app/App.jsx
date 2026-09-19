import React, { useState, useEffect, useMemo } from 'react';
import { Network, Compass, Sun, Moon, Search, X, Link as LinkIcon } from 'lucide-react';
import { buildGraphModel } from '../model/concept-schema.js';
import { extractConceptData } from '../model/normalize-content.js';
import { useAppearance } from './use-appearance.js';
import { pushNode, stepHistory, syncFromLocation } from './navigation.js';
import { searchNodes } from './search.js';
import { SkinPicker } from '../components/SkinPicker.jsx';
import { NodeExplorer } from '../views/NodeExplorer.jsx';
import { RelationGraph } from '../views/RelationGraph.jsx';
import '../styles/concept-explain.css';

function readNodeFromHash() {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.hash.replace(/^#/, '')).get('node');
}

export function App({ mdxContent, initialData }) {
  // Extract graph model from MDX JSX Element or raw data
  const [graph] = useState(() => {
    if (initialData) {
      return buildGraphModel(initialData);
    }
    if (mdxContent) {
      const extracted = extractConceptData(mdxContent);
      return buildGraphModel(extracted);
    }
    return buildGraphModel({ meta: {}, nodes: [], relations: [] });
  });

  // Appearance state (skin x mode x component style), shared with the scroll carrier via localStorage
  const { skin, mode: theme, style, setSkin, setStyle, toggleMode } = useAppearance({ defaultMode: 'light' });

  const toggleTheme = toggleMode;

  // Global shared state
  const [currentView, setCurrentView] = useState('explore'); // 'explore' | 'graph'
  const initialHashNode = (() => {
    const hashNode = readNodeFromHash();
    return hashNode && graph.nodes.has(hashNode) ? hashNode : null;
  })();

  const [currentNodeId, setCurrentNodeId] = useState(
    () => initialHashNode || graph.meta.rootId || '',
  );
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [nav, setNav] = useState(() => ({
    entries: (initialHashNode ? [initialHashNode] : [graph.meta.rootId]).filter(Boolean),
    index: 0,
  }));
  const [globalQuery, setGlobalQuery] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const searchResults = useMemo(
    () => searchNodes(Array.from(graph.nodes.values()), globalQuery),
    [globalQuery, graph.nodes],
  );

  const navigateToNode = (nodeId, { replace = false } = {}) => {
    if (!nodeId || !graph.nodes.has(nodeId)) return;
    setCurrentNodeId(nodeId);
    setNav(previous => pushNode(previous, nodeId));
    const nextHash = `#node=${encodeURIComponent(nodeId)}`;
    if (replace) window.history.replaceState({}, '', nextHash);
    else window.history.pushState({}, '', nextHash);
  };

  const moveHistory = (direction) => {
    const next = stepHistory(nav, direction);
    if (!next) return;
    setNav(next);
    const nodeId = next.entries[next.index];
    setCurrentNodeId(nodeId);
    window.history.pushState({}, '', `#node=${encodeURIComponent(nodeId)}`);
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.isComposing) return;

      // Alt + arrows move through browsing history. Handled before the modifier
      // guard below, otherwise the altKey short-circuit makes them unreachable.
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        moveHistory(-1);
        return;
      }
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        moveHistory(1);
        return;
      }

      // Toggle views with 1 and 2 or 'g' and 'e' if not focused on input.
      const target = document.activeElement;
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName) || target?.isContentEditable;
      if (e.metaKey || e.ctrlKey || e.altKey || typing) return;

      const key = e.key.toLowerCase();
      if (e.key === '1' || key === 'e') {
        setCurrentView('explore');
      } else if (e.key === '2' || key === 'g') {
        setCurrentView('graph');
      } else if (key === 't') {
        toggleTheme();
      } else if (e.key === 'Escape') {
        // Return to the parent node.
        const curr = graph.nodes.get(currentNodeId);
        if (curr && curr.parent) {
          navigateToNode(curr.parent);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [graph, currentNodeId, nav]);

  useEffect(() => {
    const handlePopState = () => {
      const nodeId = readNodeFromHash();
      if (!nodeId || !graph.nodes.has(nodeId)) return;
      setCurrentNodeId(nodeId);
      setNav(previous => syncFromLocation(previous, nodeId));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [graph]);

  return (
    <div className="app-container">
      {/* Main workspace */}
      <main className="app-main">
        <div className="app-toolbar">
          <div className="view-tabs">
            <button
              className={`view-tab ${currentView === 'explore' ? 'active' : ''}`}
              onClick={() => setCurrentView('explore')}
              title="切换到节点探索视图 (按快捷键 E / 1)"
            >
              <Compass size={15} />
              <span>概念探索</span>
            </button>
            <button
              className={`view-tab ${currentView === 'graph' ? 'active' : ''}`}
              onClick={() => setCurrentView('graph')}
              title="切换到全局拓扑图谱 (按快捷键 G / 2)"
            >
              <Network size={15} />
              <span>知识网络</span>
            </button>
          </div>

          <div className="global-search">
            <Search size={14} />
            <input
              value={globalQuery}
              onChange={event => setGlobalQuery(event.target.value)}
              onKeyDown={event => { if (event.key === 'Escape') setGlobalQuery(''); }}
              placeholder="搜索所有节点…"
              aria-label="搜索所有节点"
            />
            {globalQuery && <button type="button" onClick={() => setGlobalQuery('')} aria-label="清除搜索"><X size={13} /></button>}
            {searchResults.length > 0 && (
              <div className="global-search-results" role="listbox">
                {searchResults.map(node => (
                  <button type="button" key={node.id} onClick={() => { navigateToNode(node.id); setGlobalQuery(''); }} role="option">
                    <span>{node.title}</span><small>{node.level} · {node.summary || node.id}</small>
                  </button>
                ))}
              </div>
            )}
          </div>

          <SkinPicker skin={skin} style={style} onSkinChange={setSkin} onStyleChange={setStyle} />
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={`切换主题 (当前: ${theme === 'dark' ? '暗色' : '亮色'}，快捷键 T)`}
            aria-label="切换主题"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            className="theme-toggle-btn"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.href);
                setLinkCopied(true);
                window.setTimeout(() => setLinkCopied(false), 1400);
              } catch {
                setLinkCopied(false);
              }
            }}
            title={linkCopied ? '已复制当前节点链接' : '复制当前节点链接'}
            aria-label={linkCopied ? '已复制当前节点链接' : '复制当前节点链接'}
          >
            <LinkIcon size={16} />
          </button>
        </div>
        {currentView === 'explore' ? (
          <NodeExplorer
            graph={graph}
            currentNodeId={currentNodeId}
            onSelectNode={navigateToNode}
            onSwitchView={setCurrentView}
            selectedLevel={selectedLevel}
            onSelectLevel={setSelectedLevel}
          />
        ) : (
          <RelationGraph
            graph={graph}
            currentNodeId={currentNodeId}
            onSelectNode={navigateToNode}
            onSwitchView={setCurrentView}
          />
        )}
      </main>
    </div>
  );
}
