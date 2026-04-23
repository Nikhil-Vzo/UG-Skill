import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/ui/Navbar';
import { Sidebar } from '../components/ui/Sidebar';
import { AIChatbot } from '../components/ui/AIChatbot';
import './DashboardLayout.css';

export const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="layout-root">
      <Navbar onMenuClick={toggleSidebar} />
      
      <div className="layout-body">
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        
        <main className="layout-main">
          {/* Outlet renders the nested child routes (e.g., Dashboard, Courses, etc.) */}
          <Outlet />
        </main>
      </div>
      <AIChatbot />
    </div>
  );
};
