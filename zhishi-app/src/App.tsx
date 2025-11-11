import { useEffect } from 'react';
import { ConfigProvider } from 'antd-mobile';
import zhCN from 'antd-mobile/es/locales/zh-CN';
import { useAppStore } from './stores/appStore';
import type { KnowledgeDomain, KnowledgeCard } from './types';
import { LocalStorage } from './utils/localStorage';
import DomainSelector from './components/DomainSelector/DomainSelector';
import CardSwiper from './components/CardSwiper/CardSwiper';
import LearningMode from './components/LearningMode/LearningMode';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import './App.css';

// 初始化知识领域配置
const initialDomains: KnowledgeDomain[] = [
  // 经典知识领域（6个）
  {
    id: 'science',
    name: '科学',
    icon: '🔬',
    color: '#4CAF50',
    subCategories: ['物理', '化学', '生物', '数学', '天文', '地理'],
    type: 'classic',
    description: '探索自然界的奥秘',
    attractionTags: ['实验', '发现', '理论']
  },
  {
    id: 'history',
    name: '历史',
    icon: '📚',
    color: '#795548',
    subCategories: ['古代史', '近代史', '现代史', '世界史', '中国史'],
    type: 'classic',
    description: '了解人类文明的发展',
    attractionTags: ['故事', '人物', '事件']
  },
  {
    id: 'literature',
    name: '文学',
    icon: '📖',
    color: '#E91E63',
    subCategories: ['古典文学', '现代文学', '外国文学', '诗歌', '小说'],
    type: 'classic',
    description: '感受文字的魅力',
    attractionTags: ['经典', '名著', '诗歌']
  },
  {
    id: 'technology',
    name: '技术',
    icon: '💻',
    color: '#2196F3',
    subCategories: ['人工智能', '区块链', '量子计算', '生物技术', '新能源'],
    type: 'classic',
    description: '体验科技的力量',
    attractionTags: ['创新', '突破', '未来']
  },
  {
    id: 'art',
    name: '艺术',
    icon: '🎨',
    color: '#FF9800',
    subCategories: ['绘画', '音乐', '雕塑', '建筑', '设计'],
    type: 'classic',
    description: '欣赏美的创造',
    attractionTags: ['美学', '创作', '灵感']
  },
  {
    id: 'philosophy',
    name: '哲学',
    icon: '🤔',
    color: '#9C27B0',
    subCategories: ['伦理学', '认识论', '存在论', '逻辑学', '美学'],
    type: 'classic',
    description: '思考人生的意义',
    attractionTags: ['思辨', '智慧', '真理']
  },
  
  // 反常识领域（5个）
  {
    id: 'counterintuitive_science',
    name: '反常识科学',
    icon: '⚡',
    color: '#FF5722',
    subCategories: ['量子力学', '相对论', '混沌理论', '复杂系统'],
    type: 'counterintuitive',
    description: '颠覆常识的科学发现',
    attractionTags: ['反直觉', '震撼', '颠覆']
  },
  {
    id: 'counterintuitive_history',
    name: '反常识历史',
    icon: '🔄',
    color: '#607D8B',
    subCategories: ['历史误解', '隐藏真相', '另类解读'],
    type: 'counterintuitive',
    description: '重新审视历史',
    attractionTags: ['真相', '误解', '重新解读']
  },
  {
    id: 'counterintuitive_psychology',
    name: '反常识心理',
    icon: '🧠',
    color: '#E91E63',
    subCategories: ['认知偏差', '行为经济学', '社会心理学'],
    type: 'counterintuitive',
    description: '揭示心理的奥秘',
    attractionTags: ['认知', '偏差', '行为']
  },
  {
    id: 'counterintuitive_economics',
    name: '反常识经济',
    icon: '💰',
    color: '#4CAF50',
    subCategories: ['行为经济学', '博弈论', '市场异常'],
    type: 'counterintuitive',
    description: '经济学的另类视角',
    attractionTags: ['行为', '博弈', '异常']
  },
  {
    id: 'counterintuitive_life',
    name: '反常识生活',
    icon: '🏠',
    color: '#FF9800',
    subCategories: ['生活技巧', '健康误区', '效率提升'],
    type: 'counterintuitive',
    description: '生活的另类智慧',
    attractionTags: ['技巧', '误区', '效率']
  },
  
  // 趣味冷知识领域（4个）
  {
    id: 'universe_mysteries',
    name: '宇宙奥秘',
    icon: '🌌',
    color: '#673AB7',
    subCategories: ['黑洞', '暗物质', '平行宇宙', '时间旅行'],
    type: 'fun',
    description: '探索宇宙的终极秘密',
    attractionTags: ['神秘', '未知', '探索']
  },
  {
    id: 'nature_wonders',
    name: '生物奇观',
    icon: '🦋',
    color: '#4CAF50',
    subCategories: ['极端生物', '进化奇迹', '生物超能力'],
    type: 'fun',
    description: '发现生命的奇迹',
    attractionTags: ['奇迹', '进化', '超能力']
  },
  {
    id: 'unsolved_mysteries',
    name: '未解之谜',
    icon: '🔍',
    color: '#FF5722',
    subCategories: ['古代文明', '神秘现象', '超自然事件'],
    type: 'fun',
    description: '探索未解之谜',
    attractionTags: ['神秘', '未解', '探索']
  },
  {
    id: 'cutting_edge_tech',
    name: '黑科技',
    icon: '🚀',
    color: '#2196F3',
    subCategories: ['量子技术', '脑机接口', '基因编辑', '纳米技术'],
    type: 'fun',
    description: '体验未来科技',
    attractionTags: ['未来', '突破', '科技']
  }
];

const App: React.FC = () => {
  const {
    // 状态
    currentView,
    selectedDomains,
    cards,
    currentCard,
    
    // 方法
    setDomains,
    setSelectedDomains,
    setCurrentView,
    setCurrentCard,
    generateInitialCards,
    loadCardsFromLocal,
    enterLearningMode,
    exitLearningMode
  } = useAppStore();

  // 初始化应用
  useEffect(() => {
    // 设置知识领域
    setDomains(initialDomains);
    
    // 1. 先尝试从本地加载卡片
    loadCardsFromLocal();
    
    // 2. 加载用户选择的领域
    const savedDomains = LocalStorage.getSelectedDomains();
    if (savedDomains.length > 0) {
      setSelectedDomains(savedDomains);
    }
    
    // 3. 如果本地没有卡片且已选择领域，则生成初始卡片
    if (cards.length === 0 && selectedDomains.length > 0) {
      generateInitialCards();
    }
  }, [setDomains, setSelectedDomains, loadCardsFromLocal, generateInitialCards, cards.length, selectedDomains.length]);

  // 处理领域选择确认
  const handleDomainConfirm = () => {
    if (selectedDomains.length > 0) {
      setCurrentView('cardSwiper');
      // 保存用户选择
      LocalStorage.saveSelectedDomains(selectedDomains);
      // 生成初始卡片
      generateInitialCards();
    }
  };

  // 处理跳过领域选择
  const handleDomainSkip = () => {
    setCurrentView('cardSwiper');
    // 使用默认领域生成卡片
    const defaultDomains = ['science', 'history', 'literature'];
    setSelectedDomains(defaultDomains);
    generateInitialCards();
  };


  // 处理进入学习模式
  const handleEnterLearning = (card: KnowledgeCard) => {
    setCurrentCard(card);
    enterLearningMode(card);
  };

  // 处理退出学习模式
  const handleExitLearning = () => {
    exitLearningMode();
  };

  // 处理卡片分享
  const handleCardShare = (cardId: string) => {
    console.log('分享卡片:', cardId);
  };

  // 渲染当前视图
  const renderCurrentView = () => {
    switch (currentView) {
      case 'domainSelector':
        return (
          <DomainSelector
            domains={initialDomains}
            selectedDomains={selectedDomains}
            onDomainToggle={(domainId) => {
              const newSelected = selectedDomains.includes(domainId)
                ? selectedDomains.filter(id => id !== domainId)
                : [...selectedDomains, domainId];
              setSelectedDomains(newSelected);
            }}
            onConfirm={handleDomainConfirm}
            onSkip={handleDomainSkip}
          />
        );
      
      case 'cardSwiper':
        return (
          <CardSwiper
            onEnterLearning={handleEnterLearning}
            onCardShare={handleCardShare}
          />
        );
      
      case 'learning':
        return currentCard ? (
          <LearningMode
            card={currentCard}
            onExit={handleExitLearning}
          />
        ) : null;
      
      default:
        return null;
    }
  };

  return (
    <ConfigProvider locale={zhCN}>
      <ErrorBoundary>
        <div className="app">
          {renderCurrentView()}
      </div>
      </ErrorBoundary>
    </ConfigProvider>
  );
};

export default App;