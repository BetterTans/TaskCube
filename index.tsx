import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// 获取根 DOM 元素
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// 创建 React Root 并渲染主应用
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);