import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const contentPath = path.join(rootDir, 'content', 'compile-runtime.mdx');
const source = fs.readFileSync(contentPath, 'utf8');
const failures = [];
const nodePattern = /<ConceptNode\b([^>]*)>([\s\S]*?)<\/ConceptNode>/g;
const relationPattern = /<Relation\b([^>]*)\/>/g;
const attributes = text => Object.fromEntries([...text.matchAll(/([\w-]+)=(?:"([^"]*)"|'([^']*)')/g)].map(match => [match[1], match[2] ?? match[3] ?? '']));
const nodes = [...source.matchAll(nodePattern)].map(match => ({ ...attributes(match[1]), body: match[2] }));
const relations = [...source.matchAll(relationPattern)].map(match => attributes(match[1]));
const ids = new Set(nodes.map(node => node.id));
const allowedRelations = new Set(['prerequisite', 'causes', 'produces', 'uses', 'implements', 'contrasts', 'depends-on', 'exception-of', 'precedes']);

if (!source.includes('<ExplainPage')) failures.push('missing ExplainPage');
if (!source.includes('<ConceptGraph')) failures.push('missing ConceptGraph');
if (nodes.filter(node => node.level === 'L0').length !== 1) failures.push('expected exactly one L0 root');
if (nodes.filter(node => node.level === 'L1').length < 4) failures.push('expected at least four L1 branches');
if (nodes.length < 15) failures.push(`expected at least 15 nodes, found ${nodes.length}`);
if (!nodes.some(node => ['L3', 'L4'].includes(node.level))) failures.push('expected L3 or L4 depth');
if (relations.length < 8) failures.push(`expected at least 8 relations, found ${relations.length}`);

for (const node of nodes) {
  if (!node.id) failures.push('node is missing id');
  if (!node.title) failures.push(`${node.id || '<unknown>'} is missing title`);
  if (!node.summary) failures.push(`${node.id || '<unknown>'} is missing summary`);
  if (node.parent && !ids.has(node.parent)) failures.push(`${node.id} references missing parent ${node.parent}`);
  if (!/(<(Definition|Mechanism|Example|Evidence|Boundary|Details|Callout|Counterexample|Glossary|Input|Output)\b)/.test(node.body)) {
    failures.push(`${node.id} lacks a core semantic component`);
  }
}

for (const relation of relations) {
  if (!ids.has(relation.from) || !ids.has(relation.to)) failures.push(`relation references missing node: ${relation.from} -> ${relation.to}`);
  if (!allowedRelations.has(relation.type)) failures.push(`unsupported relation type: ${relation.type}`);
  if (!relation.label) failures.push(`relation ${relation.from} -> ${relation.to} is missing label`);
}

if (failures.length) {
  console.error('Concept Atlas content validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Concept Atlas content validation passed (${nodes.length} nodes, ${relations.length} relations).`);
