import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './index.css';
import './styles/design-tokens.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider
        locale={zhCN}
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#3b82f6',
            colorBgBase: '#0a0e1a',
            colorBgContainer: '#111827',
            colorBgLayout: '#0a0e1a',
            colorBorder: 'rgba(59, 130, 246, 0.15)',
            colorText: '#e5e7eb',
            colorTextSecondary: '#9ca3af',
            borderRadius: 8,
            fontFamily: "'PingFang SC', 'Segoe UI', system-ui, sans-serif",
          },
        }}
      >
        <App />
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);