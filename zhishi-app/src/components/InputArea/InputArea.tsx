import React, { useState, useRef, useEffect } from 'react';
import { Button } from 'antd-mobile';
import './InputArea.css';

interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isSending: boolean;
  onShowQuestionCards?: () => void; // 新增：显示问题卡片
  placeholder?: string;
}

const InputArea: React.FC<InputAreaProps> = ({
  value,
  onChange,
  onSend,
  isSending,
  onShowQuestionCards,
  placeholder = "输入你的问题..."
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isSending) {
        onSend();
      }
    }
  };

  const handleSend = () => {
    if (value.trim() && !isSending) {
      onSend();
    }
  };

  return (
    <div className="input-area">
      <div className="input-container">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          aria-label="问题输入"
          className={`input-field ${isFocused ? 'focused' : ''}`}
          rows={1}
          maxLength={500}
        />
        {onShowQuestionCards && (
          <button
            className="question-cards-toggle"
            onClick={onShowQuestionCards}
            title="选择问题卡片"
            aria-label="选择问题卡片"
          >
            🎯
          </button>
        )}
        <Button
          className={`send-button ${value.trim() ? 'active' : ''}`}
          onClick={handleSend}
          loading={isSending}
          disabled={!value.trim() || isSending}
          aria-label="发送"
        >
          {isSending ? '' : '发送'}
        </Button>
      </div>
      {value.length > 0 && (
        <div className="char-count">
          {value.length}/500
        </div>
      )}
    </div>
  );
};

export default InputArea;
