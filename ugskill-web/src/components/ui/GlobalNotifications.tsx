import React, { useState } from 'react';
import { Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react';

// For a real application, you'd use a context or global state manager (like Zustand/Redux) 
// to trigger notifications. This is a simplified demo version.

export const GlobalNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState([
    { id: '1', type: 'info', message: 'Welcome to UGSkill! Complete your profile to get started.' },
    { id: '2', type: 'success', message: 'You have successfully enrolled in "System Design".' }
  ]);

  const [isOpen, setIsOpen] = useState(false);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={18} color="var(--success-color)" />;
      case 'error': return <AlertTriangle size={18} color="var(--error-color)" />;
      default: return <Info size={18} color="var(--primary-color)" />;
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          position: 'relative',
          padding: '0.5rem'
        }}
      >
        <Bell size={20} />
        {notifications.length > 0 && (
          <span style={{
            position: 'absolute',
            top: '0',
            right: '0',
            backgroundColor: 'var(--error-color)',
            color: '#fff',
            fontSize: '0.65rem',
            fontWeight: 'bold',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--bg-primary)'
          }}>
            {notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          marginTop: '0.5rem',
          width: '320px',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          zIndex: 100,
          overflow: 'hidden'
        }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>Notifications</h3>
            {notifications.length > 0 && (
              <button 
                onClick={() => setNotifications([])}
                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Clear all
              </button>
            )}
          </div>
          
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No new notifications
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} style={{
                  padding: '1rem',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                  cursor: 'pointer'
                }} onClick={() => removeNotification(notif.id)}>
                  {getIcon(notif.type)}
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{notif.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
