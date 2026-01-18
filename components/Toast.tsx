import React, { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';

export interface ToastData {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'error';
}

interface ToastProps extends ToastData {
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(id), 300); // Wait for exit animation
    }, 3000); // Auto-dismiss after 3 seconds

    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(id), 300);
  };

  return (
    <div 
      className={`bg-gray-900/80 dark:bg-zinc-800/90 backdrop-blur-md text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 transition-all duration-300 ${isExiting ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'} animate-in fade-in slide-in-from-bottom-5`}
    >
      <CheckCircle size={20} className="text-green-400" />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={handleDismiss} className="ml-auto text-gray-400 hover:text-white">
        <X size={16} />
      </button>
    </div>
  );
};

export interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};
