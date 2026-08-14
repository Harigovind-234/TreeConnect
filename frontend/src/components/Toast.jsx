import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const Toast = ({ type = 'success', message, onClose }) => {
  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div className={`toast-notification ${isSuccess ? 'toast-success' : 'toast-error'}`}>
      <div className="toast-icon">
        {isSuccess ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
      </div>
      <div className="toast-message">{message}</div>
      {onClose && (
        <button type="button" className="toast-close" onClick={onClose}>
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default Toast;
