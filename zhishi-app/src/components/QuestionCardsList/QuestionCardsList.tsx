import React from 'react';
import { Button } from 'antd-mobile';
import type { CuriosityOption } from '../../types';
import './QuestionCardsList.css';

interface QuestionCardsListProps {
  options: CuriosityOption[];
  onSelectCard: (option: CuriosityOption) => void;
  onCustomInput: () => void;
}

const QuestionCardsList: React.FC<QuestionCardsListProps> = ({
  options,
  onSelectCard,
  onCustomInput
}) => {
  // 获取好奇心图标
  const getCuriosityIcon = (curiosity: string): string => {
    const iconMap: Record<string, string> = {
      '科学探索': '🔥',
      '历史对比': '📜',
      '深度思考': '💡',
      '实践应用': '🔧',
      '反向思维': '🔄',
      '跨界联想': '🌐',
      '未来展望': '🚀',
      '原理解析': '⚙️',
      '科学原理': '🔥',
      '历史案例': '📜',
      '深度分析': '💡',
      '实际应用': '🔧',
      '深度探索': '🔍',
      '假设思考': '🤔',
      '多角度分析': '🎯',
      '条件变化': '⚡',
      // 去重：避免重复键
      '未知领域': '🌟',
      '创新思维': '💫',
      '批判思考': '🎭',
      '系统思维': '🧩',
      '类比推理': '🔗',
      '因果分析': '⚡',
      '趋势预测': '📈',
      '影响评估': '⚖️',
      '解决方案': '🎯',
      '风险评估': '⚠️',
      '机会识别': '🎪',
      '创新突破': '💥'
    };
    return iconMap[curiosity] || '❓';
  };

  return (
    <div className="question-cards-container">
      {/* 卡片滚动区域 */}
      <div className="cards-scroll-area">
        {options.map((option, index) => (
          <div
            key={option.id}
            className="question-card"
            onClick={() => onSelectCard(option)}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="question-card-icon">
              {getCuriosityIcon(option.curiosity)}
            </div>
            <div className="question-card-title">
              {option.text}
            </div>
            <div className="question-card-tag">
              {option.curiosity}
            </div>
          </div>
        ))}
      </div>

      {/* 固定底部按钮 */}
      <div className="custom-input-button" onClick={onCustomInput}>
        <span>💭</span>
        <span>自己提问</span>
      </div>
    </div>
  );
};

export default QuestionCardsList;
