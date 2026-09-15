#!/usr/bin/env node
import { access, constants, mkdir, readFile, rm, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'vite';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const templateRoot = path.join(packageRoot, 'template');
const args = process.argv.slice(2);

function usage() {
  console.log('Usage:');
  console.log('  npx concept-atlas-dense-explain <input.mdx> [--mode atlas|scroll] [-o output.html] [--force]');
  console.log('  npx concept-atlas-dense-explain render <input.mdx> [--mode atlas|scroll] [-o output.html] [--force]');
  console.log('  npx concept-atlas-dense-explain create <output.mdx> [--mode atlas|scroll] [--force]');
}

async function exists(filePath) {
  try { await access(filePath, constants.F_OK); return true; } catch { return false; }
}

function flagValue(flags, names) {
  for (const name of names) {
    const index = flags.indexOf(name);
    if (index >= 0) return flags[index + 1];
  }
  return null;
}

const command = ['help', 'create', 'new', 'render'].includes(args[0]) ? args.shift() : 'render';

if (command === 'help') { usage(); process.exit(0); }

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
<ExplainPage id="topic-id" title="主题名称" summary="用一句话说明这个主题解决什么问题。">
  <ConceptGraph root="root-node">
    <ConceptNode id="root-node" title="核心概念" level="L0" summary="给读者建立整体认知。">
      <Overview>先用直觉解释这个主题是什么，以及为什么值得理解。</Overview>
      <Definition>给出准确、可检查的定义。</Definition>
      <Mechanism>说明输入如何经过关键步骤，产生什么输出或结果。</Mechanism>
      <Boundary>说明适用范围、限制条件和容易混淆的反例。</Boundary>
      <Children><ConceptRef id="first-branch" /><ConceptRef id="second-branch" /></Children>
    </ConceptNode>

    <ConceptNode id="first-branch" title="第一条关键分支" level="L1" parent="root-node">
      <Overview>解释第一个重要组成部分。</Overview>
      <Example title="典型例子">填写一个具体例子，帮助读者验证理解。</Example>
    </ConceptNode>

    <ConceptNode id="second-branch" title="第二条关键分支" level="L1" parent="root-node">
      <Overview>解释第二个重要组成部分。</Overview>
      <Boundary>填写它的边界、代价或常见误区。</Boundary>
    </ConceptNode>

    <Relation from="first-branch" to="second-branch" type="depends-on" label="依赖" />
  </ConceptGraph>
</ExplainPage>
` : `\
<ScrollDocument>
  <ScrollHeader title="主题名称">用一两句话说明主题、背景和读者应该带走的判断。</ScrollHeader>

  <ScrollSection title="先建立整体认知">
    <ScrollProse>先解释主题是什么、解决什么问题，以及它和相邻概念的区别。</ScrollProse>
    <Insight title="核心判断">填写这篇文章最重要、最值得记住的一句话。</Insight>
  </ScrollSection>

  <ScrollSection title="解释关键机制">
    <ScrollProse>按输入、步骤、输出的顺序解释过程，不要只罗列名词。</ScrollProse>
    <Flow title="处理流程" steps={[{title:'输入',description:'原始条件或数据'},{title:'处理',description:'关键变化或判断'},{title:'输出',description:'结果与可观察证据'}]} />
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
  process.exit(0);
}

if (args[0] && args[0].toLowerCase() === 'render') args.shift();
const input = args[0] ? path.resolve(args[0]) : null;
const modeFlag = flagValue(args, ['--mode']);
const output = path.resolve(flagValue(args, ['-o', '--output']) || (input ? input.replace(/\.mdx$/i, '.html') : ''));
const force = args.includes('--force');

if (!input || path.extname(input).toLowerCase() !== '.mdx' || !(await exists(input))) {
  console.error('Provide an existing .mdx input file.');
  usage();
  process.exit(1);
}

const source = await readFile(input, 'utf8');
const mode = modeFlag || (/<ScrollDocument\b/.test(source) ? 'scroll' : /<ExplainPage\b|<ConceptGraph\b/.test(source) ? 'atlas' : null);
if (!mode || !['atlas', 'scroll'].includes(mode)) {
  console.error('Could not detect the MDX carrier; choose --mode atlas or --mode scroll.');
  process.exit(1);
}
if (await exists(output) && !force) {
  console.error(`Refusing to overwrite ${output}; pass --force to replace it.`);
  process.exit(1);
}
await mkdir(path.dirname(output), { recursive: true });

const templateEntry = mode === 'atlas' ? 'index.html' : 'scroll.html';
const generatedEntry = path.join(path.dirname(output), templateEntry);

try {
  await build({
    root: templateRoot,
    configFile: path.join(templateRoot, 'vite.config.js'),
    resolve: { alias: { '@concept-atlas/content': input } },
    build: {
      outDir: path.dirname(output),
      emptyOutDir: false,
      rollupOptions: { input: path.join(templateRoot, templateEntry) },
    },
  });
  if (generatedEntry !== output) {
    await rm(output, { force: true });
    await rename(generatedEntry, output);
  }
  console.log(`Built ${mode} HTML: ${output}`);
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
