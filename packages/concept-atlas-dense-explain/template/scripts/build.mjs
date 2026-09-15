import { build } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

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

    // vite-plugin-singlefile supports one HTML input per build. Build each
    // requested carrier separately so every output remains a standalone file.
    for (const [index, entry] of carriers.entries()) {
      await build({
        root: rootDir,
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
