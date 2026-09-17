export const RELATION_TYPES = {
  'parent-child': {
    label: '父子层级',
    description: '表达概念归属与分解层级',
    color: 'var(--rel-parent-child)',
    strokeDasharray: 'none',
    hasArrow: true,
    isTree: true
  },
  'prerequisite': {
    label: '前置知识',
    description: '理解当前概念所需的前置基础',
    color: 'var(--rel-prerequisite)',
    strokeDasharray: '4 4',
    hasArrow: true,
    isTree: false
  },
  'causes': {
    label: '因果推动',
    description: '引起或触发后续状态变化',
    color: 'var(--rel-causes)',
    strokeDasharray: 'none',
    hasArrow: true,
    isTree: false
  },
  'produces': {
    label: '产出生成',
    description: '阶段处理后产出的产物或实体',
    color: 'var(--rel-produces)',
    strokeDasharray: 'none',
    hasArrow: true,
    isTree: false
  },
  'uses': {
    label: '消费使用',
    description: '调用或引用其他概念与数据',
    color: 'var(--rel-uses)',
    strokeDasharray: '6 3',
    hasArrow: true,
    isTree: false
  },
  'implements': {
    label: '实现关系',
    description: '具体机制或代码实现特定抽象',
    color: 'var(--rel-implements)',
    strokeDasharray: 'none',
    hasArrow: true,
    isTree: false
  },
  'contrasts': {
    label: '对比关系',
    description: '概念间的异同对照或对立维度',
    color: 'var(--rel-contrasts)',
    strokeDasharray: '2 2',
    hasArrow: false,
    isTree: false
  },
  'depends-on': {
    label: '依赖关系',
    description: '运行或生效依赖外部条件',
    color: 'var(--rel-depends-on)',
    strokeDasharray: '5 5',
    hasArrow: true,
    isTree: false
  },
  'exception-of': {
    label: '异常/反例',
    description: '特殊情况、破坏假定的边界或反例',
    color: 'var(--rel-exception-of)',
    strokeDasharray: '3 3',
    hasArrow: true,
    isTree: false
  },
  'precedes': {
    label: '时序先后',
    description: '时间或处理流水线的前后相继',
    color: 'var(--rel-precedes)',
    strokeDasharray: 'none',
    hasArrow: true,
    isTree: false
  }
};

export const LEVEL_DEFS = {
  L0: { name: '全局概览', tag: 'L0 · 全局概览', desc: '系统全貌与全局定位', color: 'var(--level-l0)' },
  L1: { name: '主要阶段 / 子系统', tag: 'L1 · 子系统', desc: '主要生命周期阶段或子系统划分', color: 'var(--level-l1)' },
  L2: { name: '局部机制', tag: 'L2 · 局部机制', desc: '具体工作机制与逻辑流动', color: 'var(--level-l2)' },
  L3: { name: '实现细节', tag: 'L3 · 实现细节', desc: '算法、数据结构或代码实现', color: 'var(--level-l3)' },
  L4: { name: '边界与反例', tag: 'L4 · 边界反例', desc: '边界情况、异常分支与典型反例', color: 'var(--level-l4)' }
};
