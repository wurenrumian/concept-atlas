import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App.jsx';
import * as Components from './components/index.js';
import UserDocument from '@concept-atlas/content';

// Mount MDX application to DOM
const rootElement = document.getElementById('root') || document.getElementById('app');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App mdxContent={<UserDocument components={Components} />} />
    </React.StrictMode>
  );
}
