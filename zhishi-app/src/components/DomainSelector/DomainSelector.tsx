import React from 'react';
import { Button, Space, Tag } from 'antd-mobile';
import type { KnowledgeDomain } from '../../types';
import './DomainSelector.css';

interface DomainSelectorProps {
  domains: KnowledgeDomain[];
  selectedDomains: string[];
  onDomainToggle: (domainId: string) => void;
  onConfirm: () => void;
  onSkip: () => void;
}

const DomainSelector: React.FC<DomainSelectorProps> = ({
  domains,
  selectedDomains,
  onDomainToggle,
  onConfirm,
  onSkip
}) => {
  // 按类型分组领域
  const classicDomains = domains.filter(d => d.type === 'classic');
  const counterintuitiveDomains = domains.filter(d => d.type === 'counterintuitive');
  const funDomains = domains.filter(d => d.type === 'fun');

  const renderDomainCard = (domain: KnowledgeDomain) => {
    const isSelected = selectedDomains.includes(domain.id);
    
    return (
      <div
        key={domain.id}
        className={`domain-card ${isSelected ? 'selected' : ''}`}
        onClick={() => onDomainToggle(domain.id)}
        style={{ borderColor: domain.color }}
      >
        <div className="domain-icon" style={{ color: domain.color }}>
          {domain.icon}
        </div>
        <div className="domain-content">
          <h3 className="domain-name">{domain.name}</h3>
          <p className="domain-description">{domain.description}</p>
          <div className="domain-tags">
            {domain.attractionTags.map((tag, index) => (
              <Tag key={index} color="primary">
                {tag}
              </Tag>
            ))}
          </div>
        </div>
        {isSelected && (
          <div className="selected-indicator">✓</div>
        )}
      </div>
    );
  };

  return (
    <div className="domain-selector">
      <div className="selector-header">
        <h1>选择你感兴趣的知识领域</h1>
        <p>我们将为你推荐最吸引人的知识内容</p>
      </div>

      <div className="domains-container">
        {/* 经典知识领域 */}
        <div className="domain-section">
          <h2 className="section-title">
            📚 经典知识领域
            <span className="section-subtitle">传统学科，深度探索</span>
          </h2>
          <div className="domains-grid">
            {classicDomains.map(renderDomainCard)}
          </div>
        </div>

        {/* 反常识领域 */}
        <div className="domain-section">
          <h2 className="section-title">
            🤯 反常识领域
            <span className="section-subtitle">颠覆认知，震撼真相</span>
          </h2>
          <div className="domains-grid">
            {counterintuitiveDomains.map(renderDomainCard)}
          </div>
        </div>

        {/* 趣味冷知识领域 */}
        <div className="domain-section">
          <h2 className="section-title">
            🎯 趣味冷知识领域
            <span className="section-subtitle">奇闻异事，欲罢不能</span>
          </h2>
          <div className="domains-grid">
            {funDomains.map(renderDomainCard)}
          </div>
        </div>
      </div>

      <div className="selector-footer">
        <div className="selection-info">
          已选择 {selectedDomains.length} 个领域
        </div>
        <Space direction="horizontal" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button 
            color="default" 
            onClick={onSkip}
            style={{ flex: 1, marginRight: 8 }}
          >
            跳过，直接开始
          </Button>
          <Button 
            color="primary" 
            onClick={onConfirm}
            disabled={selectedDomains.length === 0}
            style={{ flex: 1 }}
          >
            开始探索
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default DomainSelector;
