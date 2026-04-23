import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import './Primitives.css';

interface TabsProps {
  tabs: string[];
  defaultTab?: string;
  onChange?: (tab: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, defaultTab, onChange, className }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    onChange?.(tab);
  };

  return (
    <div className={cn('ug-tabs-header', className)}>
      {tabs.map(tab => (
        <button
          key={tab}
          className={cn('ug-tab-button', activeTab === tab && 'active')}
          onClick={() => handleTabClick(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};
