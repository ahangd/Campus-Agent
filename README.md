# 校园智能咨询助手（Dify + Next.js）

本项目是一个基于 Next.js App Router 的校园咨询前端，接入 Dify 对话型应用，实现“先表单、后对话”的咨询流程，并支持快捷提问与本地历史记录。

## 当前已实现功能

### 1) 调研表单直出（首页主界面）
- 首页右侧主区域直接展示调研表单，不再使用弹窗模式。
- 表单字段通过 Dify `GET /parameters` 动态获取并渲染（`user_input_form`）。
- 支持常见字段类型：文本、密码、多行、数字、下拉、单选、勾选、JSON 等。
- 必填项在点击“开始对话”时校验，未通过会提示错误。
- 表单输入会实时缓存到本地，刷新后可回填草稿。

### 2) 聊天对话页
- 表单提交后跳转到 `/chat`，进入可用的实时对话页面。
- 对接 Dify `POST /chat-messages` 流式输出（SSE）。
- 自动维护 `conversation_id`，支持连续多轮对话。
- 支持“新建会话”重置当前会话状态。

### 3) 快捷提问（左侧按钮）
- 点击快捷提问时，先校验是否已填写学号和姓名。
- 已填写：直接跳转聊天页，并自动发送该快捷问题。
- 未填写：提示“请先填写学号和姓名，再使用快捷提问”，并滚动到表单区域。

### 4) 历史对话记录（前端本地）
- “查看记录”按钮可打开历史记录弹层。
- 历史记录保存在本地 `localStorage`，显示会话标题与更新时间。
- 点击历史记录可恢复会话消息与 `conversation_id`，继续查看/续聊。

### 5) 输出展示优化
- 最终回答区会清理 `<think>...</think>` 标签内容，仅展示用户可读结果。
- 思考过程展示在回答上方，可手动折叠/展开。
- 查询结果区已按当前需求隐藏。

### 6) 错误处理与稳定性优化
- Dify 参数接口与聊天接口增加了异常捕获与可读错误返回。
- 开发环境下将 webpack 缓存改为内存缓存，规避 Windows 下 `.pack.gz` 重命名报错问题。

## 环境变量

在项目根目录创建/维护 `.env.local`：

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

启动后访问：`http://localhost:3000`

## 主要页面与模块
- 首页：`app/page.tsx` + `hero-section.tsx`
- 调研表单：`components/dify-entry-modal.tsx`
- 聊天页面：`app/chat/page.tsx`
- 聊天面板：`components/dify-chat-panel.tsx`
- Dify 参数代理：`app/api/dify/parameters/route.ts`
- Dify 聊天代理：`app/api/dify/chat/route.ts`