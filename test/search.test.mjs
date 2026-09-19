import test from 'node:test';
import assert from 'node:assert/strict';
import { collectText, nodeSearchText, searchNodes } from '../src/app/search.js';

const node = {
  id: 'loader',
  title: '动态链接器',
  summary: '在程序启动前解析共享库依赖。',
  definition: '装载器把可执行文件与共享库映射到进程地址空间。',
  overview: '启动阶段的关键组件。',
  mechanism: '读取 ELF 头 → 递归加载依赖 → 重定位符号。',
  input: 'ELF 可执行文件',
  output: '已重定位的进程映像',
  prerequisites: ['ELF 格式', '虚拟内存'],
  examples: [{ title: 'ldd 输出', content: 'libc.so.6 => /lib/libc.so.6' }],
  counterexamples: [],
  boundaries: [{ title: '版本不兼容', content: '符号版本不匹配时启动失败' }],
  glossary: [{ term: '重定位', definition: '把符号引用绑定到实际地址' }],
  implementation: { language: 'c', title: '代码', code: 'dlopen("libm.so")' },
  customSections: [{ props: { symptom: '启动即退出', cause: '共享库缺失', evidence: 'loader error / ldd' } }],
};

test('nodeSearchText indexes semantic fields', () => {
  const text = nodeSearchText(node);
  assert.match(text, /动态链接器/);
  assert.match(text, /重定位/);
  assert.match(text, /libc\.so\.6/);
  assert.match(text, /dlopen/);
  assert.match(text, /elf 格式/);
});

test('nodeSearchText reaches into customSections (failure symptoms)', () => {
  const text = nodeSearchText(node);
  assert.match(text, /共享库缺失/);
  assert.match(text, /loader error/);
});

test('searchNodes matches by substring and respects the limit', () => {
  const other = { id: 'cpu', title: 'CPU 取指', summary: '无关内容' };
  assert.deepEqual(searchNodes([node, other], '动态').map(n => n.id), ['loader']);
  assert.equal(searchNodes([node, other], '').length, 0);
  assert.equal(searchNodes([node, other], 'elf').length, 1);
  assert.equal(searchNodes([node, other], '无关', 1).length, 1);
});

test('collectText flattens arrays, prop objects and nested children', () => {
  assert.equal(collectText(['a', ['b', 'c']]).includes('b'), true);
  assert.equal(collectText({ symptom: 'x', nested: { deep: 'y' } }).includes('y'), true);
  assert.equal(collectText(undefined), '');
  assert.equal(collectText(true), '');
});

test('nodeSearchText indexes structured evidence fields and the kind label', () => {
  const structured = {
    id: 'abi-break',
    title: 'ABI 破坏',
    kind: 'failure',
    level: 'L4',
    invariants: [{ title: '链接不变量', content: '符号引用必须唯一确定' }],
    evidence: [{ command: 'readelf -Ws', observes: '查看符号版本' }],
    failureModes: [{ symptom: '首次调用崩溃', cause: '布局不一致', evidence: 'sizeof 差异', remedy: '固定布局' }],
    tradeoffs: [{ title: '兼容性', options: [{ name: '重新编译', benefit: '简单', cost: '需重新发布' }] }],
    learningObjectives: ['识别 ABI 边界'],
    keyQuestions: [{ content: '为什么能链接却不能调用？' }],
    customSections: [],
  };
  const text = nodeSearchText(structured);
  assert.match(text, /符号引用必须唯一确定/);
  assert.match(text, /readelf -ws/);
  assert.match(text, /首次调用崩溃/);
  assert.match(text, /重新发布/);
  assert.match(text, /识别 abi 边界/);
  assert.match(text, /为什么能链接却不能调用/);
  assert.match(text, /failure/);
  assert.match(text, /故障/);
  assert.deepEqual(searchNodes([structured], '故障').map(n => n.id), ['abi-break']);
});
