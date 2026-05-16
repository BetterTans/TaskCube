import React from 'react';
import { Toast, ToastType } from '../hooks/useToast';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={18} className="text-green-500" />,
  error: <XCircle size={18} className="text-red-500" />,
  warning: <AlertTriangle size={18} className="text-yellow-500" />,
  info: <Info size={18} className="text-blue-500" />,
};

const bgMap: Record<ToastType, string> = {
  success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
};

export const ToastContainer: React.FC<{ toasts: Toast[]; onRemove: (id: string) => void }> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[90] space-y-2 max-w-sm">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg animate-in slide-in-from-right-5 duration-200 ${bgMap[toast.type]}`}
        >
          {iconMap[toast.type]}
          <span className="text-sm text-gray-800 dark:text-gray-200 flex-1">{toast.message}</span>
          <button onClick={() => onRemove(toast.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};