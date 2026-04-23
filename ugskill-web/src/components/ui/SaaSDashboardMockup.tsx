import React from 'react';
import { motion } from 'framer-motion';
import './SaaSDashboardMockup.css';

export const SaaSDashboardMockup: React.FC = () => {
  return (
    <div className="saas-mockup-wrapper">
      <motion.div 
        className="saas-mockup-container"
        initial={{ opacity: 0, rotateX: 20, y: 50 }}
        animate={{ opacity: 1, rotateX: 10, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        {/* Browser / App Header */}
        <div className="saas-header">
          <div className="traffic-lights">
            <span className="close"></span>
            <span className="min"></span>
            <span className="max"></span>
          </div>
          <div className="url-bar">ugskill.com/dashboard</div>
          <div className="user-profile-mock"></div>
        </div>

        {/* App Body */}
        <div className="saas-body">
          {/* Sidebar */}
          <div className="saas-sidebar">
            {[1, 2, 3, 4].map((i) => (
              <motion.div 
                key={i}
                className={`sidebar-item ${i === 1 ? 'active' : ''}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
              ></motion.div>
            ))}
            <div className="sidebar-spacer"></div>
            <div className="sidebar-item bottom"></div>
          </div>

          {/* Main Content Area */}
          <div className="saas-main">
            <div className="saas-top-row">
              <div className="saas-title-block">
                <div className="saas-title-line"></div>
                <div className="saas-subtitle-line"></div>
              </div>
              <div className="saas-status-badge">
                <div className="pulse-dot-small"></div>
                <span>LIVE</span>
              </div>
            </div>

            <div className="saas-stats-grid">
              {[1, 2, 3].map((i) => (
                <motion.div 
                  key={i} 
                  className="saas-stat-card"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                  whileHover={{ y: -2, borderColor: 'rgba(99, 102, 241, 0.4)' }}
                >
                  <div className="stat-icon"></div>
                  <div className="stat-content">
                    <div className="stat-value"></div>
                    <div className="stat-label"></div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div 
              className="saas-chart-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              <div className="chart-header">
                <div className="chart-title"></div>
                <div className="chart-legend"></div>
              </div>
              {/* CSS Bars for Chart */}
              <div className="chart-bars">
                {[40, 70, 50, 90, 60, 100, 80].map((h, i) => (
                  <motion.div 
                    key={i} 
                    className="chart-bar-container"
                  >
                    <motion.div 
                      className="chart-bar" 
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: 1.2 + i * 0.1, duration: 0.5, ease: "easeOut" }}
                    ></motion.div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Mock Cursor Animation */}
        <motion.div 
          className="mock-cursor"
          animate={{
            x: [100, 200, 150, 250, 180],
            y: [80, 120, 180, 100, 150],
            scale: [1, 1, 0.8, 0.8, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="cursor-dot"></div>
          <div className="cursor-ripple"></div>
        </motion.div>
      </motion.div>
        
      {/* Floating Notification (moved outside to prevent cropping) */}
      <motion.div 
        className="saas-floating-notif"
        initial={{ opacity: 0, x: 20, y: 20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 2, duration: 0.6, type: "spring" }}
        whileHover={{ scale: 1.05 }}
      >
        <div className="notif-icon">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <div className="notif-text">
          <div className="notif-title">Status</div>
          <div className="notif-desc">Placement Ready</div>
        </div>
      </motion.div>
        
      <div className="saas-mockup-glow"></div>
    </div>
  );
};
