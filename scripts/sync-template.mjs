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
  [/\bAtlasGuideDoc\b/g, 'UserDocument'],
  [/'\.\.\/content\/atlas-guide\.mdx'/, "'@concept-atlas/content'"],
];
const ALIAS_SCROLL = [
  [/\bScrollGuideDoc\b/g, 'UserDocument'],
  [/'\.\.\/content\/scroll-guide\.mdx'/, "'@concept-atlas/content'"],
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
  // The guide names match their sources under content/, so a generated file is
  // always traceable back to the document that produced it.
  { from: 'content/atlas-guide.mdx', to: 'references/atlas-guide.mdx' },
  { from: 'content/scroll-guide.mdx', to: 'references/scroll-guide.mdx' },
  { from: 'content/assets', to: 'references/assets' },
  // The installed skill ships its own copy of the guides plus the sample asset
  // they reference, so an agent can learn every component with no CLI call and
  // no network. Generated from content/ like the package guides above.
  { from: 'content/atlas-guide.mdx', to: 'skills/concept-atlas-dense-explain/references/atlas-guide.mdx', base: 'repo' },
  { from: 'content/scroll-guide.mdx', to: 'skills/concept-atlas-dense-explain/references/scroll-guide.mdx', base: 'repo' },
  { from: 'content/assets', to: 'skills/concept-atlas-dense-explain/references/assets', base: 'repo' },
  // prepack-only copy for the npm tarball; the name states it is generated so it
  // cannot be confused with the `skills/` source. Ignored by git, so it is
  // absent from a clean clone: `--check` skips these entries (a missing target
  // is the expected state, not drift). `prepack` regenerates them before packing.
  { from: 'skills/concept-atlas-dense-explain/SKILL.md', to: 'packaged-skill/SKILL.md', base: 'package', prepack: true },
  { from: 'skills/concept-atlas-dense-explain/references', to: 'packaged-skill/references', base: 'package', prepack: true },
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
  // Prepack-only outputs are gitignored and regenerated at pack time, so a
  // missing copy in a clean checkout is expected rather than drift.
  if (check && entry.prepack) continue;
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
