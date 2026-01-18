import React from 'react';

/**
 * 一个基础的骨架占位符盒子组件。
 * @param {{ className?: string }} props - 组件属性。
 * @returns {JSX.Element} - 一个带有动画效果的灰色矩形。
 */
const SkeletonBox: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`bg-gray-200 dark:bg-zinc-800 rounded-md animate-pulse ${className}`} />
);

/**
 * 日历视图 (FullCalendar) 的骨架屏。
 * 模拟日历的网格布局，在数据加载时提供视觉占位，防止布局跳动。
 */
export const CalendarSkeleton = () => {
  const rows = 6;
  const cols = 7;
  return (
    <div className="p-4 h-full">
      <div className="flex flex-col h-full border-b border-r border-gray-100 dark:border-zinc-800">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-7 h-[16.66%]">
            {Array.from({ length: cols }).map((_, colIndex) => (
              <SkeletonBox key={colIndex} className="w-full h-full border-t border-l border-gray-100 dark:border-zinc-800" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 日视图 (DayTimeView) 的骨架屏。
 * 模拟时间轴和任务块的布局，提升加载时的用户体验。
 */
export const DayViewSkeleton = () => (
  <div className="h-full overflow-hidden">
    <div className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm px-4 py-3 border-b border-gray-100 dark:border-zinc-800 shadow-sm">
      <SkeletonBox className="h-7 w-1/3" />
    </div>
    <div className="p-4 flex gap-4 h-full">
      <div className="w-12 flex flex-col gap-[38px] pt-2">
        {Array.from({ length: 15 }).map((_, i) => (
          <SkeletonBox key={i} className="h-4 w-full" />
        ))}
      </div>
      <div className="flex-1 border-l border-gray-200 dark:border-zinc-800 relative">
         <SkeletonBox className="absolute top-[10%] left-4 right-4 h-16" />
         <SkeletonBox className="absolute top-[30%] left-4 right-4 h-24" />
         <SkeletonBox className="absolute top-[60%] left-4 right-4 h-12" />
      </div>
    </div>
  </div>
);

/**
 * 看板视图 (MatrixView) 的骨架屏。
 * 模拟四个象限卡片的布局。
 */
export const MatrixSkeleton = () => (
  <div className="p-4 h-full overflow-hidden">
     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
       {Array.from({ length: 4 }).map((_, i) => (
         <div key={i} className="space-y-3 p-3 bg-gray-50/50 dark:bg-zinc-800/20 rounded-xl">
           <SkeletonBox className="h-8 w-1/2" />
           <SkeletonBox className="w-full h-32" />
         </div>
       ))}
     </div>
  </div>
);

/**
 * 列表视图 (TableView) 的骨架屏。
 * 模拟表格头部筛选器和多行任务的布局。
 */
export const TableSkeleton = () => (
  <div className="h-full flex flex-col bg-white dark:bg-zinc-900">
    <div className="flex-1 overflow-auto custom-scrollbar p-4 space-y-2">
       <div className="flex gap-2 h-20">
          <SkeletonBox className="w-[80px]" />
          <SkeletonBox className="flex-1" />
          <SkeletonBox className="w-[140px]" />
          <SkeletonBox className="w-[90px]" />
          <SkeletonBox className="w-[130px]" />
          <SkeletonBox className="w-[120px]" />
       </div>
       {Array.from({ length: 10 }).map((_, i) => (
         <SkeletonBox key={i} className="w-full h-11" />
       ))}
    </div>
    <div className="bg-gray-50 dark:bg-zinc-800 border-t border-gray-200 dark:border-zinc-700 p-2 text-xs text-gray-500 dark:text-gray-400 flex justify-end px-4 h-8">
       <SkeletonBox className="w-20 h-4" />
    </div>
  </div>
);