import type { KnowledgeCard, LearningSession, UserState, KnowledgeDomain } from '../types';

// 本地存储键名常量
const STORAGE_KEYS = {
  CARDS: 'zhishi_cards',
  SESSIONS: 'zhishi_sessions',
  USER_STATE: 'zhishi_user_state',
  DOMAINS: 'zhishi_domains',
  LEARNING_HISTORY: 'zhishi_learning_history'
};

// 卡片数据管理
export const cardStorage = {
  // 保存卡片数据
  saveCards: (cards: KnowledgeCard[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
    } catch (error) {
      console.error('保存卡片数据失败:', error);
    }
  },
  
  // 加载卡片数据
  loadCards: (): KnowledgeCard[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CARDS);
      if (data) {
        const cards = JSON.parse(data);
        // 转换日期字符串为Date对象
        return cards.map((card: any) => ({
          ...card,
          createdAt: new Date(card.createdAt)
        }));
      }
    } catch (error) {
      console.error('加载卡片数据失败:', error);
    }
    return [];
  },
  
  // 添加新卡片
  addCard: (card: KnowledgeCard): void => {
    const cards = cardStorage.loadCards();
    cards.push(card);
    cardStorage.saveCards(cards);
  },
  
  // 更新卡片
  updateCard: (cardId: string, updates: Partial<KnowledgeCard>): void => {
    const cards = cardStorage.loadCards();
    const index = cards.findIndex(card => card.id === cardId);
    if (index !== -1) {
      cards[index] = { ...cards[index], ...updates };
      cardStorage.saveCards(cards);
    }
  },
  
  // 删除卡片
  deleteCard: (cardId: string): void => {
    const cards = cardStorage.loadCards();
    const filteredCards = cards.filter(card => card.id !== cardId);
    cardStorage.saveCards(filteredCards);
  }
};

// 学习会话管理
export const sessionStorage = {
  // 保存学习会话
  saveSession: (session: LearningSession): void => {
    try {
      const sessions = sessionStorage.loadSessions();
      const index = sessions.findIndex(s => s.id === session.id);
      if (index !== -1) {
        sessions[index] = session;
      } else {
        sessions.push(session);
      }
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch (error) {
      console.error('保存学习会话失败:', error);
    }
  },
  
  // 加载学习会话
  loadSessions: (): LearningSession[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (data) {
        const sessions = JSON.parse(data);
        // 转换日期字符串为Date对象
        return sessions.map((session: any) => ({
          ...session,
          startTime: new Date(session.startTime),
          endTime: session.endTime ? new Date(session.endTime) : undefined
        }));
      }
    } catch (error) {
      console.error('加载学习会话失败:', error);
    }
    return [];
  },
  
  // 获取用户的学习历史
  getUserSessions: (): LearningSession[] => {
    const sessions = sessionStorage.loadSessions();
    return sessions.filter(session => session.completed);
  },
  
  // 清理过期会话（超过30天）
  cleanupOldSessions: (): void => {
    const sessions = sessionStorage.loadSessions();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeSessions = sessions.filter(session => 
      session.startTime > thirtyDaysAgo || !session.completed
    );
    
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(activeSessions));
  }
};

// 用户状态管理
export const userStorage = {
  // 保存用户状态
  saveUserState: (userState: UserState): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_STATE, JSON.stringify(userState));
    } catch (error) {
      console.error('保存用户状态失败:', error);
    }
  },
  
  // 加载用户状态
  loadUserState: (): UserState | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_STATE);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('加载用户状态失败:', error);
    }
    return null;
  },
  
  // 更新用户偏好
  updatePreferences: (preferences: Partial<UserState['preferences']>): void => {
    const userState = userStorage.loadUserState();
    if (userState) {
      userState.preferences = { ...userState.preferences, ...preferences };
      userStorage.saveUserState(userState);
    }
  },
  
  // 添加学习历史
  addLearningHistory: (cardId: string): void => {
    const userState = userStorage.loadUserState();
    if (userState) {
      if (!userState.learningHistory.includes(cardId)) {
        userState.learningHistory.push(cardId);
        // 只保留最近100条记录
        if (userState.learningHistory.length > 100) {
          userState.learningHistory = userState.learningHistory.slice(-100);
        }
        userStorage.saveUserState(userState);
      }
    }
  }
};

// 知识领域管理
export const domainStorage = {
  // 保存知识领域配置
  saveDomains: (domains: KnowledgeDomain[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.DOMAINS, JSON.stringify(domains));
    } catch (error) {
      console.error('保存知识领域失败:', error);
    }
  },
  
  // 加载知识领域配置
  loadDomains: (): KnowledgeDomain[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DOMAINS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('加载知识领域失败:', error);
    }
    return [];
  }
};

// 学习历史管理
export const learningHistoryStorage = {
  // 保存学习历史
  saveLearningHistory: (history: string[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.LEARNING_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('保存学习历史失败:', error);
    }
  },
  
  // 加载学习历史
  loadLearningHistory: (): string[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LEARNING_HISTORY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('加载学习历史失败:', error);
    }
    return [];
  },
  
  // 添加学习记录
  addLearningRecord: (cardId: string): void => {
    const history = learningHistoryStorage.loadLearningHistory();
    if (!history.includes(cardId)) {
      history.push(cardId);
      // 只保留最近50条记录
      if (history.length > 50) {
        history.splice(0, history.length - 50);
      }
      learningHistoryStorage.saveLearningHistory(history);
    }
  }
};

// 存储工具类
export class StorageManager {
  // 初始化存储
  static init(): void {
    // 清理过期数据
    sessionStorage.cleanupOldSessions();
  }
  
  // 清空所有数据
  static clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
  
  // 获取存储使用情况
  static getStorageInfo(): { used: number; total: number } {
    let used = 0;
    Object.values(STORAGE_KEYS).forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        used += data.length;
      }
    });
    
    return {
      used,
      total: 5 * 1024 * 1024 // 假设5MB限制
    };
  }
}

// AI生成卡片缓存管理
export const LocalStorage = {
  // 保存知识卡片（带过期时间）
  saveCards: (cards: KnowledgeCard[]): void => {
    try {
      localStorage.setItem('knowledgeCards', JSON.stringify(cards));
      localStorage.setItem('cardsLastUpdated', new Date().toISOString());
    } catch (error) {
      console.error('保存卡片失败:', error);
    }
  },
  
  // 获取知识卡片（检查过期）
  getCards: (): KnowledgeCard[] | null => {
    try {
      const cardsStr = localStorage.getItem('knowledgeCards');
      if (!cardsStr) return null;
      
      const cards = JSON.parse(cardsStr);
      
      // 检查是否过期（7天）
      const lastUpdated = localStorage.getItem('cardsLastUpdated');
      if (lastUpdated) {
        const daysSince = (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince > 7) {
          localStorage.removeItem('knowledgeCards');
          localStorage.removeItem('cardsLastUpdated');
          return null;
        }
      }
      
      return cards;
    } catch (error) {
      console.error('读取卡片失败:', error);
      return null;
    }
  },
  
  // 清除卡片缓存
  clearCards: (): void => {
    localStorage.removeItem('knowledgeCards');
    localStorage.removeItem('cardsLastUpdated');
  },
  
  // 保存用户选择的领域
  saveSelectedDomains: (domains: string[]): void => {
    try {
      localStorage.setItem('selectedDomains', JSON.stringify(domains));
    } catch (error) {
      console.error('保存领域选择失败:', error);
    }
  },
  
  // 获取用户选择的领域
  getSelectedDomains: (): string[] => {
    try {
      const domainsStr = localStorage.getItem('selectedDomains');
      return domainsStr ? JSON.parse(domainsStr) : [];
    } catch (error) {
      console.error('读取领域选择失败:', error);
      return [];
    }
  },
  
  // 保存当前卡片索引
  saveCurrentCardIndex: (index: number): void => {
    try {
      localStorage.setItem('currentCardIndex', index.toString());
    } catch (error) {
      console.error('保存卡片索引失败:', error);
    }
  },
  
  // 获取当前卡片索引
  getCurrentCardIndex: (): number => {
    try {
      const indexStr = localStorage.getItem('currentCardIndex');
      return indexStr ? parseInt(indexStr, 10) : 0;
    } catch (error) {
      console.error('读取卡片索引失败:', error);
      return 0;
    }
  }
};

// 主题偏好存取
export const themeStorage = {
  getTheme(): 'dark' | 'light' | null {
    try {
      const t = localStorage.getItem('theme');
      return t === 'dark' || t === 'light' ? t : null;
    } catch {
      return null;
    }
  },
  setTheme(theme: 'dark' | 'light'): void {
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // ignore
    }
  }
};