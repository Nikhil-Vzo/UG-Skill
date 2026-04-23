import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { SVGShapesLoader } from '../components/loaders/SVGShapesLoader';
import { Skeleton } from '../components/loaders/Skeleton';
import { AuraProgress } from '../components/loaders/AuraProgress';
import '../App.css'; // Keep reusing App.css for showcase styling

export const Showcase: React.FC = () => {
  const [progress, setProgress] = useState(0);

  // Simulate progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 5));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>UGSkill Design System</h1>
        <p>The "Cognitive Sanctuary" - Midnight Navy UI Tiers</p>
      </header>

      <section className="glass-panel showcase-section">
        <h2>Button Variants</h2>
        <div className="component-row">
          <Button variant="primary">Primary Action</Button>
          <Button variant="secondary">Secondary Glass</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="tertiary">Tertiary Action</Button>
        </div>
        <div className="component-row">
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="secondary" size="md">Medium</Button>
          <Button variant="outline" size="lg">Large</Button>
          <Button variant="primary" isLoading>Loading</Button>
        </div>
      </section>

      <section className="glass-panel showcase-section">
        <h2>Data Skeletons</h2>
        <div className="skeleton-grid">
          <div className="skeleton-card">
            <Skeleton variant="circular" width={48} height={48} />
            <div className="skeleton-content">
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </div>
          </div>
          <Skeleton variant="rectangular" height={100} />
          <Skeleton variant="rounded" height={60} />
        </div>
      </section>

      <section className="glass-panel showcase-section">
        <h2>Progress & Shapes</h2>
        <div className="loader-row">
          <div style={{ flex: 1, padding: '1rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--on-surface-variant)', fontSize: '0.875rem' }}>Aura Progress</h3>
            <AuraProgress progress={progress} label="Module 3: Advanced Calculus" size="md" />
            <br />
            <AuraProgress progress={75} size="sm" />
            <br />
            <AuraProgress progress={progress} size="lg" />
          </div>
          
          <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--on-surface-variant)', fontSize: '0.875rem' }}>SVG Morph Loader</h3>
            <SVGShapesLoader size="lg" />
          </div>
        </div>
      </section>
    </div>
  );
};
