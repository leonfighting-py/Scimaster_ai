# SciMaster AI

SciMaster AI 是一款面向科研选题与论文写作的全流程 AI 辅助工具。从灵感到发表，覆盖「选题 → 大纲 → 写作」三个阶段，每个阶段均有专属的 AI 工作区。

---

## 核心功能

### 阶段一：Ideamap — 对抗式选题生成

用户输入一个研究方向后，AI 先做领域调研（Landscape Survey），再以流式方式逐步生成 6–10 个候选研究选题，实时飞入画布。全部生成后：

- 系统提示用户确认，进入**对抗打分**环节
- **Generator LLM** 提出选题，**Critic LLM** 从"魔鬼代言人"视角逐条打分并给出反对意见
- 打分完成后，高分选题保留（高亮绿框），低分选题消融划除（淡出 + 删除线）
- 用户可实时点击节点切换保留/淘汰状态，最终确认后删除淘汰项，保留选题进入下一阶段

技术实现：调用 [Google Gemini API](https://ai.google.dev/)（`gemini-2.0-flash`），流式解析 JSON 逐对象返回。

### 阶段二：Outline — AI 大纲生成

在无限画布上以树形结构构建论文大纲：

- 与 AI 对话，逐步生长大纲节点（最多 5 级深度）
- 支持拖拽节点、折叠/展开分支、上传参考文献（PDF / Markdown）
- 大纲完成后一键生成全文，进入 Writing 阶段

### 阶段三：Writing — 写作工作区

- 编辑区 + AI 对话区双栏布局
- 支持打开项目文件、知识库管理
- Writer / Tutor / Analyzer 三种 AI 角色切换

---

## 技术栈

| 层次 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite 6 |
| 样式 | Tailwind CSS v4（@tailwindcss/vite 插件） |
| 图标 | lucide-react |
| 动画 | Framer Motion（motion） |
| PDF 解析 | pdfjs-dist |
| LLM | Google Gemini API（直接 fetch，无 SDK） |
| 本地存储 | localStorage（项目、想法） |
| 测试 | Vitest + jsdom + @testing-library/react |

---

## 项目结构

```
Scimaster_ai/
├── public/                  # 静态资源（logo、背景图等）
├── src/
│   ├── App.tsx              # 主路由与全局状态
│   ├── LandingPage.tsx      # 落地页（登录入口）
│   ├── IdeaBrainstormingWorkspace.tsx  # 阶段一：Ideamap 对抗选题画布
│   ├── OutlineWorkspace.tsx            # 阶段二：大纲生成树形画布
│   ├── ProjectWorkspaceView.tsx        # 阶段三：写作工作区
│   ├── IdeaMapPage.tsx      # 想法地图页面
│   ├── index.css            # 全局样式（含节点动画 CSS）
│   └── utils/
│       ├── llmClient.ts     # Gemini API 封装（流式 + 批量评分）
│       ├── projectStore.ts  # 项目持久化（localStorage）
│       ├── ideaStore.ts     # 想法持久化（localStorage）
│       ├── extractKeywords.ts  # 关键词提取
│       └── clusterIdeas.ts     # 想法聚类（Jaccard 相似度）
├── .env.example
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 快速开始

### 环境要求

- Node.js >= 18
- 一个有效的 Google Gemini API Key（[申请地址](https://aistudio.google.com/app/apikey)）

### 安装与启动

```bash
# 克隆仓库
git clone https://github.com/leonfighting-py/Scimaster_ai.git
cd Scimaster_ai

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入 Gemini API Key：
# VITE_GEMINI_API_KEY=your_key_here

# 启动开发服务器
npm run dev
# 默认访问 http://localhost:3000
```

### 其他命令

```bash
npm run build    # 生产构建
npm run preview  # 预览生产包
npm run lint     # TypeScript 类型检查
npm run test     # 运行测试（Vitest）
```

---

## 环境变量

| 变量名 | 说明 |
|--------|------|
| `VITE_GEMINI_API_KEY` | Google Gemini API Key，供前端直接调用 LLM |
| `APP_URL` | 应用托管地址（Cloud Run 部署时由平台自动注入） |

> **注意**：`VITE_` 前缀的变量会被 Vite 打包进前端代码，请勿在生产环境将敏感密钥直接暴露给公网用户。如需保护 API Key，建议增加一层后端代理。

---

## 用户流程

```
登录
  └─ 首页（Start brainstorming / Start writing）
       ├─ Start brainstorming
       │    ├─ [1] Ideamap  ← 输入 query，AI 对抗生成 + 打分选题
       │    ├─ [2] Outline  ← 与 AI 对话，构建树形大纲
       │    └─ [3] Writing  ← 写作工作区
       └─ Start writing
            └─ Writing 工作区（直接进入）
```

---

## 开发说明

- **对抗选题流程**：`IdeaBrainstormingWorkspace.tsx` 内的状态机（`idle → surveying → generating → awaiting_confirm → scoring → done`）驱动整个 Ideamap 阶段，配合 `utils/llmClient.ts` 中的 `doLandscapeSurvey`、`streamTopics`、`scoreTopics` 三个函数实现。
- **节点动画 CSS**：`index.css` 中包含 `@keyframes candidatePulse`、`drawStrikethrough`、`badgeEntry` 等动画，控制节点从候选态 → 保留/消融的视觉过渡。
- **无限画布**：基于 CSS `transform: translate + scale` 实现，鼠标拖拽平移，滚轮缩放，无第三方画布库依赖。
- **PDF 解析**：使用 `pdfjs-dist` 在前端直接提取文本，解析后存入知识库供 AI 参考。

---

## License

MIT
