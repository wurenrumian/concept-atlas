import React, { useState, useEffect } from 'react';
import { Network, Compass, Sparkles } from 'lucide-react';
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

  // Global shared state
  const [currentView, setCurrentView] = useState('explore'); // 'explore' | 'graph'
  const [currentNodeId, setCurrentNodeId] = useState(graph.meta.rootId || '');
  const [selectedLevel, setSelectedLevel] = useState(null);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle views with 1 and 2 or 'g' and 'e' if not focused on input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }
      if (e.key === '1' || e.key === 'e') {
        setCurrentView('explore');
      } else if (e.key === '2' || e.key === 'g') {
        setCurrentView('graph');
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
      {/* Top Header Navigation */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-title">
            <Sparkles size={16} color="#87a6ff" />
            <span>CONCEPT ATLAS</span>
          </div>
          <div className="brand-doc-title">
            {graph.meta.title || '知识概念图谱'}
          </div>
        </div>

        <div className="view-tabs">
          <button
            className={`view-tab ${currentView === 'explore' ? 'active' : ''}`}
            onClick={() => setCurrentView('explore')}
          >
            <Compass size={14} />
            <span>节点探索</span>
          </button>
          <button
            className={`view-tab ${currentView === 'graph' ? 'active' : ''}`}
            onClick={() => setCurrentView('graph')}
          >
            <Network size={14} />
            <span>全局关系图谱</span>
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <main className="app-main">
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
          />
        )}
      </main>
    </div>
  );
}
