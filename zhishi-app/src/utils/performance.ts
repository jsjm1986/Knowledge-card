// 性能监控工具
export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map();

  // 开始计时
  static startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }

  // 结束计时并记录
  static endTimer(name: string): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`Timer ${name} was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);
    
    // 只在开发环境记录性能数据
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  // 测量函数执行时间
  static async measureAsync<T>(
    name: string, 
    fn: () => Promise<T>
  ): Promise<T> {
    this.startTimer(name);
    try {
      const result = await fn();
      this.endTimer(name);
      return result;
    } catch (error) {
      this.endTimer(name);
      throw error;
    }
  }

  // 测量同步函数执行时间
  static measure<T>(name: string, fn: () => T): T {
    this.startTimer(name);
    try {
      const result = fn();
      this.endTimer(name);
      return result;
    } catch (error) {
      this.endTimer(name);
      throw error;
    }
  }

  // 获取内存使用情况
  static getMemoryInfo(): any {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }

  // 记录页面加载性能
  static logPageLoadPerformance(): void {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      console.log('📊 页面加载性能:', {
        'DNS查询': `${(navigation.domainLookupEnd - navigation.domainLookupStart).toFixed(2)}ms`,
        'TCP连接': `${(navigation.connectEnd - navigation.connectStart).toFixed(2)}ms`,
        '请求响应': `${(navigation.responseEnd - navigation.requestStart).toFixed(2)}ms`,
        'DOM解析': `${(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart).toFixed(2)}ms`,
        '页面完全加载': `${(navigation.loadEventEnd - navigation.loadEventStart).toFixed(2)}ms`,
        '总加载时间': `${(navigation.loadEventEnd - navigation.fetchStart).toFixed(2)}ms`
      });
    }
  }
}
