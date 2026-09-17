import { build } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { normalizeSkin, normalizeStyle } from '../src/model/skins.js';
import { extractPageTitle } from '../src/model/validate-content.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

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
 * The tab title comes from the mounted demo document, not the carrier shell:
 * the repository mounts content/components-demo.mdx in index.html while the
 * npm template mounts content/compile-runtime.mdx, so both are probed and the
 * first existing file supplies its <ExplainPage>/<ScrollHeader> title.
 */
function pageTitleFor(entry) {
  const demos = entry === 'scroll.html'
    ? ['content/scroll-reading-demo.mdx']
    : ['content/components-demo.mdx', 'content/compile-runtime.mdx'];
  const demo = demos.map(name => path.resolve(rootDir, name)).find(file => fs.existsSync(file));
  return demo ? extractPageTitle(fs.readFileSync(demo, 'utf8')) : null;
}

async function runBuild() {
  console.log('🚀 开始构建 Concept Atlas 知识讲解页面...');

  try {
    // 确保 dist 目录存在
    const distDir = path.resolve(rootDir, 'dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    const mode = process.env.CONCEPT_ATLAS_MODE;
    const carriers = mode === 'atlas' ? ['index.html'] : mode === 'scroll' ? ['scroll.html'] : ['index.html', 'scroll.html'];
    const define = appearanceDefines();
    if (define.__ATLAS_DEFAULT_SKIN__ || define.__ATLAS_DEFAULT_MODE__) {
      console.log(`🎨 默认外观：skin=${define.__ATLAS_DEFAULT_SKIN__ || '(carrier 默认)'} mode=${define.__ATLAS_DEFAULT_MODE__ || '(carrier 默认)'}`);
    }

    // vite-plugin-singlefile supports one HTML input per build. Build each
    // requested carrier separately so every output remains a standalone file.
    for (const [index, entry] of carriers.entries()) {
      const title = pageTitleFor(entry);
      const entryDefine = title ? { ...define, __ATLAS_PAGE_TITLE__: JSON.stringify(title) } : define;
      if (title) console.log(`🔖 ${entry} 标签页标题：${title}`);
      await build({
        root: rootDir,
        define: entryDefine,
        build: {
          outDir: 'dist',
          emptyOutDir: index === 0,
          rollupOptions: { input: path.resolve(rootDir, entry) },
        }
      });
    }

    console.log(`✅ 构建成功！产物已生成到 ${carriers.map(entry => `dist/${entry}`).join(' 和 ')}。`);
  } catch (err) {
    console.error('❌ 构建失败：', err);
    process.exit(1);
  }
}

runBuild();
