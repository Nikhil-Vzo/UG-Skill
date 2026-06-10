import React from 'react';
import { Link } from 'react-router-dom';

// --- Lightweight Animated 2D Background --- //
const PricingBackground = () => {
  return (
    <div className="pricing-bg-blobs">
      <div className="pricing-blob-1"></div>
      <div className="pricing-blob-2"></div>
      <div className="pricing-ring pricing-ring-1"></div>
      <div className="pricing-ring pricing-ring-2"></div>
    </div>
  );
};

// --- Icons --- //
const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="3"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ color: '#10b981', flexShrink: 0 }}
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export interface PricingCardProps {
  planName: string;
  description: string;
  price: string;
  features: string[];
  buttonText: string;
  isPopular?: boolean;
  buttonVariant?: 'primary' | 'secondary';
  onAction?: () => void;
}

export const AnimatedPricingCard = ({
  planName, description, price, features, buttonText, isPopular = false, buttonVariant = 'primary', onAction
}: PricingCardProps) => {
  return (
    <div className={`anim-pricing-card ${isPopular ? 'popular' : ''}`}>
      {isPopular && (
        <div className="anim-pricing-badge">
          Most Popular
        </div>
      )}
      <div className="anim-pricing-header">
        <h2 className="anim-pricing-title">{planName}</h2>
        <p className="anim-pricing-desc">{description}</p>
      </div>
      <div className="anim-pricing-price-wrap">
        <span className="anim-pricing-price">₹{price}</span>
        <span className="anim-pricing-period">/mo</span>
      </div>
      <div className="anim-pricing-divider"></div>
      <ul className="anim-pricing-features">
        {features.map((feature, index) => (
          <li key={index}>
            <CheckIcon /> <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Link to="/signup" className={`anim-pricing-btn ${buttonVariant}`} style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>
        {buttonText}
      </Link>
    </div>
  );
};

interface ModernPricingPageProps {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  plans: PricingCardProps[];
}

export const ModernPricingPage = ({
  title,
  subtitle,
  plans,
}: ModernPricingPageProps) => {
  return (
    <div className="anim-pricing-container" id="pricing">
      <PricingBackground />
      <div className="anim-pricing-content">
        <div className="anim-pricing-header-text">
          <h1 className="section-title">{title}</h1>
          <p className="section-subtitle">{subtitle}</p>
        </div>
        <div className="anim-pricing-grid">
          {plans.map((plan) => <AnimatedPricingCard key={plan.planName} {...plan} />)}
        </div>
      </div>
    </div>
  );
};
