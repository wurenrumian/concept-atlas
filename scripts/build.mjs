import { build } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { normalizeSkin, normalizeStyle } from '../src/model/skins.js';
import { extractPageTitle, detectFeatures } from '../src/model/validate-content.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Mermaid is served from a CDN at runtime by default so its ~2100-module
 * transform stays out of the build. Set CONCEPT_ATLAS_INLINE_MERMAID=1 to bake
 * it back into the HTML for a fully offline single file; CONCEPT_ATLAS_MERMAID_CDN
 * overrides the CDN URL.
 */
const INLINE_MERMAID = ['1', 'true', 'yes'].includes((process.env.CONCEPT_ATLAS_INLINE_MERMAID || '').toLowerCase());
const MERMAID_CDN_URL = process.env.CONCEPT_ATLAS_MERMAID_CDN || '';

/**
 * Optional compile-time appearance defaults, read from the environment and
 * forwarded as `define`s. The carrier HTML plugin replaces the placeholders
 * inside the anti-flash inline script only when these are configured.
 */
function appearanceDefines() {
  const define = {};
  const skin = normalizeSkin(process.env.CONCEPT_ATLAS_SKIN || '');
  const mode = process.env.CONCEPT_ATLAS_DEFAULT_MODE;
  const style = normalizeStyle(process.env.CONCEPT_ATLAS_STYLE || '');
  if (skin) define.__ATLAS_DEFAULT_SKIN__ = JSON.stringify(skin);
  if (['dark', 'light', 'system'].includes(mode)) define.__ATLAS_DEFAULT_MODE__ = JSON.stringify(mode);
  if (style) define.__ATLAS_DEFAULT_STYLE__ = JSON.stringify(style);
  return define;
}

/**
 * The demo document mounted by each carrier. Unlike the npm template (which
 * aliases the user's MDX), the repository hardcodes its demos in main.jsx /
 * scroll-main.jsx, so the build reads them to derive the tab title and the set
 * of optional renderers actually needed.
 */
function demoSourceFor(entry) {
  const demos = entry === 'scroll.html'
    ? ['content/scroll-guide.mdx']
    : ['content/atlas-guide.mdx', 'content/compile-runtime.mdx'];
  const demo = demos.map(name => path.resolve(rootDir, name)).find(file => fs.existsSync(file));
  return demo ? { demo, source: fs.readFileSync(demo, 'utf8') } : null;
}

/**
 * Builds one standalone carrier HTML. `__ATLAS_FEATURES__` mirrors the CLI's
 * per-document stubbing so a demo that never uses <Math>/<Mermaid> skips the
 * KaTeX fonts and Mermaid module graph instead of bundling them unconditionally.
 */
async function buildCarrier(entry, baseDefine) {
  const define = { ...baseDefine };
  const demo = demoSourceFor(entry);
  if (demo) {
    const title = extractPageTitle(demo.source);
    if (title) {
      define.__ATLAS_PAGE_TITLE__ = JSON.stringify(title);
      console.log(`🔖 ${entry} 标签页标题：${title}`);
    }
    const features = detectFeatures(demo.source);
    define.__ATLAS_FEATURES__ = JSON.stringify(features);
    if (features.mermaid) {
      define.__ATLAS_MERMAID_MODE__ = JSON.stringify(INLINE_MERMAID ? 'inline' : 'cdn');
      if (MERMAID_CDN_URL) define.__ATLAS_MERMAID_CDN_URL__ = JSON.stringify(MERMAID_CDN_URL);
      if (!INLINE_MERMAID) console.log(`🌐 ${entry} Mermaid 运行时从 CDN 加载（--inline-mermaid 可内联）`);
    }
    const dropped = [features.math ? null : 'KaTeX', features.mermaid ? null : 'Mermaid'].filter(Boolean);
    if (dropped.length) console.log(`⚡ ${entry} 省略未使用的渲染器：${dropped.join('、')}`);
  }

  await build({
    root: rootDir,
    define,
    build: {
      outDir: 'dist',
      // dist is cleared once up front; parallel carriers must not wipe each
      // other's output mid-build.
      emptyOutDir: false,
      rollupOptions: { input: path.resolve(rootDir, entry) },
    }
  });
}

async function runBuild() {
  console.log('🚀 开始构建 Concept Atlas 知识讲解页面...');

  try {
    // Clear dist once, then let every carrier write into it concurrently.
    const distDir = path.resolve(rootDir, 'dist');
    fs.rmSync(distDir, { recursive: true, force: true });
    fs.mkdirSync(distDir, { recursive: true });

    const mode = process.env.CONCEPT_ATLAS_MODE;
    const carriers = mode === 'atlas' ? ['index.html'] : mode === 'scroll' ? ['scroll.html'] : ['index.html', 'scroll.html'];
    const define = appearanceDefines();
    if (define.__ATLAS_DEFAULT_SKIN__ || define.__ATLAS_DEFAULT_MODE__) {
      console.log(`🎨 默认外观：skin=${define.__ATLAS_DEFAULT_SKIN__ || '(carrier 默认)'} mode=${define.__ATLAS_DEFAULT_MODE__ || '(carrier 默认)'}`);
    }

    // vite-plugin-singlefile supports one HTML input per build and emits no
    // shared assets, so the carriers are independent and build in parallel
    // instead of one full pass after another.
    await Promise.all(carriers.map(entry => buildCarrier(entry, define)));

    console.log(`✅ 构建成功！产物已生成到 ${carriers.map(entry => `dist/${entry}`).join(' 和 ')}。`);
  } catch (err) {
    console.error('❌ 构建失败：', err);
    process.exit(1);
  }
}

runBuild();
