import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import postcss from 'postcss';
import { parse } from '@babel/parser';

/**
 * Dead-CSS audit for Concept Atlas.
 *
 * Answers "which class rules can no component ever emit?" by comparing the
 * class selectors in the stylesheets against every class token the source can
 * produce. JS/JSX is parsed to a real AST (regex string-scanning is unreliable
 * — apostrophes in prose swallow whole spans), and template literals contribute
 * a prefix for each dynamic part (`tone-${x}` marks the `tone-` family).
 *
 * This is deliberately static: it finds rules no code path can emit, which is
 * the common kind of dead CSS. It cannot prove a rule never *renders* (that
 * needs runtime coverage), and third-party classes injected at runtime are
 * allowlisted below.
 *
 * Usage: node scripts/css-usage-audit.mjs [--json]
 */
export function auditCss({ root = process.cwd() } = {}) {
  function walk(dir, exts, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (['node_modules', '.git', 'dist', 'tmp'].includes(entry.name)) continue;
        walk(full, exts, out);
      } else if (exts.some(ext => entry.name.endsWith(ext))) {
        out.push(full);
      }
    }
    return out;
  }

  const rel = file => path.relative(root, file).replace(/\\/g, '/');
  const TOKEN_SPLIT = /[\s,;(){}[\]<>'"]+/;

  function tokensFrom(text) {
    const out = [];
    for (const token of String(text).split(TOKEN_SPLIT)) {
      if (token && /[A-Za-z]/.test(token)) out.push(token);
    }
    return out;
  }

  // --- 1. Class selectors from the stylesheets ------------------------------
  const cssClasses = new Map(); // class -> Set(files)
  for (const file of walk(path.join(root, 'src', 'styles'), ['.css'])) {
    const rootNode = postcss.parse(fs.readFileSync(file, 'utf8'), { from: file });
    rootNode.walkRules(rule => {
      // Keyframe steps (`from`, `0%`) are not class selectors.
      if (rule.parent && rule.parent.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
      for (const selector of rule.selectors || []) {
        for (const match of selector.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) {
          const cls = match[1];
          if (!cssClasses.has(cls)) cssClasses.set(cls, new Set());
          cssClasses.get(cls).add(rel(file));
        }
      }
    });
  }

  // --- 2. Class tokens the app can emit -------------------------------------
  const referenced = new Set();
  const dynamicPrefixes = new Set();

  function walkAst(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'StringLiteral') {
      for (const token of tokensFrom(node.value)) referenced.add(token);
    } else if (node.type === 'TemplateLiteral') {
      node.quasis.forEach((quasi, index) => {
        for (const token of tokensFrom(quasi.value.raw)) referenced.add(token);
        // The quasi before an expression is the dynamic prefix: `tone-${x}`.
        if (index < node.expressions.length) {
          const trailing = quasi.value.raw.match(/([\w-]+)$/);
          if (trailing) dynamicPrefixes.add(trailing[1]);
        }
      });
    }
    for (const key of Object.keys(node)) {
      if (['loc', 'start', 'end', 'range', 'leadingComments', 'trailingComments', 'innerComments'].includes(key)) continue;
      const value = node[key];
      if (Array.isArray(value)) value.forEach(walkAst);
      else if (value && typeof value === 'object' && typeof value.type === 'string') walkAst(value);
    }
  }

  const codeFiles = [
    ...walk(path.join(root, 'src'), ['.js', '.jsx']),
    path.join(root, 'index.html'),
    path.join(root, 'scroll.html'),
  ];
  for (const file of codeFiles) {
    if (!fs.existsSync(file)) continue;
    const source = fs.readFileSync(file, 'utf8');
    if (file.endsWith('.js') || file.endsWith('.jsx')) {
      const ast = parse(source, { sourceType: 'module', plugins: ['jsx', 'classProperties'] });
      walkAst(ast.program);
    } else {
      for (const match of source.matchAll(/class(?:Name)?\s*=\s*["']([^"']*)["']/g)) {
        for (const token of tokensFrom(match[1])) referenced.add(token);
      }
    }
  }
  // MDX carries JSX props, not usually raw classes, but scan className defensively.
  for (const file of walk(path.join(root, 'content'), ['.mdx'])) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/className\s*=\s*["']([^"']*)["']/g)) {
      for (const token of tokensFrom(match[1])) referenced.add(token);
    }
  }

  // Classes injected by third-party renderers (KaTeX, Mermaid) or by the browser
  // itself; they never appear in our source but are legitimately used.
  const ALLOW = new Set([
    'katex', 'katex-display', 'katex-html', 'katex-mathml',
  ]);

  const orphans = [...cssClasses.keys()]
    .filter(cls => !ALLOW.has(cls))
    .filter(cls => !referenced.has(cls))
    .filter(cls => ![...dynamicPrefixes].some(prefix => cls.startsWith(prefix)))
    .sort();

  return { cssClasses, referenced, dynamicPrefixes, orphans };
}

function main() {
  const asJson = process.argv.includes('--json');
  const { cssClasses, referenced, dynamicPrefixes, orphans } = auditCss();

  if (asJson) {
    console.log(JSON.stringify({
      cssClasses: cssClasses.size,
      referenced: referenced.size,
      dynamicPrefixes: [...dynamicPrefixes].filter(p => p.length > 1).sort(),
      orphans: orphans.map(cls => ({ cls, files: [...cssClasses.get(cls)] })),
    }, null, 2));
  } else {
    console.log(`css class selectors : ${cssClasses.size}`);
    console.log(`referenced tokens   : ${referenced.size}`);
    console.log(`dynamic prefixes    : ${[...dynamicPrefixes].filter(p => p.length > 1).sort().join(', ') || '(none)'}`);
    console.log(`orphan candidates   : ${orphans.length}`);
    for (const cls of orphans) {
      console.log(`  - .${cls}  (${[...cssClasses.get(cls)].join(', ')})`);
    }
  }
}

// Run only when invoked as a script, so tests can import `auditCss` directly.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
