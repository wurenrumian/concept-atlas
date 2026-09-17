import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { normalizeSkin, normalizeStyle } from './src/model/skins.js';

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
 *
 * `--link-assets` (the `__ATLAS_INLINE_ASSETS__` define) turns this off so figures
 * stay relative links. That keeps the output small at the cost of the page no
 * longer being self-contained: the HTML must sit beside the MDX's `assets/` dir.
 */
function inlineMdxAssets() {
  const state = { enabled: true };
  return {
    name: 'concept-atlas-inline-assets',
    enforce: 'pre',
    configResolved(config) {
      state.enabled = (config.define || {}).__ATLAS_INLINE_ASSETS__ !== 'false';
    },
    transform(code, id) {
      if (!state.enabled || !id.endsWith('.mdx')) return null;
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

/**
 * Swaps optional renderers for stubs when the document never uses them.
 *
 * Mermaid and KaTeX are the two dependencies whose transform cost and payload
 * dominate a build: KaTeX alone contributes ~60 woff2 files that
 * vite-plugin-singlefile base64-inlines into every page (~1.4 MB), and Mermaid
 * is a large share of the JS bundle. A page with no <Mermaid> or <Math> should
 * not pay for either.
 *
 * The CLI computes `detectFeatures(source)` and passes the result as the
 * `__ATLAS_FEATURES__` define; without it (e.g. the repository's own build) every
 * feature stays enabled and behaviour is unchanged.
 */
const OPTIONAL_FEATURES = {
  mermaid: { feature: 'mermaid', stub: 'mermaid' },
  katex: { feature: 'math', stub: 'katex' },
  'katex/dist/katex.min.css': { feature: 'math', stub: 'katex-css' },
};

const FEATURE_STUBS = {
  mermaid: `const mermaid = {
  initialize() {},
  render() {
    throw new Error('Mermaid is not bundled in this build: the document has no <Mermaid>.');
  },
};
export default mermaid;
`,
  katex: `const katex = {
  renderToString() {
    throw new Error('KaTeX is not bundled in this build: the document has no <Math>.');
  },
};
export default katex;
`,
  // The stylesheet stub is intentionally empty: dropping it is what removes the
  // base64-inlined KaTeX woff2 payload from the page.
  'katex-css': '',
};

function optionalFeatures() {
  let enabled = { math: true, mermaid: true };
  return {
    name: 'concept-atlas-optional-features',
    enforce: 'pre',
    configResolved(config) {
      const raw = config.define && config.define.__ATLAS_FEATURES__;
      if (typeof raw !== 'string') return;
      try {
        enabled = { math: true, mermaid: true, ...JSON.parse(raw) };
      } catch {
        enabled = { math: true, mermaid: true };
      }
    },
    resolveId(source) {
      const entry = OPTIONAL_FEATURES[source];
      if (!entry || enabled[entry.feature] !== false) return null;
      return `\0atlas-stub:${entry.stub}`;
    },
    load(id) {
      if (!id.startsWith('\0atlas-stub:')) return null;
      const stub = id.slice('\0atlas-stub:'.length);
      return Object.hasOwn(FEATURE_STUBS, stub) ? FEATURE_STUBS[stub] : null;
    },
  };
}

/**
 * Bakes the compile-time appearance defaults into the carrier HTML.
 *
 * The anti-flash inline script in index.html/scroll.html carries the literal
 * placeholders `__ATLAS_DEFAULT_SKIN__` / `__ATLAS_DEFAULT_MODE__` plus a
 * per-carrier runtime fallback (atlas: dark, scroll: system). When a default
 * IS configured — `CONCEPT_ATLAS_SKIN` / `CONCEPT_ATLAS_DEFAULT_MODE` env vars
 * or the CLI's `--skin` / `--default-mode` flags, forwarded through `define` —
 * the placeholders are replaced in the emitted HTML so first paint already
 * uses the configured default. Without configuration the placeholders survive
 * and the runtime fallbacks keep today's behaviour.
 */
function appearanceDefaults() {
  let skin = null;
  let mode = null;
  let style = null;
  return {
    name: 'concept-atlas-appearance-defaults',
    configResolved(config) {
      const define = config.define || {};
      skin = resolveToken(define.__ATLAS_DEFAULT_SKIN__, normalizeSkin);
      mode = resolveToken(define.__ATLAS_DEFAULT_MODE__, value => (['dark', 'light', 'system'].includes(value) ? value : null));
      style = resolveToken(define.__ATLAS_DEFAULT_STYLE__, normalizeStyle);
    },
    transformIndexHtml(html) {
      let output = html;
      if (skin) output = output.split('__ATLAS_DEFAULT_SKIN__').join(skin);
      if (mode) output = output.split('__ATLAS_DEFAULT_MODE__').join(mode);
      if (style) output = output.split('__ATLAS_DEFAULT_STYLE__').join(style);
      return output;
    },
  };
}

/** Define values arrive as JSON literals (`"ember"`); unwrap and validate. */
function resolveToken(raw, validate) {
  if (typeof raw !== 'string') return null;
  const value = raw.replace(/^"([\s\S]*)"$/, '$1');
  return validate(value);
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
    optionalFeatures(),
    appearanceDefaults(),
    viteSingleFile(),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
