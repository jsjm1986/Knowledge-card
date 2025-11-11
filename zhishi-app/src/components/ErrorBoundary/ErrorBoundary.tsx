import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Space } from 'antd-mobile';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <h2>😅 出现了一些问题</h2>
          <p>应用遇到了一个错误，请尝试刷新页面</p>
          <Space direction='vertical' style={{ marginTop: '20px' }}>
            <Button 
              color='primary' 
              onClick={() => window.location.reload()}
            >
              刷新页面
            </Button>
            <Button 
              fill='none' 
              onClick={() => this.setState({ hasError: false })}
            >
              重试
            </Button>
          </Space>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
