import { create } from 'zustand';
import type { KnowledgeCard, AgentMessage, UserState, LearningSession, KnowledgeDomain, CuriosityOption } from '../types';
import { GLMService } from '../services/GLMService';
import { LocalStorage, sessionStorage } from '../utils/localStorage';

interface AppState {
  // 用户状态
  userState: UserState;
  
  // 知识卡片
  cards: KnowledgeCard[];
  currentCardIndex: number;
  currentCard: KnowledgeCard | null;
  isGeneratingCards: boolean;
  hasMoreCards: boolean;
  cardGenerationError: string | null;
  
  // 学习模式
  isLearningMode: boolean;
  activeAgents: string[];
  messages: AgentMessage[];
  currentSession: LearningSession | null;
  curiosityOptions: CuriosityOption[];
  isLearningLoading: boolean;
  isSendingMessage: boolean;
  
  // 知识领域
  domains: KnowledgeDomain[];
  selectedDomains: string[];
  
  // 视图状态
  currentView: 'domainSelector' | 'cardSwiper' | 'learning';

  // 卡片交互状态
  likedCardIds: string[];
  favoritedCardIds: string[];
  learnedCardIds: string[];

  // 交互Actions
  toggleLike: (cardId: string) => void;
  toggleFavorite: (cardId: string) => void;
  markLearned: (cardId: string) => void;
  
  // Actions
  setSelectedDomains: (domains: string[]) => void;
  setCurrentCard: (card: KnowledgeCard) => void;
  setCurrentCardIndex: (index: number) => void;
  addCard: (card: KnowledgeCard) => void;
  addCards: (cards: KnowledgeCard[]) => void;
  setCards: (cards: KnowledgeCard[]) => void;
  
  // AI生成卡片
  generateInitialCards: () => Promise<void>;
  loadMoreCards: () => Promise<void>;
  saveCardsToLocal: () => void;
  loadCardsFromLocal: () => void;
  
  // 学习模式相关
  enterLearningMode: (card: KnowledgeCard) => void;
  exitLearningMode: () => void;
  addMessage: (message: AgentMessage) => void;
  setMessages: (messages: AgentMessage[]) => void;
  setActiveAgents: (agents: string[]) => void;
  setCuriosityOptions: (options: CuriosityOption[]) => void;
  initLearningForCard: (card: KnowledgeCard) => Promise<void>;
  sendUserMessage: (card: KnowledgeCard, text: string) => Promise<void>;
  selectCuriosityOption: (card: KnowledgeCard, option: CuriosityOption) => Promise<void>;
  
  // 会话管理
  startSession: (cardId: string) => void;
  endSession: () => void;
  addSelectedOption: (optionId: string) => void;
  
  // 用户偏好
  updatePreferences: (preferences: Partial<UserState['preferences']>) => void;
  
  // 领域管理
  setDomains: (domains: KnowledgeDomain[]) => void;
  toggleDomain: (domainId: string) => void;
  
  // 视图切换
  setCurrentView: (view: 'domainSelector' | 'cardSwiper' | 'learning') => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // 初始状态
  userState: {
    selectedDomains: [],
    currentCardIndex: 0,
    isLearningMode: false,
    learningHistory: [],
    preferences: {
      difficulty: 'medium',
      autoPlay: true,
      soundEnabled: false
    }
  },
  
  cards: [],
  currentCardIndex: 0,
  currentCard: null,
  isGeneratingCards: false,
  hasMoreCards: true,
  cardGenerationError: null,
  
  isLearningMode: false,
  activeAgents: [],
  messages: [],
  currentSession: null,
  curiosityOptions: [],
  isLearningLoading: false,
  isSendingMessage: false,
  
  domains: [],
  selectedDomains: [],
  currentView: 'domainSelector',
  likedCardIds: [],
  favoritedCardIds: [],
  learnedCardIds: [],
  
  // Actions
  setSelectedDomains: (domains) => set({ selectedDomains: domains }),
  
  setCurrentCard: (card) => set({ currentCard: card }),
  
  setCurrentCardIndex: (index) => set({ currentCardIndex: index }),
  
  addCard: (card) => set((state) => ({ 
    cards: [...state.cards, card] 
  })),
  
  addCards: (cards) => set((state) => ({ 
    cards: [...state.cards, ...cards] 
  })),
  
  setCards: (cards) => set({ cards }),
  
  // AI生成卡片
  generateInitialCards: async () => {
    set({ isGeneratingCards: true, cardGenerationError: null });
    try {
      const { selectedDomains, cards } = get();
      const newCards = await GLMService.generateKnowledgeCards(
        selectedDomains,
        cards,
        5
      );
      set({ 
        cards: [...cards, ...newCards],
        isGeneratingCards: false 
      });
      get().saveCardsToLocal();
    } catch (error) {
      set({ 
        isGeneratingCards: false,
        cardGenerationError: '生成卡片失败，请重试'
      });
    }
  },
  
  loadMoreCards: async () => {
    const { isGeneratingCards, cards, selectedDomains } = get();
    if (isGeneratingCards) return;
    
    set({ isGeneratingCards: true });
    try {
      const newCards = await GLMService.generateKnowledgeCards(
        selectedDomains,
        cards,
        5
      );
      set({ 
        cards: [...cards, ...newCards],
        isGeneratingCards: false 
      });
      get().saveCardsToLocal();
    } catch (error) {
      set({ isGeneratingCards: false });
    }
  },
  
  saveCardsToLocal: () => {
    const { cards } = get();
    LocalStorage.saveCards(cards);
  },
  
  loadCardsFromLocal: () => {
    const savedCards = LocalStorage.getCards();
    if (savedCards && savedCards.length > 0) {
      set({ cards: savedCards });
    }
  },
  
  // 学习模式相关
  enterLearningMode: (card) => set((state) => ({ 
    isLearningMode: true, 
    currentCard: card,
    messages: [],
    curiosityOptions: [],
    activeAgents: getAgentGroup(card.domain),
    currentView: 'learning',
    currentSession: {
      id: Date.now().toString(),
      cardId: card.id,
      startTime: new Date(),
      messages: [],
      selectedOptions: [],
      completed: false
    }
  })),
  
  exitLearningMode: () => set({ 
    isLearningMode: false, 
    currentCard: null,
    messages: [],
    activeAgents: [],
    currentSession: null,
    currentView: 'cardSwiper'
  }),
  
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  
  setMessages: (messages) => set({ messages }),
  
  setActiveAgents: (agents) => set({ activeAgents: agents }),
  
  setCuriosityOptions: (options) => set({ curiosityOptions: options }),

  initLearningForCard: async (card) => {
    set({ isLearningLoading: true });
    try {
      const activeAgents = get().activeAgents.length ? get().activeAgents : getAgentGroup(card.domain);
      const agentMessages = await GLMService.getMultiAgentResponse(card, activeAgents);
      const options = await GLMService.generateCuriosityOptions(card, card.title);
      set({ messages: agentMessages, curiosityOptions: options, isLearningLoading: false });
      // 持久化会话
      const s = get().currentSession;
      if (s) {
        const updated = { ...s, messages: agentMessages };
        set({ currentSession: updated });
        sessionStorage.saveSession(updated);
      }
    } catch {
      set({ isLearningLoading: false });
    }
  },

  sendUserMessage: async (card, text) => {
    if (!text.trim()) return;
    const userMessage: AgentMessage = {
      agentId: 'user',
      agentName: '你',
      message: text.trim(),
      timestamp: new Date(),
      messageType: 'text',
      relatedCardId: card.id,
      isUser: true
    };
    set((state) => ({ messages: [...state.messages, userMessage], isSendingMessage: true }));
    try {
      const activeAgents = get().activeAgents.length ? get().activeAgents : getAgentGroup(card.domain);
      const agentMessages = await GLMService.getMultiAgentResponse(card, activeAgents);
      let merged: AgentMessage[] = [];
      set((state) => {
        merged = [...state.messages, ...agentMessages];
        return { messages: merged };
      });
      const nextOptions = await GLMService.generateNextCuriosityOptions(card, merged);
      set({ curiosityOptions: nextOptions });
      // 持久化会话
      const s = get().currentSession;
      if (s) {
        const updated = { ...s, messages: merged };
        set({ currentSession: updated });
        sessionStorage.saveSession(updated);
      }
    } finally {
      set({ isSendingMessage: false });
    }
  },

  selectCuriosityOption: async (card, option) => {
    // 记录所选项
    set((state) => ({ currentSession: state.currentSession ? { ...state.currentSession, selectedOptions: [...state.currentSession.selectedOptions, option.id] } : state.currentSession }));
    await get().sendUserMessage(card, option.text);
  },
  
  // 会话管理
  startSession: (cardId) => set({
    currentSession: {
      id: Date.now().toString(),
      cardId,
      startTime: new Date(),
      messages: [],
      selectedOptions: [],
      completed: false
    }
  }),
  
  endSession: () => set((state) => ({
    currentSession: state.currentSession ? {
      ...state.currentSession,
      endTime: new Date(),
      completed: true
    } : null
  })),
  
  addSelectedOption: (optionId) => set((state) => ({
    currentSession: state.currentSession ? {
      ...state.currentSession,
      selectedOptions: [...state.currentSession.selectedOptions, optionId]
    } : null
  })),
  
  // 用户偏好
  updatePreferences: (preferences) => set((state) => ({
    userState: {
      ...state.userState,
      preferences: { ...state.userState.preferences, ...preferences }
    }
  })),
  
  // 领域管理
  setDomains: (domains) => set({ domains }),
  
  toggleDomain: (domainId) => set((state) => ({
    selectedDomains: state.selectedDomains.includes(domainId)
      ? state.selectedDomains.filter(id => id !== domainId)
      : [...state.selectedDomains, domainId]
  })),
  
  // 视图切换
  setCurrentView: (view) => set({ currentView: view })
  ,
  // 交互状态
  toggleLike: (cardId: string) => set((state) => ({
    likedCardIds: state.likedCardIds.includes(cardId)
      ? state.likedCardIds.filter(id => id !== cardId)
      : [...state.likedCardIds, cardId]
  })),
  toggleFavorite: (cardId: string) => set((state) => ({
    favoritedCardIds: state.favoritedCardIds.includes(cardId)
      ? state.favoritedCardIds.filter(id => id !== cardId)
      : [...state.favoritedCardIds, cardId]
  })),
  markLearned: (cardId: string) => set((state) => ({
    learnedCardIds: state.learnedCardIds.includes(cardId)
      ? state.learnedCardIds
      : [...state.learnedCardIds, cardId]
  }))
}));

// 智能Agent匹配算法
function getAgentGroup(knowledgeType: string): string[] {
  const coreAgents = ['knowledge_teacher', 'thinking_collider', 'practice_connector'];
  
  const professionalAgent: Record<string, string> = {
    'science': 'science_explainer',
    'history': 'history_narrator', 
    'art': 'art_appreciator',
    'philosophy': 'logic_reasoner',
    'technology': 'science_explainer',
    'literature': 'art_appreciator'
  };
  
  const professional = professionalAgent[knowledgeType];
  return professional ? [...coreAgents, professional] : coreAgents;
}