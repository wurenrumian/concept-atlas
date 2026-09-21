# Concept Atlas 使用体验改进请求

## 目标

在现有“概念探索 + 知识网络”框架之上，提升知识内容的可发现性、可理解性、可验证性与可维护性。

重点不是继续增加装饰性卡片，而是让每个知识节点能够清楚回答：

1. 它是什么？
2. 它依赖什么？
3. 如何观察它？
4. 出错时如何定位？

## 一、交互体验改进

### 1. 全局搜索

增加跨节点搜索能力，支持以下字段：

- 节点标题
- 摘要
- 定义
- 示例
- 术语表
- 故障现象

建议提供 `/` 快捷键聚焦搜索框，并支持按层级、节点类型和关系类型筛选。

### 2. 完善层级筛选

当前界面已有 L0–L4 层级按钮，但筛选状态没有真正影响内容展示。需要支持：

- 只查看当前层级
- 查看当前节点上下相邻层级
- 查看当前节点及其关联节点
- 恢复全部层级

### 3. 增加浏览历史

用户可能从层级树、关系图或关联卡片进入节点，因此仅支持“返回父级”不够。建议增加：

- 上一个节点
- 下一个节点
- 最近浏览节点
- `Alt + ← / →` 快捷键
- 当前浏览路径持久化

### 4. 增加阅读模式

提供不同阅读场景：

- 阅读模式：单列连续阅读
- 地图模式：三栏探索关系
- 聚焦模式：隐藏左右栏，只保留当前节点
- 打印模式：移除交互控件，适合导出或打印

### 5. URL 同步与分享

当前节点应同步到 URL，例如：

```text
#node=page-tables
```

这样可以直接分享某个概念节点，并支持刷新后恢复位置。

## 二、建议新增的内容组件

### 1. LearningObjectives

描述读者完成当前主题后应该掌握的内容。

```mdx
<LearningObjectives items={[
  '解释目标文件与可执行文件的区别',
  '定位动态链接失败的证据',
  '区分缺页异常与段错误'
]} />
```

### 2. KeyQuestion

在概念正文前提出引导问题，建立阅读目标。

```mdx
<KeyQuestion>为什么程序明明编译成功，启动时仍然会失败？</KeyQuestion>
```

### 3. WorkedExample

用于展示完整的推演过程，而不仅是给出一个结果。

```mdx
<WorkedExample title="一次动态库加载失败的完整追踪">
  <Step number="1">确认文件格式与架构</Step>
  <Step number="2">查看依赖库</Step>
  <Step number="3">检查搜索路径</Step>
  <Step number="4">确认符号版本</Step>
</WorkedExample>
```

### 4. Evidence

统一表达“概念如何被观察和验证”。

```mdx
<Evidence command="readelf -d app" observes="动态依赖列表" />
<Evidence command="perf stat ./app" observes="周期、指令与缺页" />
```

### 5. Invariant

表达某个阶段必须保持的不变量，帮助读者理解故障边界。

```mdx
<Invariant title="装载阶段不变量">
  所有可执行段必须映射到合法地址，并拥有符合安全策略的权限。
</Invariant>
```

### 6. FailureMode

统一表达故障的现象、原因、证据和修复建议。

```mdx
<FailureMode
  symptom="启动即退出"
  cause="共享库缺失"
  evidence="loader error / ldd"
  remedy="修复依赖声明或镜像"
>
  ...
</FailureMode>
```

### 7. Quiz / CheckYourself

增加即时理解检查，支持显示答案与解释。

```mdx
<Quiz question="哪个阶段负责解析跨文件符号？" answer="链接阶段">
  链接器会把目标文件中的引用与定义匹配起来。
</Quiz>
```

### 8. Tradeoff

表达具体工程决策中的收益、代价和适用条件。

```mdx
<Tradeoff title="静态链接还是动态链接">
  <Option name="静态链接" benefit="部署简单" cost="体积更大、升级不灵活" />
  <Option name="动态链接" benefit="共享与更新方便" cost="运行时依赖更复杂" />
</Tradeoff>
```

## 三、知识模型改进

### 1. 增加节点类型

目前主要依赖 `level` 区分节点。建议增加 `kind` 字段：

- `system`：系统
- `stage`：阶段
- `mechanism`：机制
- `artifact`：产物
- `failure`：故障
- `tool`：工具
- `boundary`：边界
- `decision`：决策

这样关系图可以按知识类型筛选，而不仅按 L0–L4 筛选。

### 2. 增加来源与可信度

建议支持：

```mdx
<Source href="..." label="ELF Specification" />
<Confidence level="high">...</Confidence>
<LastReviewed date="2026-09-04" />
```

用于区分语言规范、ABI 约定、操作系统实现、实验观察和工程经验。

### 3. 支持跨文档引用

允许一个主题引用另一个主题中的节点：

```mdx
<CrossReference doc="memory-model" node="happens-before" />
```

未来可以将多个 MDX 文档合并为更大的知识网络。

## 四、无障碍与可用性

- 所有节点按钮提供明确的 `aria-label`
- 支持键盘遍历层级树与搜索结果
- 图谱提供文本列表替代视图
- Mermaid 图提供文本摘要
- 移动端默认折叠右侧检查栏
- 页面顶部显示当前阅读位置与节点总数
- 增加“复制当前节点链接”按钮
- 对拖拽画布提供键盘或按钮替代操作

## 五、实施优先级

### P0：优先实现

1. 全局搜索
2. 修复层级筛选
3. URL 节点定位
4. 浏览历史
5. `Evidence`
6. `Invariant`
7. `FailureMode`

### P1：增强学习体验

1. `LearningObjectives`
2. `KeyQuestion`
3. `WorkedExample`
4. `Quiz`
5. `Tradeoff`

### P2：扩展知识系统

1. 节点 `kind` 类型系统
2. 来源、可信度和审阅日期
3. 跨文档引用
4. 多文档全局关系图
5. 打印与导出模式

## 六、验收标准

- 用户可以通过搜索在 3 秒内定位任意节点。
- 从任意入口进入节点后，可以返回上一个浏览位置。
- 刷新或分享 URL 后，能够恢复到指定节点。
- 每个故障节点至少包含现象、证据和定位方向。
- 每个关键机制节点至少包含一个可验证的不变量。
- L0–L4 筛选结果与界面状态保持一致。
- 键盘操作可以完成搜索、节点切换、返回和视图切换。
- 新增组件仍然只表达语义，不在 MDX 中直接编写布局或 CSS。
