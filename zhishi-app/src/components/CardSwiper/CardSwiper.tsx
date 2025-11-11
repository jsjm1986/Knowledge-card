import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Tag, Toast } from 'antd-mobile';
import type { KnowledgeCard } from '../../types';
import { useAppStore } from '../../stores/appStore';
import './CardSwiper.css';

// 标签中文化映射
const difficultyMap: Record<string, string> = {
  'easy': '简单',
  'medium': '中等',
  'hard': '困难'
};

const categoryMap: Record<string, string> = {
  'Counterintuitive Psychology': '反常识心理',
  'Quantum Physics': '量子物理',
  'Science History': '科学史',
  'Animal Behavior': '动物行为',
  'Psychology': '心理学',
  'Physics': '物理学',
  'Biology': '生物学',
  'History': '历史',
  'Philosophy': '哲学',
  'Technology': '技术',
  'Literature': '文学',
  'Art': '艺术',
  'Economics': '经济学',
  'Sociology': '社会学',
  'Neuroscience': '神经科学',
  'Chemistry': '化学',
  'Mathematics': '数学',
  'Geography': '地理',
  'Astronomy': '天文学',
  'Medicine': '医学'
};

// 标签图标映射
const tagIcons: Record<string, string> = {
  '反常识': '🔄',
  '冷知识': '❄️',
  '震撼实验': '⚡',
  '简单': '🌟',
  '中等': '⚠️',
  '困难': '🔥',
  '热门': '🔥',
  '精选': '⭐',
  '稀有': '💎',
  '心理学': '🧠',
  '物理学': '⚛️',
  '生物学': '🧬',
  '历史': '📜',
  '哲学': '🤔',
  '技术': '💻',
  '文学': '📚',
  '艺术': '🎨',
  '科学史': '🔬',
  '量子物理': '⚛️',
  '动物行为': '🐧',
  '反常识心理': '🔄'
};

interface CardSwiperProps {
  onEnterLearning: (card: KnowledgeCard) => void;
  onCardShare: (cardId: string) => void;
}

const CardSwiper: React.FC<CardSwiperProps> = ({
  onEnterLearning,
  onCardShare
}) => {
  const {
    cards,
    currentCardIndex,
    isGeneratingCards,
    hasMoreCards,
    setCurrentCardIndex,
    loadMoreCards,
    likedCardIds,
    favoritedCardIds,
    learnedCardIds,
    toggleLike,
    toggleFavorite,
    markLearned
  } = useAppStore();

  const [touchStartY, setTouchStartY] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'up' | 'down' | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [previewDir, setPreviewDir] = useState<'up'|'down'|null>(null);
  const [touchStartTime, setTouchStartTime] = useState<number>(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const currentCard = cards[currentCardIndex];
  const progressPct = cards.length > 0 ? Math.round(((currentCardIndex + 1) / cards.length) * 100) : 0;

  // 从内容中提取要点（简单句号/换行切分，取前3条）
  const getBulletPoints = (text: string): string[] => {
    if (!text) return [];
    const raw = text
      .split(/\n|。|\.|！|!|？|\?/)
      .map(s => s.trim())
      .filter(Boolean);
    return raw.slice(0, 3);
  };

  // 生成标签列表
  const generateTags = (card: KnowledgeCard) => {
    const tags = [];
    
    // 分类标签
    const category = categoryMap[card.category] || card.category;
    tags.push({ text: category, icon: tagIcons[category] || '📝' });
    
    // 难度标签
    const difficulty = difficultyMap[card.difficulty] || card.difficulty;
    tags.push({ text: difficulty, icon: tagIcons[difficulty] || '⭐' });
    
    // 特性标签（基于category判断）
    if (card.category.includes('Counterintuitive') || card.category.includes('反常识')) {
      tags.push({ text: '反常识', icon: '🔄' });
    }
    if (card.category.includes('Science') || card.category.includes('科学')) {
      tags.push({ text: '冷知识', icon: '❄️' });
    }
    if (card.category.includes('Psychology') || card.category.includes('心理')) {
      tags.push({ text: '震撼实验', icon: '⚡' });
    }
    
    // 时长标签（基于难度）
    const duration = card.difficulty === 'easy' ? '3分钟' : card.difficulty === 'medium' ? '5分钟' : '7分钟';
    tags.push({ text: duration, icon: '⏱️' });
    
    // 热度标签（随机）
    const hotTags = ['热门', '精选', '稀有'];
    const randomHot = hotTags[Math.floor(Math.random() * hotTags.length)];
    tags.push({ text: randomHot, icon: tagIcons[randomHot] || '🔥' });
    
    return tags.slice(0, 6); // 最多6个标签
  };

  // 监听当前索引，倒数第2张时预加载
  useEffect(() => {
    if (currentCardIndex >= cards.length - 2 && !isGeneratingCards && cards.length > 0) {
      loadMoreCards();
    }
  }, [currentCardIndex, cards.length, isGeneratingCards, loadMoreCards]);

  // 触摸开始
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStartY(touch.clientY);
    setTouchStartX(touch.clientX);
    setIsDragging(true);
    setTranslateY(0);
    setTouchStartTime(Date.now());
  }, []);

  // 触摸移动
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStartY;
    const deltaX = touch.clientX - touchStartX;
    
    // 判断是否为垂直滑动
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      // 添加阻力效果，让滑动更自然
      const resistance = 0.8;
      setTranslateY(deltaY * resistance);

      // 同步预览卡片（抖音式）
      if (deltaY < 0 && currentCardIndex < cards.length - 1) {
        if (previewIndex !== currentCardIndex + 1) setPreviewIndex(currentCardIndex + 1);
        if (previewDir !== 'up') setPreviewDir('up');
      } else if (deltaY > 0 && currentCardIndex > 0) {
        if (previewIndex !== currentCardIndex - 1) setPreviewIndex(currentCardIndex - 1);
        if (previewDir !== 'down') setPreviewDir('down');
      } else {
        if (previewIndex !== null) setPreviewIndex(null);
        if (previewDir !== null) setPreviewDir(null);
      }
    }
  }, [isDragging, touchStartY, touchStartX, currentCardIndex, cards.length, previewIndex, previewDir]);

  // 卡片切换动画
  const switchCard = useCallback((direction: 'up' | 'down', newIndex: number) => {
    if (isTransitioning) return;
    
    setSwipeDirection(direction);
    setIsTransitioning(true);
    setPreviewIndex(newIndex);
    
    setTimeout(() => {
      setCurrentCardIndex(newIndex);
      setSwipeDirection(null);
      setPreviewIndex(null);
    }, 460);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 640);
  }, [isTransitioning, setCurrentCardIndex]);

  // 触摸结束
  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // 动态阈值：速度越快阈值越小
    const dt = Math.max(1, Date.now() - touchStartTime);
    const v = Math.abs(translateY) / dt; // px per ms
    const dynamic = Math.max(40, 100 - Math.min(60, v * 250));
    const threshold = dynamic;
    if (translateY > threshold && currentCardIndex > 0) {
      // 向下滑动，显示上一张
      switchCard('down', currentCardIndex - 1);
    } else if (translateY < -threshold && currentCardIndex < cards.length - 1) {
      // 向上滑动，显示下一张
      switchCard('up', currentCardIndex + 1);
    } else if (translateY < -threshold && currentCardIndex === cards.length - 1 && hasMoreCards && !isGeneratingCards) {
      // 滑到最后一张且有更多卡片，触发加载
      switchCard('up', currentCardIndex);
      loadMoreCards();
    }
    
    setTranslateY(0);
    setPreviewIndex(null);
    setPreviewDir(null);
  }, [isDragging, translateY, currentCardIndex, cards.length, setCurrentCardIndex, switchCard, hasMoreCards, isGeneratingCards, loadMoreCards]);

  // 防止默认滚动行为
  useEffect(() => {
    const handleTouchMovePassive = (e: TouchEvent) => {
      if (isDragging) {
        e.preventDefault();
      }
    };
    
    const cardElement = cardRef.current;
    if (cardElement) {
      cardElement.addEventListener('touchmove', handleTouchMovePassive, { passive: false });
    }
    
    return () => {
      if (cardElement) {
        cardElement.removeEventListener('touchmove', handleTouchMovePassive);
      }
    };
  }, [isDragging]);

  // 处理卡片操作
  const handleCardLike = () => {
    if (currentCard) {
      toggleLike(currentCard.id);
      Toast.show(likedCardIds.includes(currentCard.id) ? '已取消点赞' : '已点赞');
    }
  };

  const handleCardShare = () => {
    if (currentCard) {
      onCardShare(currentCard.id);
      Toast.show('分享成功');
    }
  };

  const handleEnterLearning = () => {
    if (currentCard) {
      markLearned(currentCard.id);
      onEnterLearning(currentCard);
    }
  };

  if (!currentCard) {
    return (
      <div className="card-swiper">
        <div className="card-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>正在生成知识卡片...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-swiper">
      <div className="card-container">
               <div
                  ref={cardRef}
                  className={`knowledge-card ${
                    isTransitioning
                      ? (swipeDirection === 'up' ? 'flip-out-up' : swipeDirection === 'down' ? 'flip-out-down' : '')
                      : ''
                  }`}
                  style={{
                    ['--flip-p' as any]: String(Math.min(Math.abs(translateY) / 180, 1)),
                    ['--flip-dir' as any]: translateY < 0 ? '1' : translateY > 0 ? '-1' : '0',
                    transform: isTransitioning ? undefined : `translateY(${translateY}px)` ,
                    opacity: isTransitioning ? undefined : (isDragging ? Math.max(0.5, 1 - Math.abs(translateY) / 500) : 1),
                    transition: isTransitioning ? undefined : 'transform 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease-out',
                    filter: isTransitioning ? undefined : (isDragging ? `blur(${Math.abs(translateY) / 260}px)` : 'blur(0px)')
                  }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
          <div className="card-content">
            <div className="meta-bar">
              <div className="meta-left">
                <span className="chip chip-primary">{categoryMap[currentCard.category] || currentCard.category}</span>
                <span className={`chip chip-${currentCard.difficulty}`}>{difficultyMap[currentCard.difficulty] || currentCard.difficulty}</span>
                <span className="chip chip-neutral">{currentCard.difficulty === 'easy' ? '3分钟' : currentCard.difficulty === 'medium' ? '5分钟' : '7分钟'}</span>
              </div>
              <div className="meta-right">
                <span className="index-text">{currentCardIndex + 1}/{cards.length}</span>
              </div>
            </div>

            <div className="card-title">{currentCard.title}</div>
            {/* 导语（前两句） */}
            <div className="card-text">
              <p>{currentCard.content}</p>
            </div>

            {/* 要点列表 */}
            {getBulletPoints(currentCard.content).length > 0 && (
              <ul className="keypoints">
                {getBulletPoints(currentCard.content).map((p, i) => (
                  <li key={i} className="keypoint-item">{p}</li>
                ))}
              </ul>
            )}
            <div className="progress"><div className="progress-fill" style={{ width: `${progressPct}%` }} /></div>

            {/* 信息栏：生成状态 / 进度条 / 索引 */}
            <div className="info-bar">
              {isGeneratingCards && currentCardIndex >= cards.length - 2 ? (
                <span className="pill pill-loading">正在生成新知识…</span>
              ) : (
                <span className="muted">已加载 {cards.length} 张</span>
              )}
              <div className="progress progress-slim"><div className="progress-fill" style={{ width: `${progressPct}%` }} /></div>
              <span className="muted">{currentCardIndex + 1}/{cards.length}</span>
            </div>

            <div className="card-tags">
              {generateTags(currentCard).map((tag, index) => (
                <Tag 
                  key={index}
                  color={index === 0 ? 'primary' : index === 1 ? (currentCard.difficulty === 'easy' ? 'success' : currentCard.difficulty === 'medium' ? 'warning' : 'danger') : 'default'}
                >
                  {tag.icon} {tag.text}
                </Tag>
              ))}
            </div>
          </div>
          
          <div className="card-actions">
            <div className="status-badges">
              {learnedCardIds.includes(currentCard.id) && <span className="badge" title="已学">✅</span>}
              <button className="badge" title={favoritedCardIds.includes(currentCard.id) ? '已收藏' : '收藏'} onClick={() => toggleFavorite(currentCard.id)}>
                {favoritedCardIds.includes(currentCard.id) ? '💖' : '🔖'}
              </button>
            </div>
            <Button 
              color="default" 
              size="small"
              aria-label={likedCardIds.includes(currentCard.id) ? '取消点赞' : '点赞'}
              onClick={handleCardLike}
            >
              {likedCardIds.includes(currentCard.id) ? '💙' : '👍'}
            </Button>
            <Button 
              color="primary" 
              size="small"
              aria-label="进入深度学习"
              onClick={handleEnterLearning}
            >
              深度学习
            </Button>
            <Button 
              color="default" 
              size="small"
              aria-label="分享卡片"
              onClick={handleCardShare}
            >
              📤
            </Button>
          </div>
          {/* 预渲染下一张/上一张用于抖音式切换进入动画 */}
          {previewIndex !== null && cards[previewIndex] && (
            (() => {
              const progress = Math.min(Math.abs(translateY) / 160, 1);
              const baseOffset = 36; // 更贴近底/顶
              const offset = baseOffset * (1 - progress);
              const opacity = 0.2 + 0.8 * progress;
              const blur = 6 * (1 - progress);
              return (
                <div
                  className={`knowledge-card ghost-card ${
                    previewDir === 'up' ? 'ghost-bottom' : previewDir === 'down' ? 'ghost-top' : ''
                  } ${isTransitioning ? (swipeDirection === 'up' ? 'flip-in-up' : swipeDirection === 'down' ? 'flip-in-down' : '') : ''}`}
                  style={{
                    transform: isTransitioning
                      ? undefined
                      : previewDir === 'up'
                        ? `translateX(-50%) translateY(${offset}px)`
                        : previewDir === 'down'
                          ? `translateX(-50%) translateY(${-offset}px)`
                          : `translate(-50%, -50%)`,
                    opacity: isTransitioning ? undefined : opacity,
                    filter: isTransitioning ? undefined : `blur(${blur}px)`
                  }}
                >
              <div className="card-content">
                <div className="meta-bar">
                  <div className="meta-left">
                    <span className="chip chip-primary">{categoryMap[cards[previewIndex].category] || cards[previewIndex].category}</span>
                    <span className={`chip chip-${cards[previewIndex].difficulty}`}>{difficultyMap[cards[previewIndex].difficulty] || cards[previewIndex].difficulty}</span>
                    <span className="chip chip-neutral">{cards[previewIndex].difficulty === 'easy' ? '3分钟' : cards[previewIndex].difficulty === 'medium' ? '5分钟' : '7分钟'}</span>
                  </div>
                </div>
                <div className="card-title">{cards[previewIndex].title}</div>
                <div className="card-text"><p>{cards[previewIndex].content}</p></div>
              </div>
              {/* 页角拟物效果 */}
              <div className="page-corner corner-top" style={{ opacity: previewDir === 'down' ? Math.min(Math.abs(translateY) / 120, 1) : 0 }}>
                <div className="corner-highlight"></div>
                <div className="corner-shadow"></div>
              </div>
              <div className="page-corner corner-bottom" style={{ opacity: previewDir === 'up' ? Math.min(Math.abs(translateY) / 120, 1) : 0 }}>
                <div className="corner-highlight"></div>
                <div className="corner-shadow"></div>
              </div>
                </div>
              );
            })()
          )}
        </div>

        {/* 底部滑动提示已移除，信息整合至 info-bar */}
      </div>
    </div>
  );
};

export default CardSwiper;