import React from 'react';

export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-ink-950/50" onClick={onCancel} />
      <div className="relative w-full max-w-sm card p-6 shadow-popover">
        <h3 className="text-lg font-semibold text-ink-950">{title}</h3>
        {message && <div className="mt-2 text-sm text-ink-600 leading-relaxed">{message}</div>}
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-secondary" onClick={onCancel}>{cancelLabel}</button>
          <button className={danger ? 'btn-primary bg-brand-700' : 'btn-primary'} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
