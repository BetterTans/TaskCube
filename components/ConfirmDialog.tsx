import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen, title, message, confirmText = '确定', cancelText = '取消', onConfirm, onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle size={18} className="text-amber-500 shrink-0" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">
            {cancelText}
          </button>
          <button onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
