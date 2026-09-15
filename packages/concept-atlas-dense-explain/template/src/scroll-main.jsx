import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Moon, Sun } from 'lucide-react';
import * as Components from './components/index.js';
import UserDocument from '@concept-atlas/content';
import './styles/concept-explain.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ScrollApp />
    </React.StrictMode>
  );
}

function ScrollApp() {
  const [theme, setTheme] = useState(() => localStorage.getItem('concept_atlas_scroll_theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('concept_atlas_scroll_theme', theme);
  }, [theme]);

  return (
    <main className="continuous-page">
      <div className="continuous-toolbar">
        <button type="button" onClick={() => setTheme(value => value === 'dark' ? 'light' : 'dark')} aria-label="切换主题" title="切换主题">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
      <UserDocument components={Components} />
    </main>
  );
}
