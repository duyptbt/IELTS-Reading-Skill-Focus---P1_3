import React from 'react';
import { AlertCircle, RotateCcw, Check, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="confirm-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        id="confirm-modal-dialog"
        className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="p-5">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-2.5 rounded-lg shrink-0 ${
                isDestructive
                  ? 'bg-rose-50 text-rose-600 border border-rose-100'
                  : 'bg-blue-50 text-blue-600 border border-blue-100'
              }`}
            >
              {isDestructive ? (
                <RotateCcw className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            id="confirm-modal-cancel-btn"
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            id="confirm-modal-confirm-btn"
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold text-white transition-colors shadow-xs flex items-center gap-1.5 ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
