import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import { viteSingleFile } from 'vite-plugin-singlefile';

const MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
};

/**
 * Rewrites relative image paths in MDX component props (e.g. <Figure src="./x.png" />)
 * into base64 data URIs at build time. Keeps the single-file HTML self-contained
 * and offline-openable without a runtime asset loader. Remote (http/data) and
 * absolute paths are left untouched.
 */
function inlineMdxAssets() {
  return {
    name: 'concept-atlas-inline-assets',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('.mdx')) return null;
      const dir = path.dirname(id.split('?')[0]);
      let changed = false;
      const output = code.replace(/(<[A-Za-z][\w.]*\b[^>]*?\bsrc=)(["'])([^"']+)\2/g, (match, prefix, quote, src) => {
        if (/^(https?:|data:|\/|#)/i.test(src)) return match;
        const file = path.resolve(dir, src);
        const mime = MIME_TYPES[path.extname(file).toLowerCase()];
        if (!mime || !fs.existsSync(file)) return match;
        changed = true;
        return `${prefix}${quote}data:${mime};base64,${fs.readFileSync(file).toString('base64')}${quote}`;
      });
      return changed ? { code: output, map: null } : null;
    },
  };
}

export default defineConfig({
  plugins: [
    inlineMdxAssets(),
    {
      enforce: 'pre',
      ...mdx({
        providerImportSource: null,
      }),
    },
    react(),
    viteSingleFile(),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
