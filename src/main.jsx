import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App.jsx';
import * as Components from './components/index.js';
import AtlasGuideDoc from '../content/atlas-guide.mdx';

// Mount MDX application to DOM
const rootElement = document.getElementById('root') || document.getElementById('app');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App mdxContent={<AtlasGuideDoc components={Components} />} />
    </React.StrictMode>
  );
}
