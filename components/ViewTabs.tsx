import React from 'react';
import { LayoutGrid, Calendar as CalendarIcon, Clock, Table as TableIcon } from 'lucide-react';

type ViewMode = 'calendar' | 'day' | 'matrix' | 'table';

interface ViewTabsProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const tabs: { id: ViewMode; icon: React.ElementType; label: string }[] = [
  { id: 'matrix',   icon: LayoutGrid,   label: '四象限' },
  { id: 'calendar', icon: CalendarIcon, label: '月视图' },
  { id: 'day',      icon: Clock,         label: '日视图' },
  { id: 'table',    icon: TableIcon,     label: '列表'   },
];

export const ViewTabs: React.FC<ViewTabsProps> = ({ viewMode, onChange }) => {
  return (
    <div className="flex items-center bg-gray-100 dark:bg-zinc-800 rounded-lg p-0.5">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium
            transition-all duration-200
            ${viewMode === tab.id
              ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'}
          `}
        >
          <tab.icon size={14} />
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};
