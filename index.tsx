// 导入 Tailwind CSS
import './src/index.css';

// 所有依赖（Vite 构建时会处理这些）
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// 确保 lucide-react 和其他依赖被正确加载
import { Calendar as CalendarIcon, Table as TableIcon, Repeat, Briefcase, Box, Clock, ChevronLeft, ChevronRight, Plus, Settings, Sun, Edit, LayoutGrid, PanelLeftClose, PanelRightClose } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useHotkeys } from './hooks/useHotkeys.ts';
import { generateTasksFromRule, parseDate } from './services/recurringService.ts';

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