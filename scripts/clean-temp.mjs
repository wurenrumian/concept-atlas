import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const tempDir = path.resolve(rootDir, 'tmp', 'dense-explain');

function cleanTemp() {
  console.log(`🧹 检查并清理临时目录: ${tempDir}`);
  if (fs.existsSync(tempDir)) {
    const files = fs.readdirSync(tempDir);
    files.forEach(file => {
      const p = path.join(tempDir, file);
      if (fs.lstatSync(p).isFile()) {
        fs.unlinkSync(p);
        console.log(`已清理: ${file}`);
      }
    });
    console.log('✅ 临时解释任务产物清理完成。');
  } else {
    console.log('ℹ️ 临时目录不存在或无需清理。');
  }
}

cleanTemp();
