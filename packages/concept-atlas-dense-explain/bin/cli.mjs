#!/usr/bin/env node
import { cp, mkdir, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const templateRoot = path.join(packageRoot, 'template');
const [command = 'help', targetArg, ...flags] = process.argv.slice(2);
const target = targetArg ? path.resolve(targetArg) : null;

function usage() {
  console.log('Usage:');
  console.log('  npx concept-atlas-dense-explain init <target> [--force]');
  console.log('  npx concept-atlas-dense-explain build <target>');
}

async function exists(filePath) {
  try { await access(filePath, constants.F_OK); return true; } catch { return false; }
}

if (!['init', 'build', 'help'].includes(command) || command === 'help') {
  usage();
  process.exit(command === 'help' ? 0 : 1);
}

if (!target) {
  usage();
  process.exit(1);
}

if (command === 'init') {
  const packageFile = path.join(target, 'package.json');
  if (await exists(packageFile) && !flags.includes('--force')) {
    console.error(`Refusing to overwrite ${packageFile}; pass --force to replace the template.`);
    process.exit(1);
  }
  await mkdir(target, { recursive: true });
  await cp(templateRoot, target, { recursive: true, force: true });
  console.log(`Initialized Concept Atlas project at ${target}`);
  process.exit(0);
}

if (!(await exists(path.join(target, 'package.json')))) {
  console.error(`No Concept Atlas project found at ${target}; run init first.`);
  process.exit(1);
}

const npmCommand = 'npm';
for (const args of [['install'], ['run', 'build']]) {
  const result = spawnSync(npmCommand, args, {
    cwd: target,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.error) {
    console.error(`Failed to run npm: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}
