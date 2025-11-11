import type { KnowledgeCard, AgentMessage, CuriosityOption } from '../types';
import { PerformanceMonitor } from '../utils/performance';

// GLM-4.5-Flash API 调用封装
export class GLMService {
  static API_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
  static API_KEY = 'e52c8339a2894c3489ab5433fb63d509.AIN611Qudh8hUkor';

  // 尝试更稳健地解析可能含有Markdown/多余文本/尾逗号的JSON
  private static safeParseJson(raw: string): any | null {
    try {
      let s = raw.trim();
      // 去除代码块围栏
      if (s.startsWith('```json')) s = s.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      else if (s.startsWith('```')) s = s.replace(/^```\s*/, '').replace(/\s*```$/, '');
      // 提取第一个 '{' 到最后一个 '}' 的子串
      const start = s.indexOf('{');
      const end = s.lastIndexOf('}');
      if (start >= 0 && end > start) s = s.slice(start, end + 1);
      // 去除可能的BOM与回车
      s = s.replace(/^\uFEFF/, '').replace(/\r/g, '');
      // 简单移除尾逗号
      s = s.replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(s);
    } catch {
      return null;
    }
  }

  // 规范化为 KnowledgeCard[]（容错：顶层数组或对象、字段名差异等）
  private static coerceCardsJson(domains: string[], parsed: any): KnowledgeCard[] | null {
    if (!parsed) return null;
    const src = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.cards) ? parsed.cards : null);
    if (!src) return null;
    const now = Date.now();
    const out: KnowledgeCard[] = (src as any[]).map((o: any, idx: number) => ({
      id: o.id?.toString?.() || `gen_${now}_${idx}`,
      title: o.title || o.heading || '未命名卡片',
      content: o.content || o.text || '',
      difficulty: (o.difficulty === 'easy' || o.difficulty === 'medium' || o.difficulty === 'hard') ? o.difficulty : 'medium',
      category: o.category || o.domain || (domains[0] || '综合'),
      domain: o.domain || o.category || (domains[0] || '综合'),
      relatedDomains: Array.isArray(o.relatedDomains) ? o.relatedDomains : [],
      tags: Array.isArray(o.tags) ? o.tags : [],
      subCategory: o.subCategory || '',
      aiGenerated: true,
      createdAt: new Date()
    })).filter((c: KnowledgeCard) => c.title && c.content);
    return out.length > 0 ? out : null;
  }
  
  // 生成知识卡片
  static async generateCard(domain: string, subCategory: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Promise<KnowledgeCard> {
    const prompt = `
    请为${domain}领域的${subCategory}子分类生成一个${difficulty}难度的知识卡片。
    要求：
    1. 标题简洁有趣，能吸引用户，包含悬念元素
    2. 内容包含核心概念、关键知识点和实际应用
    3. 语言生动易懂，适合移动端阅读
    4. 包含1-2个思考问题
    5. 字数控制在200-300字
    6. 特别关注反常识、冷知识、颠覆认知的内容
    
    请以JSON格式返回，不要包含任何markdown标记：
    {
      "title": "卡片标题",
      "content": "卡片内容",
      "keyPoints": ["要点1", "要点2", "要点3"],
      "questions": ["思考问题1", "思考问题2"],
      "tags": ["标签1", "标签2"]
    }
    `;
    
    try {
      const response = await this.callGLM(prompt);
      const data = this.safeParseJson(response);
      
      return {
        id: Date.now().toString(),
        title: data.title,
        content: data.content,
        difficulty,
        category: domain,
        subCategory,
        tags: data.tags || [],
        aiGenerated: true,
        createdAt: new Date(),
        domain,
        relatedDomains: []
      };
    } catch (error) {
      console.error('生成知识卡片失败:', error);
      throw error;
    }
  }

  // 要点摘要（用于卡片要点区块），失败则本地回退简单切分
  static async summarizeKeyPoints(content: string): Promise<string[]> {
    const prompt = `请从以下内容中提炼3条简洁的关键要点（每条不超过20字），返回JSON数组：\n${content}`;
    try {
      const response = await this.callGLM(prompt);
      let clean = response.trim();
      if (clean.startsWith('```json')) clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      else if (clean.startsWith('```')) clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
      const data = JSON.parse(clean);
      return Array.isArray(data) ? data.slice(0,3) : [];
    } catch {
      return content
        .split(/\n|。|\.|！|!|？|\?/)
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0,3);
    }
  }
  
  // 获取Agent回复
  static async getAgentResponse(agentId: string, cardContext: KnowledgeCard): Promise<AgentMessage> {
    const agentPrompts = {
      // 核心Agent（3个必选）
      'knowledge_teacher': `
        你是知识讲解师，一位耐心的启蒙导师。你的使命是：
        1. 用悬念式开头吸引用户注意力，让用户无法拒绝继续阅读
        2. 建立准确、清晰的知识基础，用震撼的事实和案例
        3. 用简单易懂的语言解释核心概念，避免复杂术语
        4. 循序渐进地引导用户建立知识框架，层层递进
        
        风格：耐心、清晰、循序渐进、悬念式开头、震撼案例
        目标：确保知识基础的准确性和可理解性，让用户欲罢不能
        回复长度：控制在60-100字以内
        禁止：不要反问用户，专注于内容输出
      `,
      'thinking_collider': `
        你是思维碰撞者，一位犀利的思辨者。你的使命是：
        1. 展示不同观点和认知冲突，创造思维碰撞
        2. 用震撼的事实挑战既有认知，让用户重新思考
        3. 揭示知识背后的争议和复杂性，增加深度
        4. 创造思维碰撞，让学习变得激烈有趣
        
        风格：犀利、思辨、挑战性、震撼事实、认知冲突
        目标：培养批判性思维，激发深度思考，让用户重新审视
        回复长度：控制在60-100字以内
        禁止：不要反问用户，专注于观点展示
      `,
      'practice_connector': `
        你是实践连接者，一位务实的实干家。你的使命是：
        1. 提供震撼的应用案例，让用户看到知识的威力
        2. 展示理论知识如何解决实际问题，用具体例子
        3. 用令人惊叹的事实验证抽象概念
        4. 让知识变得实用有趣，增加用户获得感
        
        风格：务实、具体、可操作、震撼案例、实用价值
        目标：连接理论与现实，提升实践能力，让用户获得成就感
        回复长度：控制在60-100字以内
        禁止：不要反问用户，专注于案例展示
      `,
      
      // 专业领域Agent（4个可选）
      'science_explainer': `
        你是科学解释者，一位严谨的科学家。你的使命是：
        1. 用科学的方法和思维解释科学概念
        2. 确保科学知识的准确性和客观性
        3. 用实验和证据支持科学理论
        4. 培养用户的科学思维
        
        风格：客观、准确、逻辑性强、严谨
        目标：培养科学思维，确保科学知识的准确性
        回复长度：控制在60-100字以内
        禁止：不要反问用户，专注于内容输出
      `,
      'history_narrator': `
        你是历史叙述者，一位博学的历史学家。你的使命是：
        1. 用生动的故事叙述历史事件
        2. 梳理历史的时间线和因果关系
        3. 揭示历史事件背后的深层原因
        4. 帮助用户理解历史的复杂性
        
        风格：生动、有故事性、有深度、客观
        目标：培养历史思维，理解历史的复杂性
        回复长度：控制在60-100字以内
        禁止：不要反问用户，专注于内容输出
      `,
      'art_appreciator': `
        你是艺术鉴赏者，一位感性的艺术导师。你的使命是：
        1. 深度解读艺术作品的美学价值
        2. 培养用户的美学感知和情感共鸣
        3. 揭示艺术作品背后的文化内涵
        4. 激发用户的艺术想象力
        
        风格：感性、富有诗意、启发式、审美
        目标：培养美学感知，提升艺术鉴赏能力
        回复长度：控制在60-100字以内
        禁止：不要反问用户，专注于内容输出
      `,
      'logic_reasoner': `
        你是逻辑推理者，一位严谨的逻辑学家。你的使命是：
        1. 梳理逻辑关系和推理过程
        2. 培养用户的逻辑思维能力
        3. 帮助用户识别逻辑错误和谬误
        4. 用严密的逻辑推理解决问题
        
        风格：严谨、精确、条理清晰、逻辑性强
        目标：培养逻辑思维，提升推理能力
        回复长度：控制在60-100字以内
        禁止：不要反问用户，专注于内容输出
      `
    };
    
    const prompt = `
    ${agentPrompts[agentId as keyof typeof agentPrompts]}
    
    当前知识卡片：${JSON.stringify(cardContext)}
    
    请给出回复（控制在60-100字以内）：
    `;
    
    try {
      const response = await this.callGLM(prompt);
      
      return {
        agentId,
        agentName: this.getAgentName(agentId),
        message: response,
        timestamp: new Date(),
        messageType: 'text',
        relatedCardId: cardContext.id
      };
    } catch (error) {
      console.error('获取Agent回复失败:', error);
      throw error;
    }
  }
  
  // 生成好奇心驱动选择选项
  static async generateCuriosityOptions(cardContext: KnowledgeCard, currentTopic: string): Promise<CuriosityOption[]> {
    const prompt = `
    基于当前知识卡片内容，生成3-4个让用户难以拒绝的好奇心驱动选择选项。
    
    当前知识卡片：${JSON.stringify(cardContext)}
    当前话题：${currentTopic}
    
    要求：
    1. 每个选项都要包含悬念和好奇心元素
    2. 选项要让人无法拒绝，想要立即点击
    3. 选项要引导用户深入探索相关知识
    4. 选项要简短有力，不超过15个字
    5. 避免反问句，使用陈述句或感叹句
    6. 特别关注反常识、冷知识、颠覆认知的内容
    
    请以JSON格式返回，不要包含任何markdown标记：
    {
      "options": [
        {"id": "option1", "text": "选项1文本", "curiosity": "好奇心描述", "nextTopic": "下一个话题"},
        {"id": "option2", "text": "选项2文本", "curiosity": "好奇心描述", "nextTopic": "下一个话题"},
        {"id": "option3", "text": "选项3文本", "curiosity": "好奇心描述", "nextTopic": "下一个话题"},
        {"id": "option4", "text": "选项4文本", "curiosity": "好奇心描述", "nextTopic": "下一个话题"}
      ]
    }
    `;
    
    try {
      const response = await this.callGLM(prompt);
      
      // 清理响应中的markdown标记
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const data = JSON.parse(cleanResponse);
      
      return data.options.map((option: any) => ({
        id: option.id,
        text: option.text,
        curiosity: option.curiosity,
        nextTopic: option.nextTopic
      }));
    } catch (error) {
      console.error('生成好奇心选项失败:', error);
      throw error;
    }
  }
  
  // 多Agent协作回复
  static async getMultiAgentResponse(cardContext: KnowledgeCard, activeAgents: string[]): Promise<AgentMessage[]> {
    const prompt = `
    请模拟${activeAgents.join('、')}这${activeAgents.length}个AI助手的协作对话。
    
    当前知识卡片：${JSON.stringify(cardContext)}
    
    要求：
    1. 每个助手都要参与讨论，展示不同观点
    2. 用震撼的事实和案例吸引用户
    3. 创造认知冲突和思维碰撞
    4. 不要反问用户，专注于内容输出
    5. 总字数控制在400字以内
    6. 特别关注反常识、冷知识、颠覆认知的内容
    
    请以JSON格式返回，不要包含任何markdown标记：
    {
      "responses": [
        {"agent": "助手名称", "message": "回复内容"},
        {"agent": "助手名称", "message": "回复内容"}
      ]
    }
    `;
    
    try {
      const response = await this.callGLM(prompt);
      
      // 清理响应中的markdown标记
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const data = JSON.parse(cleanResponse);
      
      return data.responses.map((resp: any, index: number) => ({
        agentId: activeAgents[index] || 'unknown',
        agentName: resp.agent,
        message: resp.message,
        timestamp: new Date(),
        messageType: 'text' as const,
        relatedCardId: cardContext.id
      }));
    } catch (error) {
      console.error('获取多Agent回复失败:', error);
      throw error;
    }
  }
  
  // 通用GLM调用方法
  static async callGLM(prompt: string): Promise<string> {
    return PerformanceMonitor.measureAsync('GLM API调用', async () => {
      try {
        const response = await fetch(this.API_BASE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.API_KEY}`
          },
          body: JSON.stringify({
            model: 'glm-4-flash',
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 1000
          })
        });
        
        if (!response.ok) {
          throw new Error(`API调用失败: ${response.status}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
      } catch (error) {
        console.error('GLM API调用失败:', error);
        throw error;
      }
    });
  }
  
  // 生成知识卡片
  static async generateKnowledgeCards(
    domains: string[],
    existingCards: KnowledgeCard[],
    count: number = 5
  ): Promise<KnowledgeCard[]> {
    try {
            // 分析已有卡片，70%相关深入 + 30%随机新主题
            const relatedCount = Math.floor(count * 0.7);
            const randomCount = count - relatedCount;
            
            // 使用randomCount来确保提示词中包含随机主题要求
            const randomTopicHint = randomCount > 0 ? `，其中${randomCount}个为全新的吸引人主题（反常识、冷知识、震撼事实）` : '';
      
      const prompt = `基于以下信息生成${count}个极具吸引力的知识卡片：

用户关注领域：${domains.join('、')}

已有卡片历史：
${existingCards.slice(-3).map(c => `- ${c.title}: ${c.content.substring(0, 50)}...`).join('\n')}

请生成${count}个新的知识卡片，要求：

        【超强吸引力标题公式】：
        必须包含以下元素之一：
        - 数字："3个"、"90%"、"1000倍"、"99%"
        - 疑问："为什么"、"如何"、"真的吗"、"可能吗"
        - 冲突："看似...实则..."、"你以为...其实..."
        - 震撼词："震惊"、"颠覆"、"不可思议"、"揭秘"、"真相"
        
        【标题模板】：
        [震撼词] + [具体数字/事实] + [悬念问题]
        例：震惊！90%的人不知道：量子纠缠竟然能...
        例：为什么爱因斯坦说"上帝不掷骰子"？真相颠覆认知
        例：3个量子实验，彻底改变你对现实的理解

        【震撼内容结构】：
        第一句（震撼开头）：
        - 必须是反常识或令人惊讶的事实
        - 使用"你以为...？"或"你知道吗？"开头
        - 包含具体数字或震撼描述
        
        第二段（核心内容）：
        - 解释背后的原理
        - 用类比让复杂概念简单化
        - 包含具体案例或实验
        
        第三句（悬念结尾）：
        - "更令人震惊的是..."
        - "这还不是最可怕的..."
        - "但真正的秘密是..."
        
        【内容分布】：
        - ${relatedCount}个基于已有内容深入探索（相关主题、不同角度、深度延伸）
        - ${randomCount}个全新的吸引人主题（反常识、冷知识、震撼事实）${randomTopicHint}
        
        【内容要求 - 200-300字】：

        第一句（震撼开头 30-40字）：
        - 反常识问题："你以为...？"
        - 震撼事实："你知道吗？"

        第二段（核心知识 120-180字）：
        ✅ 必须包含：
        1. 具体实验/事件/理论的名称（不能只说"一个实验"）
        2. 具体数字/百分比/数据
        3. 具体发现/现象/结果
        4. 因果关系或原理解释
        5. 具体案例或应用场景

        ❌ 禁止：
        - 只说"通过实验发现"而不说实验名称
        - 只说"科学家发现"而不说具体发现
        - 只有悬念没有知识
        - 只有概念没有案例

        第三段（深入解释 50-80字）：
        - 具体细节或补充案例
        - 例："实验中，'狱警'开始虐待'囚犯'，甚至半夜叫醒他们做俯卧撑"
        - 包含更多具体数据和细节

        第四句（悬念结尾 20-30字）：
        - "更令人震惊的是..."
        - "这背后隐藏着..."
        - "但真正的秘密是..."

        【超强吸引力标题示例】：
        - "震惊！90%的人不知道：量子纠缠速度比光速快10000倍？"
        - "为什么爱因斯坦说'上帝不掷骰子'？真相颠覆认知"
        - "3个量子实验，彻底改变你对现实的理解"
        - "不可思议！这个'错误'竟然拯救了数亿人生命"
        
        【内容示例 - 对比】：

        ❌ 错误（只有吸引力）：
        "你以为时间是恒定的？爱因斯坦的发现颠覆了这个认知！科学家通过实验证明，时间会变慢。更令人震惊的是..."
        → 问题：没有说清楚是什么实验，什么情况下时间会变慢

        ✅ 正确（知识+吸引力）：
        "你以为时间是恒定的？爱因斯坦的相对论颠覆了这个认知！在引力场实验中，科学家把原子钟放在山顶和山脚，发现山脚的时钟每天慢0.00000001秒！这证明引力越强，时间越慢。更震撼的是，GPS卫星每天要校正38微秒，否则定位会偏差11公里！这意味着你的手机每次导航，都在验证相对论。更令人震惊的是..."

        【质量标准】：
        1. 看完标题+内容后，用户能说出至少1个具体知识点
        2. 内容必须包含至少2个具体数字/名称/案例
        3. 每句话都有实质信息，不能只是渲染氛围

返回JSON格式：
{
  "cards": [
    {
      "id": "unique_id",
      "title": "极具吸引力的悬念式标题",
      "content": "震撼开头+核心内容+悬念结尾的引人入胜内容...",
      "category": "知识分类",
      "difficulty": "easy|medium|hard",
      "domain": "所属领域",
      "relatedDomains": ["相关领域1", "相关领域2"],
      "tags": ["标签1", "标签2"]
    }
  ]
}`;

      const response = await this.callGLM(prompt);
      let data = this.safeParseJson(response);
      let normalized = this.coerceCardsJson(domains, data);
      if (normalized) return normalized.slice(0, count);

      // 一次回退重试：极简严格指令
      const fallbackPrompt = `仅输出JSON，不要任何额外文字。结构：{"cards":[{"id":"string","title":"string","content":"string","category":"string","difficulty":"easy|medium|hard","domain":"string","relatedDomains":[],"tags":[]}]}`;
      const response2 = await this.callGLM(fallbackPrompt);
      data = this.safeParseJson(response2);
      normalized = this.coerceCardsJson(domains, data);
      if (normalized) return normalized.slice(0, count);

      throw new Error('解析生成卡片JSON失败');
    } catch (error) {
      console.error('生成知识卡片失败:', error);
      // 返回默认的模拟卡片
      return this.generateMockCards(domains, count);
    }
  }

  // 生成模拟卡片（API失败时的备用方案）
  private static generateMockCards(domains: string[], count: number): KnowledgeCard[] {
        const mockCards: KnowledgeCard[] = [
          {
            id: `mock_${Date.now()}_1`,
            title: '震惊！90%的人不知道：量子纠缠速度比光速快10000倍？',
            content: '你以为光速是宇宙极限？量子纠缠瞬间传递信息，距离再远也是0秒！在2017年的墨子号卫星实验中，科学家在相距1200公里的两个粒子间实现了量子纠缠，改变其中一个粒子的状态，另一个瞬间改变，传递速度超过光速10000倍！爱因斯坦把这叫做"鬼魅般的超距作用"，直到临死都不相信。更震撼的是，这个现象已经被用于量子通信，中国已经建成了4600公里的量子通信网络。在实验中，科学家发现量子纠缠的传递速度是光速的10000倍，这意味着信息传递几乎是瞬时的。这个发现不仅颠覆了我们对物理学的理解，更可能改变未来的通信技术。更令人震惊的是，量子纠缠可能还隐藏着宇宙更深层的秘密...',
            category: 'Quantum Physics',
            difficulty: 'hard',
            domain: domains[0] || '科学',
            relatedDomains: ['物理学', '相对论'],
            tags: ['量子', '纠缠', '光速'],
            subCategory: 'physics',
            aiGenerated: true,
            createdAt: new Date()
          },
      {
        id: `mock_${Date.now()}_2`,
        title: '为什么爱因斯坦说"上帝不掷骰子"？真相颠覆认知',
        content: '你以为爱因斯坦反对量子力学？真相恰恰相反！他说的"上帝不掷骰子"不是否定量子现象，而是认为背后有更深层的规律。在1935年的EPR悖论论文中，爱因斯坦与波多尔斯基、罗森一起质疑量子力学的完备性，认为量子纠缠违反了局域实在论。但当1982年的阿斯派克特实验证明量子纠缠确实存在时，爱因斯坦震惊了。这个实验显示，两个纠缠粒子无论相距多远，测量一个会瞬间影响另一个，概率达到99.9%！更令人震撼的是，这个发现正在颠覆我们对现实本质的理解。实验数据显示，量子纠缠的关联性比经典物理预测的高出40倍，这意味着我们的宇宙可能比我们想象的更加神秘。更令人震惊的是，量子纠缠可能还隐藏着宇宙更深层的秘密...',
        category: 'Physics',
        difficulty: 'hard',
        domain: domains[0] || '科学',
        relatedDomains: ['量子力学', '哲学'],
        tags: ['爱因斯坦', '量子', '现实'],
        subCategory: 'physics',
        aiGenerated: true,
        createdAt: new Date()
      },
      {
        id: `mock_${Date.now()}_3`,
        title: '3个心理学实验，揭示人性的黑暗面',
        content: '你以为自己很善良？这些心理学实验会让你重新认识自己！1971年的斯坦福监狱实验证明：普通人只需6天就能变成施虐者！实验中，学生被随机分为"狱警"和"囚犯"，结果"狱警"开始虐待"囚犯"，甚至半夜叫醒他们做俯卧撑。1961年的米尔格拉姆电击实验更震撼：65%的人会因为"权威命令"而电击他人致死！1951年的阿希从众实验则揭示：75%的人会为了合群而违背自己的判断。这三个实验共同揭示了一个可怕的真相：环境和他人的压力能轻易改变我们的行为。实验数据显示，在权威压力下，65%的参与者会执行可能致命的电击，即使他们内心感到痛苦。更令人震惊的是，这些实验揭示的人性黑暗面可能比我们想象的更加普遍...',
        category: 'Counterintuitive Psychology',
        difficulty: 'medium',
        domain: domains[0] || '科学',
        relatedDomains: ['社会心理学', '行为学'],
        tags: ['实验', '人性', '心理学'],
        subCategory: 'psychology',
        aiGenerated: true,
        createdAt: new Date()
      },
      {
        id: `mock_${Date.now()}_4`,
        title: '不可思议！这个"错误"竟然拯救了数亿人生命',
        content: '你以为错误总是坏事？青霉素的发现源于一个"意外"！1928年9月，英国细菌学家亚历山大·弗莱明在伦敦圣玛丽医院实验室工作，他忘记清理培养皿就度假去了。两周后回来时，发现一个培养皿被青霉菌污染，周围的葡萄球菌全部死亡！这个看似微不足道的"错误"却拯救了数亿人的生命。青霉素在二战期间被称为"神药"，仅1944年就生产了23亿单位，挽救了无数士兵的生命。更令人震撼的是，历史上许多重大发现都源于意外：X射线、微波炉、特氟龙涂层...为什么"错误"往往比"正确"更有价值？',
        category: 'Science History',
        difficulty: 'easy',
        domain: domains[0] || '科学',
        relatedDomains: ['医学', '历史'],
        tags: ['发现', '错误', '医学'],
        subCategory: 'history',
        aiGenerated: true,
        createdAt: new Date()
      },
      {
        id: `mock_${Date.now()}_5`,
        title: '为什么企鹅不会飞？真相颠覆你的认知！',
        content: '你以为企鹅不会飞是因为翅膀太小？真相恰恰相反！企鹅的翅膀已经进化成了高效的"桨"，让它们在水中的游泳速度达到每小时36公里，比大多数鱼类还要快。帝企鹅甚至能潜水到565米深，憋气22分钟！这种进化让它们成为了海洋中的游泳高手，但代价就是永远失去了飞行的能力。更令人震惊的是，企鹅的骨骼密度比鸟类高30%，这让它们能够承受深海的巨大压力。科学家发现，企鹅的祖先在6000万年前是会飞的，但为了适应南极的极端环境，它们选择了游泳而不是飞行。更令人震惊的是...',
        category: 'Animal Behavior',
        difficulty: 'easy',
        domain: domains[0] || '科学',
        relatedDomains: ['生物学', '进化论'],
        tags: ['动物', '进化', '游泳'],
        subCategory: 'biology',
        aiGenerated: true,
        createdAt: new Date()
      }
    ];
    
    return mockCards.slice(0, count);
  }

  // 基于对话历史生成新的好奇心选项
  static async generateNextCuriosityOptions(
    card: KnowledgeCard, 
    messages: AgentMessage[]
  ): Promise<CuriosityOption[]> {
    try {
      const conversationHistory = messages
        .map(msg => `${msg.agentName}: ${msg.message}`)
        .join('\n');

      const prompt = `基于以下知识卡片和对话历史，生成3-4个极具吸引力的下一步探索问题：

知识卡片：
标题：${card.title}
内容：${card.content}
领域：${card.domain}

对话历史：
${conversationHistory}

请生成3-4个好奇心驱动的下一步问题，要求：

【问题策略】：
- 使用悬念式开头："为什么"、"如何"、"揭秘"、"震惊"、"不可思议"
- 包含数字或具体数据："3个秘密"、"90%的人不知道"
- 制造认知冲突："看似不可能，但事实是..."
- 使用强烈动词："颠覆"、"震撼"、"改变"、"揭示"

【内容要求】：
1. 基于对话内容深入探索
2. 问题要引人入胜，有悬念感
3. 每个问题都要有对应的好奇心标签
4. 问题要具体、有趣、能激发继续探索的欲望
5. 结尾要留悬念，暗示更深层的内容

【问题示例】：
- "为什么这个现象会颠覆我们的认知？"
- "3个令人震惊的真相，你知道几个？"
- "这个发现将如何改变我们的未来？"
- "90%的人不知道：背后隐藏着什么秘密？"

返回JSON格式：
{
  "options": [
    {
      "id": "unique_id",
      "text": "极具吸引力的悬念式问题",
      "curiosity": "好奇心标签",
      "nextTopic": "下一个话题"
    }
  ]
}`;

      const response = await this.callGLM(prompt);
      
      // 清理响应中的markdown标记
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const data = JSON.parse(cleanResponse);
      return data.options || [];
    } catch (error) {
      console.error('生成下一步好奇心选项失败:', error);
      // 返回默认的深入探索选项
      return [
        {
          id: 'deep_1',
          text: '这个现象还有哪些我们没讨论到的角度？',
          curiosity: '深度探索',
          nextTopic: '多角度分析'
        },
        {
          id: 'deep_2',
          text: '如果改变一个关键条件会怎样？',
          curiosity: '假设思考',
          nextTopic: '条件变化'
        },
        {
          id: 'deep_3',
          text: '这个知识在实际生活中如何应用？',
          curiosity: '实践应用',
          nextTopic: '实际应用'
        }
      ];
    }
  }

  // 获取Agent名称
  private static getAgentName(agentId: string): string {
    const agentNames: Record<string, string> = {
      'knowledge_teacher': '知识讲解师',
      'thinking_collider': '思维碰撞者',
      'practice_connector': '实践连接者',
      'science_explainer': '科学解释者',
      'history_narrator': '历史叙述者',
      'art_appreciator': '艺术鉴赏者',
      'logic_reasoner': '逻辑推理者'
    };
    
    return agentNames[agentId] || '未知助手';
  }
}
