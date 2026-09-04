import React, { useState, useEffect, useMemo } from 'react';
import { Network, Compass, Sun, Moon, Search, X, Link as LinkIcon } from 'lucide-react';
import { buildGraphModel } from '../model/concept-schema.js';
import { extractConceptData } from '../model/normalize-content.js';
import { NodeExplorer } from '../views/NodeExplorer.jsx';
import { RelationGraph } from '../views/RelationGraph.jsx';
import '../styles/concept-explain.css';

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

  // Theme state ('light' | 'dark')
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('concept_atlas_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('concept_atlas_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Global shared state
  const [currentView, setCurrentView] = useState('explore'); // 'explore' | 'graph'
  const [currentNodeId, setCurrentNodeId] = useState(() => {
    const hashNode = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('node');
    return hashNode && graph.nodes.has(hashNode) ? hashNode : (graph.meta.rootId || '');
  });
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [history, setHistory] = useState(() => {
    const initial = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('node');
    return initial && graph.nodes.has(initial) ? [initial] : [graph.meta.rootId].filter(Boolean);
  });
  const [historyIndex, setHistoryIndex] = useState(0);
  const [globalQuery, setGlobalQuery] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const searchResults = useMemo(() => {
    const query = globalQuery.trim().toLowerCase();
    if (!query) return [];
    return Array.from(graph.nodes.values()).map(node => {
      const searchable = [
        node.title, node.id, node.summary, node.definition, node.overview,
        node.mechanism, node.input, node.output,
        ...(node.examples || []).flatMap(item => [item.title, item.content]),
        ...(node.glossary || []).flatMap(item => [item.term, item.definition]),
        ...(node.boundaries || []).flatMap(item => [item.title, item.content]),
      ].filter(value => typeof value === 'string').join(' ').toLowerCase();
      return searchable.includes(query) ? node : null;
    }).filter(Boolean).slice(0, 8);
  }, [globalQuery, graph.nodes]);

  const navigateToNode = (nodeId, { replace = false } = {}) => {
    if (!nodeId || !graph.nodes.has(nodeId)) return;
    setCurrentNodeId(nodeId);
    setHistory(previous => {
      const base = previous.slice(0, historyIndex + 1);
      if (base[base.length - 1] === nodeId) return previous;
      const next = [...base, nodeId];
      setHistoryIndex(next.length - 1);
      return next;
    });
    const nextHash = `#node=${encodeURIComponent(nodeId)}`;
    if (replace) window.history.replaceState({}, '', nextHash);
    else window.history.pushState({}, '', nextHash);
  };

  const moveHistory = (direction) => {
    const nextIndex = Math.max(0, Math.min(history.length - 1, historyIndex + direction));
    if (nextIndex === historyIndex) return;
    setHistoryIndex(nextIndex);
    const nodeId = history[nextIndex];
    setCurrentNodeId(nodeId);
    window.history.pushState({}, '', `#node=${encodeURIComponent(nodeId)}`);
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle views with 1 and 2 or 'g' and 'e' if not focused on input
      if (e.isComposing || e.metaKey || e.ctrlKey || e.altKey || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable) {
        return;
      }
      const key = e.key.toLowerCase();
      if (e.key === '1' || key === 'e') {
        setCurrentView('explore');
      } else if (e.key === '2' || key === 'g') {
        setCurrentView('graph');
      } else if (key === 't') {
        toggleTheme();
      } else if (e.key === 'Escape') {
        // Alt + arrows move through browsing history.
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
        // Return to root or parent
        const curr = graph.nodes.get(currentNodeId);
        if (curr && curr.parent) {
          navigateToNode(curr.parent);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [graph, currentNodeId, historyIndex, history]);

  useEffect(() => {
    const handlePopState = () => {
      const nodeId = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('node');
      if (!nodeId || !graph.nodes.has(nodeId)) return;
      setCurrentNodeId(nodeId);
      setHistory(previous => {
        const index = previous.lastIndexOf(nodeId);
        if (index >= 0) {
          setHistoryIndex(index);
          return previous;
        }
        const next = [...previous, nodeId];
        setHistoryIndex(next.length - 1);
        return next;
      });
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
            theme={theme}
          />
        )}
      </main>
    </div>
  );
}
