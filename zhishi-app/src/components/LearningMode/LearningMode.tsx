import React, { useState, useEffect } from 'react';
import { Button, Toast } from 'antd-mobile';
import type { KnowledgeCard, AgentMessage, CuriosityOption } from '../../types';
import AgentChat from '../AgentChat/AgentChat';
import InputArea from '../InputArea/InputArea';
import QuestionCardsList from '../QuestionCardsList/QuestionCardsList';
import { GLMService } from '../../services/GLMService';
import { useAppStore } from '../../stores/appStore';
import './LearningMode.css';

interface LearningModeProps {
  card: KnowledgeCard;
  onExit: () => void;
}

const LearningMode: React.FC<LearningModeProps> = ({ card, onExit }) => {
  const [currentView, setCurrentView] = useState<'questionCards' | 'conversation'>('questionCards');
  const [userInput, setUserInput] = useState('');

  const messages = useAppStore(s => s.messages);
  const curiosityOptions = useAppStore(s => s.curiosityOptions);
  const isLearningLoading = useAppStore(s => s.isLearningLoading);
  const isSendingMessage = useAppStore(s => s.isSendingMessage);
  const initLearningForCard = useAppStore(s => s.initLearningForCard);
  const sendUserMessage = useAppStore(s => s.sendUserMessage);
  const selectCuriosityOption = useAppStore(s => s.selectCuriosityOption);

  // 获取Agent群组
  const getAgentGroup = (domain: string) => {
    const coreAgents = [
      { id: 'knowledge_teacher', name: '知识讲解师' },
      { id: 'thinking_collider', name: '思维碰撞者' },
      { id: 'practice_connector', name: '实践连接者' }
    ];

    const professionalAgents = [
      { id: 'science_explainer', name: '科学解释者' },
      { id: 'history_narrator', name: '历史叙述者' },
      { id: 'art_appreciator', name: '艺术鉴赏者' },
      { id: 'logic_reasoner', name: '逻辑推理者' }
    ];

    // 根据领域选择专业Agent
    let selectedProfessional = professionalAgents[0]; // 默认选择第一个
    if (domain.includes('科学') || domain.includes('技术')) {
      selectedProfessional = professionalAgents[0];
    } else if (domain.includes('历史') || domain.includes('文化')) {
      selectedProfessional = professionalAgents[1];
    } else if (domain.includes('艺术') || domain.includes('文学')) {
      selectedProfessional = professionalAgents[2];
    } else if (domain.includes('哲学') || domain.includes('逻辑')) {
      selectedProfessional = professionalAgents[3];
    }

    return [...coreAgents, selectedProfessional];
  };

  // 启动学习会话
  const startLearningSession = async () => {
    try {
      await initLearningForCard(card);
    } catch (error) {
      console.error('初始化学习模式失败:', error);
      Toast.show('初始化失败，请重试');
    }
  };

  // 发送用户消息
  const handleSendMessage = async () => {
    if (!userInput.trim() || isSendingMessage) return;

    const text = userInput.trim();
    setUserInput('');
    await sendUserMessage(card, text);
  };

  // 处理卡片选择
  const handleCardSelect = async (option: CuriosityOption) => {
    // 创建用户消息
    const userMessage: AgentMessage = {
      agentId: 'user',
      agentName: '你',
      message: option.text,
      timestamp: new Date(),
      messageType: 'text',
      relatedCardId: card.id,
      isUser: true
    };
    
    setCurrentView('conversation');
    
    // 获取Agent回复
    try {
      await selectCuriosityOption(card, option);
    } catch (error) {
      console.error('获取Agent回复失败:', error);
      Toast.show('获取回复失败，请重试');
    }
  };

  // 切换到自定义输入
  const handleCustomInput = () => {
    setCurrentView('conversation');
  };

  // 显示问题卡片
  const handleShowQuestionCards = () => {
    setCurrentView('questionCards');
  };

  // 处理退出学习
  const handleExit = () => {
    onExit();
  };

  // 切换快捷选项显示
  const toggleQuickOptions = () => {
    setIsQuickOptionsVisible(!isQuickOptionsVisible);
  };

  // 初始化学习会话
  useEffect(() => {
    startLearningSession();
  }, []);

  if (isLearningLoading) {
    return (
      <div className="learning-mode">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>AI助手正在准备精彩内容...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="learning-mode">
      {/* 简化的头部 */}
      <div className="learning-header">
        <Button 
          color="default" 
          size="small"
          onClick={handleExit}
        >
          ← 返回
        </Button>
        <div className="header-title">
          <h3>{card.title}</h3>
        </div>
        <Button size="small">•••</Button>
      </div>

      {currentView === 'questionCards' ? (
        <QuestionCardsList
          options={curiosityOptions}
          onSelectCard={handleCardSelect}
          onCustomInput={handleCustomInput}
        />
      ) : (
        <>
          {/* 对话内容区域 */}
          <div className="conversation-area">
            <AgentChat messages={messages} />
          </div>

          {/* 输入区域 */}
          <InputArea
            value={userInput}
            onChange={setUserInput}
            onSend={handleSendMessage}
            isSending={isSendingMessage}
            onShowQuestionCards={handleShowQuestionCards}
            placeholder="输入你的问题..."
          />
        </>
      )}
    </div>
  );
};

export default LearningMode;