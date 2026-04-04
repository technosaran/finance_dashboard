'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertOctagon } from 'lucide-react';
import { colors } from '@/lib/styles/constants';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: NotificationType;
}

interface NotificationContextType {
  showNotification: (type: NotificationType, message: string, duration?: number) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const showNotification = useCallback(
    (type: NotificationType, message: string, duration = 5000) => {
      const id = Math.random().toString(36).substring(2, 9);
      setNotifications((prev) => [...prev, { id, type, message, duration }]);

      if (duration !== Infinity) {
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, duration);
      }
    },
    []
  );

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmDialog({
        isOpen: true,
        options: {
          ...options,
          confirmLabel: options.confirmLabel || 'Confirm',
          cancelLabel: options.cancelLabel || 'Cancel',
          type: options.type || 'warning',
        },
        resolve,
      });
    });
  }, []);

  const handleConfirm = (value: boolean) => {
    if (confirmDialog) {
      confirmDialog.resolve(value);
      setConfirmDialog(null);
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} color="#10b981" />;
      case 'error':
        return <AlertOctagon size={20} color="#f43f5e" />;
      case 'warning':
        return <AlertTriangle size={20} color="#f59e0b" />;
      case 'info':
        return <Info size={20} color={colors.accentHover} />;
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification, confirm }}>
      {children}

      {/* Notifications Portal */}
      <div
        className="notification-viewport"
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          pointerEvents: 'none',
        }}
      >
        {notifications.map((n) => (
          <div
            key={n.id}
            className="notification-toast"
            style={{
              background: colors.bgCard,
              border: `1px solid ${
                n.type === 'success'
                  ? '#20b072'
                  : n.type === 'error'
                    ? '#f43f5e'
                    : n.type === 'warning'
                      ? '#f2a93b'
                      : '#43c08a'
              }33`,
              padding: '16px 20px',
              borderRadius: '16px',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              width: 'min(100%, 420px)',
              minWidth: 0,
              maxWidth: '100%',
              animation: 'slideIn 0.3s ease-out',
              pointerEvents: 'auto',
              backdropFilter: 'blur(10px)',
            }}
          >
            {getIcon(n.type)}
            <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: '600' }}>{n.message}</div>
            <button
              type="button"
              onClick={() => setNotifications((prev) => prev.filter((item) => item.id !== n.id))}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '4px',
              }}
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Confirm Dialog Modal */}
      {confirmDialog && (
        <div
          className="confirm-dialog-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000,
            padding: '20px',
          }}
        >
          <div
            className="confirm-dialog"
            style={{
              background: colors.bgCard,
              padding: '32px',
              borderRadius: '24px',
              border: `1px solid ${colors.border}`,
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}
            >
              {getIcon(confirmDialog.options.type || 'warning')}
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900', color: '#fff' }}>
                {confirmDialog.options.title}
              </h3>
            </div>
            <p
              style={{
                color: colors.textMuted,
                fontSize: '1rem',
                lineHeight: '1.6',
                marginBottom: '32px',
              }}
            >
              {confirmDialog.options.message}
            </p>
            <div className="confirm-dialog__actions" style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => handleConfirm(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${colors.border}`,
                  color: '#fff',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                {confirmDialog.options.cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => handleConfirm(true)}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  background:
                    confirmDialog.options.type === 'error'
                      ? '#f43f5e'
                      : 'linear-gradient(135deg, #1a8e68 0%, #146d63 100%)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                {confirmDialog.options.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        @media (max-width: 767px) {
          .notification-viewport {
            top: calc(12px + env(safe-area-inset-top, 0px)) !important;
            right: 12px !important;
            left: 12px !important;
            align-items: stretch !important;
          }

          .notification-toast {
            width: 100% !important;
          }

          .confirm-dialog-overlay {
            align-items: flex-end !important;
            padding: 12px !important;
          }

          .confirm-dialog {
            width: 100% !important;
            max-width: none !important;
            padding: 24px 20px calc(24px + env(safe-area-inset-bottom, 0px)) !important;
            border-radius: 24px !important;
          }

          .confirm-dialog__actions {
            flex-direction: column;
          }
        }
      `}</style>
    </NotificationContext.Provider>
  );
};
