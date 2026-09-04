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

    // 执行 Vite 构建
    await build({
      root: rootDir,
      build: {
        outDir: 'dist',
        // Always remove stale assets so dist is a self-contained release.
        emptyOutDir: true,
      }
    });

    console.log('✅ 构建成功！产物已生成到 dist/ 目录。');
  } catch (err) {
    console.error('❌ 构建失败：', err);
    process.exit(1);
  }
}

runBuild();
