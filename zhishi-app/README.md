# 🧠 知识快消品 - 深度知识探索应用

[![React](https://img.shields.io/badge/React-19.0.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-purple)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

> **"在碎片化时间中，通过AI多智能体协作，让用户快速获得深度知识体验，欲罢不能地持续探索"**

一个革命性的知识探索应用，将深度知识包装成"快消品"，让用户在3-5分钟内获得专业级的知识体验。基于React 19 + TypeScript + AI多智能体架构构建。

## ✨ 核心特色

### 🚀 极简操作，深度体验
- **一键开始**：打开即用，无需任何配置
- **3-5分钟**：完成一次完整的深度知识体验
- **零学习成本**：像刷短视频一样简单，但获得深度知识

### 🎯 智能Agent群组协作
- **3个核心Agent**：知识讲解师、思维碰撞者、实践连接者
- **4个专业Agent**：科学解释者、历史叙述者、艺术鉴赏者、逻辑推理者
- **智能匹配**：系统根据知识类型自动选择最适合的Agent组合

### 💡 持续吸引力机制
- **悬念式开头**：每个Agent都有吸引人的开场
- **观点碰撞**：不同Agent产生认知冲突，激发深度思考
- **震撼案例**：用令人惊叹的事实和案例吸引用户
- **好奇心驱动**：AI生成让用户难以拒绝的探索选项

## 🛠️ 技术栈

- **前端框架**：React 19 + TypeScript
- **构建工具**：Vite 5
- **状态管理**：Zustand
- **UI组件**：Ant Design Mobile
- **AI服务**：GLM-4.5-Flash API
- **数据存储**：LocalStorage + IndexedDB
- **代码质量**：ESLint + TypeScript严格模式

## 🚀 快速开始

### 环境要求
- Node.js 18+ 
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/jsjm1986/zhishi-app.git
cd zhishi-app
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑.env文件，添加你的GLM API密钥
# 请访问 https://open.bigmodel.cn/ 获取API密钥
VITE_GLM_API_KEY=your_glm_api_key_here
```

**注意**：项目已内置演示用API密钥，可直接运行。生产环境请使用自己的API密钥。

4. **启动开发服务器**
```bash
npm run dev
```

5. **构建生产版本**
```bash
npm run build
```

## 📱 使用指南

### 首次使用流程

1. **选择知识领域**
   - 从科学、历史、文学、技术、艺术、哲学中选择感兴趣领域
   - 支持多选，系统会根据选择生成个性化内容

2. **探索知识卡片**
   - 上下滑动浏览知识卡片流
   - 点击感兴趣的知识卡片进入学习模式

3. **深度学习体验**
   - 系统自动配置AI Agent群组
   - 享受3-5分钟的深度知识对话
   - 通过好奇心驱动选择继续探索

### 核心功能

#### 🎴 知识卡片流
- 类似抖音的滑动体验
- 个性化内容推荐
- 多领域知识覆盖

#### 🤖 AI多智能体协作
- **知识讲解师**：建立准确的知识基础
- **思维碰撞者**：激发批判性思维
- **实践连接者**：连接理论与现实应用
- **专业Agent**：根据领域提供专家级见解

#### 🎯 学习模式
- 3-5分钟完整体验设计
- 悬念式内容生成
- 观点碰撞系统
- 好奇心驱动选择

## 🏗️ 项目架构

### 目录结构
```
zhishi-app/
├── src/
│   ├── components/          # React组件
│   │   ├── AgentChat/      # AI对话组件
│   │   ├── CardSwiper/     # 卡片滑动组件
│   │   ├── DomainSelector/ # 领域选择组件
│   │   ├── LearningMode/   # 学习模式组件
│   │   └── ErrorBoundary/  # 错误边界组件
│   ├── services/           # 服务层
│   │   └── GLMService.ts   # GLM API服务
│   ├── stores/             # 状态管理
│   │   └── appStore.ts     # Zustand状态存储
│   ├── types/              # TypeScript类型定义
│   ├── utils/              # 工具函数
│   └── styles/             # 样式文件
├── public/                 # 静态资源
└── docs/                  # 项目文档
```

### 核心模块

#### 状态管理 (Zustand)
```typescript
// 应用状态管理
interface AppState {
  cards: KnowledgeCard[]
  currentCardIndex: number
  isLearningMode: boolean
  agents: Agent[]
  messages: AgentMessage[]
  // ... 其他状态
}
```

#### AI服务集成
```typescript
// GLM API服务封装
class GLMService {
  static async generateCard(domain, subCategory, difficulty)
  static async getAgentResponse(agentId, userMessage, cardContext)
  static async generateCuriosityOptions(cardContext, currentTopic)
}
```

#### 组件架构
- **DomainSelector**：知识领域选择界面
- **CardSwiper**：卡片流浏览组件
- **LearningMode**：深度学习模式界面
- **AgentChat**：多智能体对话组件

## 🎨 设计理念

### 产品哲学
我们致力于将深度知识包装成"快消品"，让用户在碎片化时间中获得：
- **深度而非广度**：每次体验都提供有深度的知识
- **放松式学习**：用户无需思考，只需享受内容
- **好奇心驱动**：通过悬念和互动让用户持续探索

### 用户体验设计
- **移动优先**：专为移动设备优化的响应式设计
- **极简交互**：最少的操作步骤，最大的知识收获
- **内容驱动**：通过优质内容本身吸引用户留存

## 🔧 开发指南

### 代码规范
- 使用TypeScript严格模式
- ESLint代码质量检查
- 遵循React Hooks最佳实践

### 添加新的知识领域
1. 在 `src/types/index.ts` 中扩展 `KnowledgeDomain` 类型
2. 在领域选择组件中添加对应的UI元素
3. 在GLM服务中配置对应的提示词模板

### 自定义AI Agent
1. 在 `src/services/GLMService.ts` 中添加新的Agent配置
2. 定义Agent的职责和对话风格
3. 在状态管理中集成新的Agent逻辑

## 📈 性能优化

### 前端优化
- 代码分割和懒加载
- 图片和资源优化
- 状态管理优化

### AI响应优化
- 请求缓存机制
- 错误重试策略
- 响应时间监控

## 🤝 贡献指南

我们欢迎各种形式的贡献！请参考以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个Pull Request

### 开发规范
- 提交信息遵循 Conventional Commits 规范
- 确保所有测试通过
- 更新相关文档

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [React](https://reactjs.org/) - 优秀的前端框架
- [Vite](https://vitejs.dev/) - 快速的构建工具
- [Ant Design Mobile](https://mobile.ant.design/) - 精美的移动端组件
- [GLM-4.5-Flash](https://bigmodel.cn/) - 强大的AI语言模型
- [Zustand](https://github.com/pmndrs/zustand) - 轻量级状态管理

## 📞 联系我们

如有问题或建议，请通过以下方式联系我们：
- 提交 [Issue](https://github.com/jsjm1986/zhishi-app/issues)
- 微信: agimeme
- 邮箱: 请通过GitHub Issue联系

---

**⭐ 如果这个项目对你有帮助，请给个Star支持一下！** ⭐

---

**开始你的知识探索之旅吧！** 🚀

让深度知识像快消品一样触手可及，在碎片化时间中获得专业级的学习体验。
