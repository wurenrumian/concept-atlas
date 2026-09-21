import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageRoot = path.join(repoRoot, 'packages', 'concept-atlas-dense-explain');
const templateRoot = path.join(packageRoot, 'template');
const check = process.argv.includes('--check');

// `src/` at the repository root is the single source of truth for the shared
// renderer. The npm template is generated from it, including the two carrier
// entry files: they are the repository demos with the concrete `../content/*.mdx`
// import rewritten to the `@concept-atlas/content` alias the CLI injects, so a
// packaged build mounts the user's MDX instead of a demo. The `replace` list
// runs in order, so the identifier is renamed before the import path is swapped.
// Entries with `base: 'package'` target the package root rather than the
// template directory (used by the shipped skill copy).
const ALIAS_ATLAS = [
  [/\bComponentsDemoDoc\b/g, 'UserDocument'],
  [/'\.\.\/content\/components-demo\.mdx'/, "'@concept-atlas/content'"],
];
const ALIAS_SCROLL = [
  [/\bScrollReadingDemo\b/g, 'UserDocument'],
  [/'\.\.\/content\/scroll-reading-demo\.mdx'/, "'@concept-atlas/content'"],
];

const MANIFEST = [
  { from: 'vite.config.js', to: 'vite.config.js' },
  { from: 'src/app', to: 'src/app' },
  { from: 'src/components', to: 'src/components' },
  { from: 'src/model', to: 'src/model' },
  { from: 'src/views', to: 'src/views' },
  { from: 'src/styles', to: 'src/styles' },
  { from: 'src/main.jsx', to: 'src/main.jsx', replace: ALIAS_ATLAS },
  { from: 'src/scroll-main.jsx', to: 'src/scroll-main.jsx', replace: ALIAS_SCROLL },
  { from: 'index.html', to: 'index.html' },
  { from: 'scroll.html', to: 'scroll.html' },
  { from: 'content/components-demo.mdx', to: 'guides/atlas-guide.mdx' },
  { from: 'content/scroll-reading-demo.mdx', to: 'guides/scroll-guide.mdx' },
  { from: 'content/assets', to: 'guides/assets' },
  // The installed skill ships its own copy of the guides plus the sample asset
  // they reference, so an agent can learn every component with no CLI call and
  // no network. Generated from content/ like the package guides above.
  { from: 'content/components-demo.mdx', to: 'skills/concept-atlas-dense-explain/references/atlas-guide.mdx', base: 'repo' },
  { from: 'content/scroll-reading-demo.mdx', to: 'skills/concept-atlas-dense-explain/references/scroll-guide.mdx', base: 'repo' },
  { from: 'content/assets', to: 'skills/concept-atlas-dense-explain/references/assets', base: 'repo' },
  { from: 'skills/concept-atlas-dense-explain/SKILL.md', to: 'skill/SKILL.md', base: 'package' },
  { from: 'skills/concept-atlas-dense-explain/references', to: 'skill/references', base: 'package' },
];

// Entry targets: the npm template by default, the package root for the shipped
// skill, or the repository root for generated skill resources.
const TARGET_ROOTS = { template: templateRoot, package: packageRoot, repo: repoRoot };

const normalize = text => text.replace(/\r\n/g, '\n');

async function readNormalized(file) {
  try {
    return normalize(await fs.readFile(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function collectFiles(relative) {
  const absolute = path.join(repoRoot, relative);
  const stat = await fs.stat(absolute);
  if (stat.isFile()) return [relative];
  const entries = await fs.readdir(absolute, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    files.push(...await collectFiles(path.join(relative, entry.name)));
  }
  return files;
}

const drift = [];
let copied = 0;

for (const entry of MANIFEST) {
  const targetRoot = TARGET_ROOTS[entry.base || 'template'];
  for (const relative of await collectFiles(entry.from)) {
    const suffix = path.relative(entry.from, relative);
    const source = path.join(repoRoot, relative);
    const target = path.join(targetRoot, entry.to, suffix);
    const sourceText = await readNormalized(source);
    let outputText = sourceText;
    for (const [pattern, replacement] of entry.replace || []) {
      outputText = outputText.replace(pattern, replacement);
    }
    const targetText = await readNormalized(target);

    if (outputText === targetText) continue;

    if (check) {
      // Report every target relative to the repository root so template,
      // package-root and repo-wide outputs all print a path the reader can use.
      drift.push(path.relative(repoRoot, target).split(path.sep).join('/'));
      continue;
    }

    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, outputText, 'utf8');
    copied += 1;
  }
}

if (check) {
  if (drift.length) {
    console.error('Package is out of sync with src/. Run "npm run sync".');
    for (const file of drift) console.error(`  - ${file}`);
    process.exit(1);
  }
  console.log('Package is in sync with src/.');
  process.exit(0);
}

console.log(copied ? `Synced ${copied} file(s) into the package template.` : 'Template already up to date.');
