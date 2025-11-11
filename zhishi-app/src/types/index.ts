// 知识卡片类型
export interface KnowledgeCard {
  id: string;
  title: string;
  content: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string; // 知识领域
  subCategory: string; // 子分类
  tags: string[];
  aiGenerated: boolean;
  createdAt: Date;
  domain: string; // 主要知识领域
  relatedDomains: string[]; // 相关领域
}

// Agent消息类型
export interface AgentMessage {
  agentId: string;
  agentName: string;
  message: string;
  timestamp: Date;
  messageType: 'text' | 'question' | 'suggestion';
  relatedCardId: string;
  isUser?: boolean; // 新增：标识是否为用户消息
}

// 知识领域类型
export interface KnowledgeDomain {
  id: string;
  name: string;
  icon: string;
  color: string;
  subCategories: string[];
  type: 'classic' | 'counterintuitive' | 'fun'; // 经典、反常识、趣味
  description: string;
  attractionTags: string[]; // 吸引力标签
}

// Agent类型
export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  icon: string;
  color: string;
  isCore: boolean; // 是否为核心Agent
  domain?: string; // 专业领域
}

// 好奇心选择选项类型
export interface CuriosityOption {
  id: string;
  text: string;
  curiosity: string; // 好奇心描述
  nextTopic: string; // 下一个话题
}

// 用户状态类型
export interface UserState {
  selectedDomains: string[];
  currentCardIndex: number;
  isLearningMode: boolean;
  learningHistory: string[];
  preferences: {
    difficulty: 'easy' | 'medium' | 'hard';
    autoPlay: boolean;
    soundEnabled: boolean;
  };
}

// 学习会话类型
export interface LearningSession {
  id: string;
  cardId: string;
  startTime: Date;
  endTime?: Date;
  messages: AgentMessage[];
  selectedOptions: string[];
  completed: boolean;
}
