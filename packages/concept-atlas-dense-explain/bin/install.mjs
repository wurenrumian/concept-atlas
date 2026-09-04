#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(packageRoot, 'skill');
const args = process.argv.slice(2);
const targetArg = args.find(arg => arg.startsWith('--target='))?.slice('--target='.length);
const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
const target = path.resolve(targetArg || path.join(codexHome, 'skills', 'concept-atlas-dense-explain'));

await fs.mkdir(target, { recursive: true });
await fs.cp(source, target, { recursive: true, force: true });
console.log(`Installed concept-atlas-dense-explain to ${target}`);
console.log('The skill includes a self-contained template under assets/template.');
