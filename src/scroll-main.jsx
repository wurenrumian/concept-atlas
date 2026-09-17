import React from 'react';
import ReactDOM from 'react-dom/client';
import { Moon, Sun } from 'lucide-react';
import * as Components from './components/index.js';
import ScrollReadingDemo from '../content/scroll-reading-demo.mdx';
import { useAppearance } from './app/use-appearance.js';
import { SkinPicker } from './components/SkinPicker.jsx';
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
  const { skin, mode: theme, style, setSkin, setStyle, toggleMode } = useAppearance({ defaultMode: 'light' });

  return (
    <main className="continuous-page">
      <div className="continuous-toolbar">
        <SkinPicker skin={skin} style={style} onSkinChange={setSkin} onStyleChange={setStyle} />
        <button type="button" onClick={toggleMode} aria-label="切换主题" title="切换主题">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
      <ScrollReadingDemo components={Components} />
    </main>
  );
}
