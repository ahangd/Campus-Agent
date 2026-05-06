# 校园智能咨询助手（Dify + Next.js）

这是一个基于 Next.js 的校园咨询前端项目，接入 Dify 对话应用，提供“先填写身份信息，再进入对话工作台”的使用流程。

当前版本已经包含：
- 动态表单采集
- 流式聊天工作台
- 本地会话与历史记录
- `Agent Inspector` 过程观察面板
- 本地证据结果格式化与中文映射

## 当前能力

### 1. 动态表单采集

- 首页和聊天页都可以渲染 Dify `GET /parameters` 返回的 `user_input_form`
- 表单字段按接口配置动态生成
- 提交前会校验必填项
- 姓名和学号被视为进入聊天前的必要身份信息
- 输入内容会实时写入本地草稿，刷新后可恢复

核心文件：
- [components/dify-entry-form.tsx](/c:/zyh毕业设计/find-best-ev-main/components/dify-entry-form.tsx)
- [components/dify-entry-form-field.tsx](/c:/zyh毕业设计/find-best-ev-main/components/dify-entry-form-field.tsx)
- [app/api/dify/parameters/route.ts](/c:/zyh毕业设计/find-best-ev-main/app/api/dify/parameters/route.ts)
- [lib/dify-entry-form.ts](/c:/zyh毕业设计/find-best-ev-main/lib/dify-entry-form.ts)
- [lib/chat-session.ts](/c:/zyh毕业设计/find-best-ev-main/lib/chat-session.ts)

### 2. 流式聊天工作台

- 表单提交后进入 `/chat`
- 前端通过 `/api/dify/chat` 调用 Dify `POST /chat-messages`
- 使用 SSE 流式接收回答
- 自动维护 `conversation_id`，支持连续多轮对话
- 支持新建会话、继续历史会话、删除本地会话

核心文件：
- [components/chat-workspace.tsx](/c:/zyh毕业设计/find-best-ev-main/components/chat-workspace.tsx)
- [components/dify-chat-panel.tsx](/c:/zyh毕业设计/find-best-ev-main/components/dify-chat-panel.tsx)
- [components/dify-chat-history-sidebar.tsx](/c:/zyh毕业设计/find-best-ev-main/components/dify-chat-history-sidebar.tsx)
- [components/dify-chat-message-list.tsx](/c:/zyh毕业设计/find-best-ev-main/components/dify-chat-message-list.tsx)
- [app/api/dify/chat/route.ts](/c:/zyh毕业设计/find-best-ev-main/app/api/dify/chat/route.ts)

### 3. 本地会话与身份状态

- 表单提交时会把当前身份和表单快照写入本地
- 聊天历史也保存在本地，可恢复消息和 `conversation_id`
- 会为当前浏览器生成本地 `user id`
- `crypto.randomUUID()` 不可用时会自动回退，避免页面初始化报错

主要 `localStorage` 键：

- `dify-ev-user-input-form`：表单草稿
- `dify-ev-chat-session`：已提交的身份与表单快照
- `dify-ev-chat-history`：聊天历史
- `dify-ev-pending-query`：从快捷入口带入聊天页的待发送问题
- `dify-chat-user-id`：当前浏览器用户标识

核心文件：
- [lib/chat-session.ts](/c:/zyh毕业设计/find-best-ev-main/lib/chat-session.ts)
- [lib/dify-chat-state.ts](/c:/zyh毕业设计/find-best-ev-main/lib/dify-chat-state.ts)
- [lib/dify-chat-history.ts](/c:/zyh毕业设计/find-best-ev-main/lib/dify-chat-history.ts)
- [lib/dify-chat-panel-support.ts](/c:/zyh毕业设计/find-best-ev-main/lib/dify-chat-panel-support.ts)

### 4. Agent Inspector

聊天页右侧包含一个 `Agent Inspector`，用于展示当前轮次可观察到的过程数据：

- `plan`：思考 / 规划片段
- `evidence`：查询结果或证据片段
- `tools`：工具名、输入参数、结果、耗时
- `reflection`：前端根据消息内容做的启发式评分

补充说明：

- `reflection` 不是 Dify 原始返回字段，而是前端估算值
- `Pin` 按钮会固定当前标签页，外部事件不会强制切换标签
- 面板开关按钮可以真正收起 / 展开 Inspector
- 复制按钮会优先使用 Clipboard API，不可用时自动回退到兼容方案

核心文件：
- [components/agent-inspector.tsx](/c:/zyh毕业设计/find-best-ev-main/components/agent-inspector.tsx)
- [lib/agent-inspector.ts](/c:/zyh毕业设计/find-best-ev-main/lib/agent-inspector.ts)
- [lib/agent-inspector-state.ts](/c:/zyh毕业设计/find-best-ev-main/lib/agent-inspector-state.ts)
- [lib/clipboard.ts](/c:/zyh毕业设计/find-best-ev-main/lib/clipboard.ts)

### 5. 查询结果展示优化

- 主回答区会清理 `<think>...</think>` 标签，只显示面向用户的正文
- `observation` 不再原样展示，会先做一层解析
- 对于 `{"get_rows":"{\"data\": []}"}` 这类双层 JSON，会拆壳后展示真实结果
- 空结果会显示为“未查询到结果”
- 常见字段名会映射成中文展示，如课程名称、授课教师、地点、状态等

核心文件：
- [lib/dify-observation.ts](/c:/zyh毕业设计/find-best-ev-main/lib/dify-observation.ts)
- [lib/dify-chat-message.ts](/c:/zyh毕业设计/find-best-ev-main/lib/dify-chat-message.ts)
- [lib/dify-chat-request.ts](/c:/zyh毕业设计/find-best-ev-main/lib/dify-chat-request.ts)

## 项目结构

```text
app/
  api/
    dify/
      chat/route.ts
      parameters/route.ts
  chat/page.tsx
components/
  agent-inspector.tsx
  chat-workspace.tsx
  dify-chat-history-sidebar.tsx
  dify-chat-message-list.tsx
  dify-chat-panel.tsx
  dify-entry-form.tsx
  dify-entry-form-field.tsx
lib/
  agent-inspector.ts
  agent-inspector-state.ts
  chat-copy.ts
  chat-session.ts
  clipboard.ts
  dify-chat-history.ts
  dify-chat-message.ts
  dify-chat-panel-support.ts
  dify-chat-request.ts
  dify-chat-state.ts
  dify-chat-stream.ts
  dify-entry-form.ts
  dify-observation.ts
  parse-dify-sse.ts
tests/
  agent-inspector-state.test.mjs
  agent-inspector.test.mjs
  chat-session.test.mjs
  clipboard.test.mjs
  dify-chat-message.test.mjs
  dify-chat-request.test.mjs
  dify-observation.test.mjs
```

## 环境变量

在项目根目录创建 `.env.local`：

```env
DIFY_API_KEY=your_dify_app_key
DIFY_API_BASE_URL=https://api.dify.ai/v1
```

项目内部会优先读取 `DIFY_EV_AGENT`，若不存在则回退读取 `DIFY_API_KEY`。

## 本地运行

```bash
pnpm install
pnpm dev
```

启动后访问：

```text
http://localhost:3000
```

## 常用脚本

```bash
pnpm dev
pnpm build
pnpm start
pnpm exec tsc --noEmit
```

## 调试与验证

当前仓库没有完整测试框架，但有一组轻量回归脚本可直接运行：

```bash
node --experimental-strip-types tests/clipboard.test.mjs
node --experimental-strip-types tests/agent-inspector-state.test.mjs
node --experimental-strip-types tests/agent-inspector.test.mjs
node --experimental-strip-types tests/chat-session.test.mjs
node --experimental-strip-types tests/dify-chat-message.test.mjs
node --experimental-strip-types tests/dify-chat-request.test.mjs
node --experimental-strip-types tests/dify-observation.test.mjs
pnpm exec tsc --noEmit
```

它们分别用于验证：

- 复制按钮的兼容逻辑
- Inspector 标签切换 / 固定逻辑
- Inspector 导出与展示辅助函数
- 身份提取与聊天会话快照逻辑
- 聊天消息解析与反思评分
- 发送请求与流式事件处理
- 查询结果格式化与中文字段映射
- TypeScript 类型检查

## 当前实现边界

- Dify 主回答正文基本是后端流式转发后的结果，前端不会重写这部分措辞
- `Agent Inspector` 展示的是“可观察过程数据”，不是 Dify 官方调试控制台
- `reflection` 中的 `tone`、`safety` 等分值目前仍偏启发式，适合调试，不适合作为正式评测结论
- 测试脚本目前依赖 Node 的 `--experimental-strip-types`，还不是完整测试框架

## 相关文档

- [docs/新手阅读指南.md](/c:/zyh毕业设计/find-best-ev-main/docs/新手阅读指南.md)
- [docs/新手教程.md](/c:/zyh毕业设计/find-best-ev-main/docs/新手教程.md)
- [项目进度文档.md](/c:/zyh毕业设计/find-best-ev-main/项目进度文档.md)
