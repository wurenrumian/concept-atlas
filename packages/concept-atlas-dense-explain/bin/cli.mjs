#!/usr/bin/env node
import { access, constants, copyFile, cp, mkdir, readFile, rm, rename, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { build } from 'vite';
import { fileURLToPath } from 'node:url';
import { validateMdxSource, countBySeverity, detectFeatures, extractPageTitle } from '../template/src/model/validate-content.js';
import { SKINS, normalizeSkin, COMPONENT_STYLES, normalizeStyle } from '../template/src/model/skins.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const templateRoot = path.join(packageRoot, 'template');
let args = process.argv.slice(2);
let buildCounter = 0;

function usage() {
  console.log('Usage:');
  console.log('  npx concept-atlas-dense-explain <input.mdx>... [--mode atlas|scroll] [--skin <id>] [--default-mode dark|light|system] [--style <id>] [-o output.html|dir] [--force] [--concurrency N] [--inline-assets] [--inline-mermaid] [--mermaid-cdn <url>] [--json] [--no-validate]');
  console.log('  npx concept-atlas-dense-explain render <input.mdx>... [-o output.html|dir]');
  console.log('  npx concept-atlas-dense-explain validate <input.mdx> [--mode atlas|scroll] [--strict] [--json]');
  console.log('  npx concept-atlas-dense-explain create <output.mdx> [--mode atlas|scroll] [--force]');
  console.log('  npx concept-atlas-dense-explain guide [--mode atlas|scroll] [-o output.mdx] [--force]');
  console.log('');
  console.log('  --help shows this text; --version prints the package version.');
  console.log('  Multiple inputs build in parallel (default 2 at a time, cap 4); -o is then a directory.');
  console.log('  Figures are kept as relative links by default (small HTML; ship the assets/ dir beside it). --inline-assets bakes every local image into the HTML as base64 instead; a per-tag inline={true|false} on <Figure> overrides that for one image. --link-assets is kept as an explicit alias for the default.');
  console.log('  Mermaid diagrams load from a CDN at runtime by default (fast builds, needs network); --inline-mermaid bakes Mermaid into the HTML for a fully offline single file; --mermaid-cdn overrides the CDN URL.');
  console.log(`  --skin bakes a default palette (${SKINS.map(skin => skin.id).join(', ')}); --default-mode bakes a default dark/light mode; --style bakes a default component style (${COMPONENT_STYLES.map(style => style.id).join(', ')}). Readers can still switch in the UI.`);
}

async function exists(filePath) {
  try { await access(filePath, constants.F_OK); return true; } catch { return false; }
}

/** Byte size of an asset, or null when it does not exist. */
function assetByteSize(filePath) {
  try { return statSync(filePath).size; } catch { return null; }
}

function flagValue(flags, names) {
  for (const name of names) {
    const index = flags.indexOf(name);
    if (index >= 0) return flags[index + 1];
  }
  return null;
}

function fail(message) {
  console.error(message);
  usage();
  process.exit(1);
}

const VALUE_FLAGS = new Set(['--mode', '-o', '--output', '--concurrency', '--skin', '--default-mode', '--style', '--mermaid-cdn']);
const BOOLEAN_FLAGS = new Set(['--force', '--json', '--strict', '--no-validate', '--link-assets', '--inline-assets', '--inline-mermaid', '--help', '-h', '--version', '-v']);
const COMMAND_NAMES = ['help', 'create', 'new', 'render', 'validate', 'guide'];

/** Splits argv into flags, flag values and positional arguments. */
function parseFlags(argv) {
  const flags = new Set();
  const values = new Map();
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (VALUE_FLAGS.has(arg)) {
      values.set(arg, argv[i + 1]);
      i += 1;
    } else if (arg.startsWith('-') && arg.length > 1) {
      flags.add(arg);
    } else {
      positional.push(arg);
    }
  }
  return { flags, values, positional };
}

/**
 * Finds the subcommand even when flags precede it (`--force create x.mdx`),
 * skipping flag values so a value like `create` isn't mistaken for a command.
 * The first non-flag token that isn't a command means `render` with inputs.
 */
function extractCommand(argv) {
  const rest = [...argv];
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (VALUE_FLAGS.has(arg)) { i += 1; continue; }
    if (arg.startsWith('-') && arg.length > 1) continue;
    if (COMMAND_NAMES.includes(arg)) {
      rest.splice(i, 1);
      return { command: arg, rest };
    }
    return { command: 'render', rest };
  }
  return { command: 'render', rest };
}

/**
 * A single input may name an output file; a batch needs a directory, because the
 * per-target file names come from the inputs.
 */
function resolveOutputs(inputs, explicit) {
  const defaults = inputs.map(input => input.replace(/\.mdx$/i, '.html'));
  if (!explicit) return defaults;
  const target = path.resolve(explicit);
  if (inputs.length === 1) return [target];
  if (path.extname(target).toLowerCase() === '.html') {
    fail('`-o` must be a directory when building more than one input.');
  }
  return inputs.map(input => path.join(target, `${path.basename(input, path.extname(input))}.html`));
}

function printDiagnostics(source, options, { json, label = null, quiet = false }) {
  const result = validateMdxSource(source, options);
  if (quiet) return result;
  if (json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return result;
  }
  if (label) console.error(`\n${label}`);
  const { diagnostics, carrier, stats } = result;
  for (const item of diagnostics) {
    const severity = item.severity === 'error' ? 'error' : 'warn ';
    const where = `${item.line}:${item.column}`;
    console.error(`${severity} ${where}  ${item.code}  ${item.message}`);
  }
  const { error, warning } = countBySeverity(diagnostics);
  const scope = carrier ? `${carrier} · ${stats.nodes} 节点 / ${stats.relations} 关系` : '未识别载体';
  if (error) console.error(`校验失败：${error} 个错误，${warning} 个警告（${scope}）`);
  else if (warning) console.error(`校验通过：${warning} 个警告（${scope}）`);
  else console.error(`校验通过：无问题（${scope}）`);
  return result;
}

const { command, rest } = extractCommand(args);
args = rest;

if (args.includes('--help') || args.includes('-h')) { usage(); process.exit(0); }
if (args.includes('--version') || args.includes('-v')) {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  console.log(pkg.version);
  process.exit(0);
}

// Typos like `--mdoe atlas` used to be accepted silently; fail fast instead.
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (VALUE_FLAGS.has(arg)) {
    if (i + 1 >= args.length || (args[i + 1].startsWith('-') && args[i + 1].length > 1)) {
      fail(`Missing value for ${arg}`);
    }
    i += 1;
    continue;
  }
  if (arg.startsWith('-') && arg.length > 1 && !BOOLEAN_FLAGS.has(arg)) {
    fail(`Unknown flag: ${arg}`);
  }
}

if (command === 'help') { usage(); process.exit(0); }

if (command === 'guide') {
  const mode = flagValue(args, ['--mode']) || 'atlas';
  if (!['atlas', 'scroll'].includes(mode)) fail(`Unknown mode: ${mode}`);
  const output = path.resolve(flagValue(args, ['-o', '--output']) || `concept-atlas-${mode}-guide.mdx`);
  if (await exists(output) && !args.includes('--force')) {
    console.error(`Refusing to overwrite ${output}; pass --force to replace it.`);
    process.exit(1);
  }
  const source = path.join(templateRoot, 'references', `${mode}-guide.mdx`);
  if (!(await exists(source))) {
    console.error(`Guide for mode "${mode}" is missing from the package.`);
    process.exit(1);
  }
  await mkdir(path.dirname(output), { recursive: true });
  await copyFile(source, output);
  const assetsSource = path.join(templateRoot, 'references', 'assets');
  const assetsTarget = path.join(path.dirname(output), 'assets');
  if (await exists(assetsSource) && path.resolve(assetsSource) !== path.resolve(assetsTarget) && (args.includes('--force') || !(await exists(assetsTarget)))) {
    await cp(assetsSource, assetsTarget, { recursive: true, force: true });
    console.log(`Copied guide assets to ${assetsTarget}`);
  }
  console.log(`Wrote ${mode} component guide: ${output}`);
  console.log('Read it to learn every component and its props, then write your own MDX.');
  process.exit(0);
}

if (command === 'create' || command === 'new') {
  const output = args[0] ? path.resolve(args[0]) : null;
  const mode = flagValue(args, ['--mode']) || 'atlas';
  if (!output || path.extname(output).toLowerCase() !== '.mdx' || !['atlas', 'scroll'].includes(mode)) {
    usage();
    process.exit(1);
  }
  if (await exists(output) && !args.includes('--force')) {
    console.error(`Refusing to overwrite ${output}; pass --force to replace it.`);
    process.exit(1);
  }
  await mkdir(path.dirname(output), { recursive: true });
  const template = mode === 'atlas' ? `\
{/* shell 的 title 会成为浏览器标签页标题；页面图标固定为 📃。请把“主题名称”改成真实标题。 */}
<ExplainPage id="topic-id" title="主题名称" summary="用一句话说明这个主题解决什么问题。">
  <ConceptGraph root="root-node">
    <ConceptNode id="root-node" title="核心概念" level="L0" summary="给读者建立整体认知。">
      <Overview>先用直觉解释这个主题是什么，以及为什么值得理解。</Overview>
      <Definition>给出准确、可检查的定义。</Definition>
      <Mechanism>说明输入如何经过关键步骤，产生什么输出或结果。</Mechanism>
      <Boundary>说明适用范围、限制条件和容易混淆的反例。</Boundary>
      <Children><ConceptRef id="first-branch" /><ConceptRef id="second-branch" /></Children>
    </ConceptNode>

    <ConceptNode id="first-branch" title="第一条关键分支" level="L1" parent="root-node" summary="第一条关键分支解决什么问题，以及它为什么值得先理解。">
      <Overview>解释第一个重要组成部分。</Overview>
      <Example title="典型例子">填写一个具体例子，帮助读者验证理解。</Example>
      <CodeBlock language="bash" title="验证方式" code="npm run validate" lineNumbers />
    </ConceptNode>

    <ConceptNode id="second-branch" title="第二条关键分支" level="L1" parent="root-node" summary="第二条关键分支解决什么问题，以及它和第一条分支如何配合。">
      <Overview>解释第二个重要组成部分。</Overview>
      <Boundary>填写它的边界、代价或常见误区。</Boundary>
    </ConceptNode>

    <Relation from="first-branch" to="second-branch" type="depends-on" label="依赖" />
  </ConceptGraph>
</ExplainPage>
` : `\
{/* shell 的 title 会成为浏览器标签页标题；页面图标固定为 📃。请把“主题名称”改成真实标题。 */}
<ScrollDocument>
  <ScrollHeader title="主题名称">用一两句话说明主题、背景和读者应该带走的判断。</ScrollHeader>

  <ScrollSection title="先建立整体认知">
    <ScrollProse>先解释主题是什么、解决什么问题，以及它和相邻概念的区别。</ScrollProse>
    <Insight title="核心判断">填写这篇文章最重要、最值得记住的一句话。</Insight>
  </ScrollSection>

  <ScrollSection title="解释关键机制">
    <ScrollProse>按输入、步骤、输出的顺序解释过程，不要只罗列名词。</ScrollProse>
    <Flow title="处理流程" steps={[{title:'输入',description:'原始条件或数据'},{title:'处理',description:'关键变化或判断'},{title:'输出',description:'结果与可观察证据'}]} />
    <CodeBlock language="bash" title="实践命令" code="npm run validate" caption="通用代码块可以放在任意章节；需要逐行讲解时加 lineNumbers。" />
  </ScrollSection>

  <ScrollSection title="边界与实践">
    <ScrollGrid columns="2">
      <Boundary>填写适用范围、限制条件和反例。</Boundary>
      <Example title="典型案例">填写一个能验证前文解释的具体案例。</Example>
    </ScrollGrid>
  </ScrollSection>
</ScrollDocument>
`;
  await writeFile(output, template, 'utf8');
  console.log(`Created ${mode} MDX template: ${output}`);
  console.log(`Tip: run "npx concept-atlas-dense-explain guide --mode ${mode}" for a full component reference.`);
  process.exit(0);
}

const parsed = parseFlags(args);
const json = parsed.flags.has('--json');
const strict = parsed.flags.has('--strict');
const skipValidate = parsed.flags.has('--no-validate');
const force = parsed.flags.has('--force');
const linkAssets = parsed.flags.has('--link-assets');
const inlineAssets = parsed.flags.has('--inline-assets');
if (linkAssets && inlineAssets) {
  fail('--link-assets and --inline-assets are mutually exclusive (linking is the default).');
}
const inlineMermaid = parsed.flags.has('--inline-mermaid');
const mermaidCdn = parsed.values.get('--mermaid-cdn') || null;
const modeFlag = parsed.values.get('--mode') || null;

// Compile-time appearance defaults. Invalid values fail fast with the valid
// options instead of silently baking a broken default into every page.
let skinFlag = null;
if (parsed.values.has('--skin')) {
  skinFlag = normalizeSkin(parsed.values.get('--skin'));
  if (!skinFlag) fail(`Unknown skin: ${parsed.values.get('--skin')} (available: ${SKINS.map(skin => skin.id).join(', ')})`);
}
let defaultModeFlag = null;
if (parsed.values.has('--default-mode')) {
  const raw = parsed.values.get('--default-mode');
  if (!['dark', 'light', 'system'].includes(raw)) fail(`Invalid --default-mode: ${raw} (use dark, light or system)`);
  defaultModeFlag = raw;
}
let styleFlag = null;
if (parsed.values.has('--style')) {
  styleFlag = normalizeStyle(parsed.values.get('--style'));
  if (!styleFlag) fail(`Unknown component style: ${parsed.values.get('--style')} (available: ${COMPONENT_STYLES.map(style => style.id).join(', ')})`);
}

if (command === 'validate') {
  const target = parsed.positional[0] ? path.resolve(parsed.positional[0]) : null;
  if (!target || path.extname(target).toLowerCase() !== '.mdx' || !(await exists(target))) {
    fail('Provide an existing .mdx file to validate.');
  }
  const source = await readFile(target, 'utf8');
  const result = printDiagnostics(source, {
    filePath: target,
    mode: modeFlag,
    strict,
    inlineAssets,
    assetExists: spec => existsSync(path.resolve(path.dirname(target), spec)),
    assetSize: spec => assetByteSize(path.resolve(path.dirname(target), spec)),
  }, { json });
  process.exit(countBySeverity(result.diagnostics).error ? 1 : 0);
}

// `render` is the default command, so it may still appear as a leading token.
const positional = parsed.positional[0] && parsed.positional[0].toLowerCase() === 'render'
  ? parsed.positional.slice(1)
  : parsed.positional;
const inputs = positional.map(entry => path.resolve(entry));

if (!inputs.length) {
  console.error('Provide at least one existing .mdx input file.');
  usage();
  process.exit(1);
}
for (const input of inputs) {
  if (path.extname(input).toLowerCase() !== '.mdx' || !(await exists(input))) {
    console.error(`Not an existing .mdx input: ${input}`);
    process.exit(1);
  }
}

const outputs = resolveOutputs(inputs, parsed.values.get('-o') || parsed.values.get('--output'));

for (const output of outputs) {
  if (await exists(output) && !force) {
    console.error(`Refusing to overwrite ${output}; pass --force to replace it.`);
    process.exit(1);
  }
}

const multi = inputs.length > 1;
const sources = await Promise.all(inputs.map(input => readFile(input, 'utf8')));

// Validate every document before building any of them: a batch should fail as a
// batch rather than leaving half the targets rendered.
const validations = sources.map((source, index) => printDiagnostics(source, {
  filePath: inputs[index],
  mode: modeFlag,
  strict,
  inlineAssets,
  assetExists: spec => existsSync(path.resolve(path.dirname(inputs[index]), spec)),
  assetSize: spec => assetByteSize(path.resolve(path.dirname(inputs[index]), spec)),
}, json
  ? { json: false, quiet: true }
  : { json: false, label: multi ? inputs[index] : null }));

if (json) {
  const payload = multi
    ? validations.map((result, index) => ({ file: inputs[index], ...result }))
    : validations[0];
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

const errorCount = validations.reduce((sum, result) => sum + countBySeverity(result.diagnostics).error, 0);
if (errorCount && !skipValidate) {
  console.error('内容校验未通过，已停止构建。修复后重试，或用 --no-validate 强制构建。');
  process.exit(1);
}

const jobs = inputs.map((input, index) => {
  const mode = modeFlag || validations[index].carrier;
  if (!mode || !['atlas', 'scroll'].includes(mode)) {
    console.error(`Could not detect the MDX carrier for ${input}; choose --mode atlas or --mode scroll.`);
    process.exit(1);
  }
  // Figures link by default. If the HTML is written outside the MDX's directory
  // its relative image paths no longer resolve, so warn unless --inline-assets
  // bakes them in.
  if (!inlineAssets && path.resolve(path.dirname(outputs[index])) !== path.resolve(path.dirname(input))) {
    console.error(`警告：默认外链图片，但 ${outputs[index]} 不在 ${path.dirname(input)} 内，相对图片路径会失效；请用 --inline-assets，或把 assets/ 一并放到输出目录。`);
  }
  return { input, output: outputs[index], mode, title: extractPageTitle(sources[index]), features: detectFeatures(sources[index]), inlineAssets };
});

const limit = clampConcurrency(parsed.values.get('--concurrency'), jobs.length);
const started = Date.now();
const results = await runPool(jobs.map(job => () => buildOne(job)), limit);

const failures = results.filter(result => !result.ok);
const saved = summarizeFeatures(jobs, results);
console.log(`Built ${results.length - failures.length}/${results.length} page(s) with concurrency ${limit} in ${((Date.now() - started) / 1000).toFixed(1)}s${saved ? ` (${saved})` : ''}.`);
if (failures.length) {
  for (const failure of failures) console.error(`Build failed for ${failure.input}:`, failure.error);
  process.exit(1);
}

async function buildOne(job) {
  const { input, output, mode, title, features, inlineAssets: inline } = job;
  const templateEntry = mode === 'atlas' ? 'index.html' : 'scroll.html';
  // Each build gets its own scratch outDir: the template always writes
  // `index.html`/`scroll.html`, so concurrent builds sharing a directory would
  // overwrite each other before the rename.
  const scratch = path.join(path.dirname(output), `.concept-atlas-${process.pid}-${(buildCounter += 1)}`);
  await mkdir(path.dirname(output), { recursive: true });
  await mkdir(scratch, { recursive: true });
  const define = { __ATLAS_FEATURES__: JSON.stringify(features) };
  // 'false' is the default (link); only --inline-assets sets 'true'.
  define.__ATLAS_INLINE_ASSETS__ = inline ? 'true' : 'false';
  if (title) define.__ATLAS_PAGE_TITLE__ = JSON.stringify(title);
  if (skinFlag) define.__ATLAS_DEFAULT_SKIN__ = JSON.stringify(skinFlag);
  if (defaultModeFlag) define.__ATLAS_DEFAULT_MODE__ = JSON.stringify(defaultModeFlag);
  if (styleFlag) define.__ATLAS_DEFAULT_STYLE__ = JSON.stringify(styleFlag);
  if (features.mermaid) {
    define.__ATLAS_MERMAID_MODE__ = JSON.stringify(inlineMermaid ? 'inline' : 'cdn');
    if (mermaidCdn) define.__ATLAS_MERMAID_CDN_URL__ = JSON.stringify(mermaidCdn);
  }
  try {
    await build({
      root: templateRoot,
      configFile: path.join(templateRoot, 'vite.config.js'),
      resolve: { alias: { '@concept-atlas/content': input } },
      define,
      build: {
        outDir: scratch,
        emptyOutDir: false,
        rollupOptions: { input: path.join(templateRoot, templateEntry) },
      },
    });
    // Swap the new build in without a window where no output exists: on
    // POSIX rename replaces atomically; the fallback path (Windows can refuse
    // to overwrite a locked file) moves the old output aside first and
    // restores it if the swap fails, instead of rm-ing it up front.
    const built = path.join(scratch, templateEntry);
    try {
      await rename(built, output);
    } catch (error) {
      if (error.code !== 'EEXIST' && error.code !== 'EPERM' && error.code !== 'EACCES') throw error;
      const backup = `${output}.bak-${process.pid}-${Date.now()}`;
      let hasBackup = false;
      try {
        await rename(output, backup);
        hasBackup = true;
      } catch (backupError) {
        if (backupError.code !== 'ENOENT') throw backupError; // old output kept, swap aborted
      }
      try {
        await rename(built, output);
      } catch (swapError) {
        if (hasBackup) await rename(backup, output);
        throw swapError;
      }
      if (hasBackup) await rm(backup, { force: true });
    }
    console.log(`Built ${mode} HTML: ${output}${title ? `  [tab: ${title}]` : ''}${describeFeatures(features)}${inline ? '  [figures inlined]' : '  [figures linked]'}`);
    return { ok: true, input, output };
  } catch (error) {
    return { ok: false, input, output, error };
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}

/** Saves the mermaid/KaTeX payload when a document never renders them. */
function describeFeatures(features) {
  const tags = [];
  if (features.mermaid) tags.push(inlineMermaid ? 'mermaid inline' : 'mermaid cdn');
  if (features.math) tags.push('KaTeX');
  return tags.length ? `  [${tags.join(', ')}]` : '';
}

function summarizeFeatures(jobs, results) {
  const built = new Set(results.filter(result => result.ok).map(result => result.input));
  const pages = jobs.filter(job => built.has(job.input));
  if (!pages.length) return '';
  const droppedMath = pages.filter(job => !job.features.math).length;
  const droppedMermaid = pages.filter(job => !job.features.mermaid).length;
  const cdnMermaid = pages.filter(job => job.features.mermaid && !inlineMermaid).length;
  const parts = [];
  if (cdnMermaid) parts.push(`Mermaid via CDN on ${cdnMermaid}/${pages.length}`);
  if (droppedMath) parts.push(`KaTeX dropped on ${droppedMath}/${pages.length}`);
  if (droppedMermaid) parts.push(`Mermaid dropped on ${droppedMermaid}/${pages.length}`);
  return parts.join(', ');
}

function clampConcurrency(raw, count) {
  const parsedValue = Number.parseInt(raw ?? '', 10);
  const fallback = Math.min(2, count);
  if (!Number.isFinite(parsedValue)) return Math.max(1, fallback);
  return Math.max(1, Math.min(4, parsedValue));
}

/** Runs `tasks` with at most `limit` in flight, preserving result order. */
async function runPool(tasks, limit) {
  const results = new Array(tasks.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, async () => {
    for (;;) {
      const index = cursor;
      cursor += 1;
      if (index >= tasks.length) return;
      results[index] = await tasks[index]();
    }
  });
  await Promise.all(workers);
  return results;
}
