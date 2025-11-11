import React, { useEffect, useRef } from 'react';
import type { AgentMessage } from '../../types';
import './AgentChat.css';

interface AgentChatProps {
  messages: AgentMessage[];
}

const AgentChat: React.FC<AgentChatProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 获取Agent图标
  const getAgentIcon = (agentId: string): string => {
    const icons: Record<string, string> = {
      'knowledge_teacher': '📚',
      'thinking_collider': '⚡',
      'practice_connector': '🔧',
      'science_explainer': '🔬',
      'history_narrator': '📖',
      'art_appreciator': '🎨',
      'logic_reasoner': '🧠'
    };
    return icons[agentId] || '🤖';
  };

  // 获取Agent颜色
  const getAgentColor = (agentId: string): string => {
    const colors: Record<string, string> = {
      'knowledge_teacher': '#4CAF50',
      'thinking_collider': '#FF9800',
      'practice_connector': '#2196F3',
      'science_explainer': '#9C27B0',
      'history_narrator': '#795548',
      'art_appreciator': '#E91E63',
      'logic_reasoner': '#607D8B'
    };
    return colors[agentId] || '#666';
  };

  // 格式化时间
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (messages.length === 0) {
    return (
      <div className="agent-chat">
        <div className="chat-empty">
          <div className="empty-icon">💭</div>
          <p>AI助手正在准备精彩内容...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="agent-chat">
      {/* 对话消息 */}
      <div className="messages-container">
        {messages.map((message, index) => (
          <div
            key={`${message.agentId}-${index}`}
            className={`message-item ${message.isUser ? 'user-message' : 'agent-message'}`}
            style={{ animationDelay: `${index * 0.2}s` }}
          >
            {!message.isUser && (
              <div className="message-avatar">
                <div 
                  className="avatar-icon"
                  style={{ backgroundColor: getAgentColor(message.agentId) }}
                >
                  {getAgentIcon(message.agentId)}
                </div>
              </div>
            )}
            
            <div className="message-content">
              {!message.isUser && (
                <div className="message-header">
                  <span className="agent-name">{message.agentName}</span>
                  <span className="message-time">{formatTime(message.timestamp)}</span>
                </div>
              )}
              
              <div className="message-bubble">
                <div className="message-text">{message.message}</div>
              </div>
            </div>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default AgentChat;
