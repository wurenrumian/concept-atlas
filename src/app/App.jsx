import React, { useState, useEffect } from 'react';
import { Network, Compass, Sun, Moon } from 'lucide-react';
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
  const [currentNodeId, setCurrentNodeId] = useState(graph.meta.rootId || '');
  const [selectedLevel, setSelectedLevel] = useState(null);

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
        // Return to root or parent
        const curr = graph.nodes.get(currentNodeId);
        if (curr && curr.parent) {
          setCurrentNodeId(curr.parent);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [graph, currentNodeId]);

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

          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={`切换主题 (当前: ${theme === 'dark' ? '暗色' : '亮色'}，快捷键 T)`}
            aria-label="切换主题"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
        {currentView === 'explore' ? (
          <NodeExplorer
            graph={graph}
            currentNodeId={currentNodeId}
            onSelectNode={setCurrentNodeId}
            onSwitchView={setCurrentView}
            selectedLevel={selectedLevel}
            onSelectLevel={setSelectedLevel}
          />
        ) : (
          <RelationGraph
            graph={graph}
            currentNodeId={currentNodeId}
            onSelectNode={setCurrentNodeId}
            onSwitchView={setCurrentView}
            theme={theme}
          />
        )}
      </main>
    </div>
  );
}
