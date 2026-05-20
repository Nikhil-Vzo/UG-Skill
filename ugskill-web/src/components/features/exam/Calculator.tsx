import React, { useState } from 'react';
import { X, Delete, Percent, HelpCircle } from 'lucide-react';

interface CalculatorProps {
  onClose: () => void;
}

export const Calculator: React.FC<CalculatorProps> = ({ onClose }) => {
  const [display, setDisplay] = useState('');
  const [result, setResult] = useState('');

  const handleKeyPress = (val: string) => {
    setDisplay((prev) => prev + val);
  };

  const handleClear = () => {
    setDisplay('');
    setResult('');
  };

  const handleBackspace = () => {
    setDisplay((prev) => prev.slice(0, -1));
  };

  const evaluateExpression = () => {
    try {
      // Replace scientific notations with JavaScript Math equivalents safely
      let cleaned = display
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/π/g, 'Math.PI')
        .replace(/e/g, 'Math.E')
        .replace(/\^/g, '**');

      // Simple evaluation (safe context since it's restricted to math keys)
      // eslint-disable-next-line no-eval
      const evalResult = eval(cleaned);
      if (evalResult === undefined || isNaN(evalResult)) {
        setResult('Error');
      } else {
        setResult(Number(evalResult).toLocaleString('en-US', { maximumFractionDigits: 6 }));
      }
    } catch (err) {
      setResult('Error');
    }
  };

  const buttons = [
    { label: 'sin', action: () => handleKeyPress('sin(') },
    { label: 'cos', action: () => handleKeyPress('cos(') },
    { label: 'tan', action: () => handleKeyPress('tan(') },
    { label: 'π', action: () => handleKeyPress('π') },
    
    { label: 'log', action: () => handleKeyPress('log(') },
    { label: 'ln', action: () => handleKeyPress('ln(') },
    { label: 'sqrt', action: () => handleKeyPress('sqrt(') },
    { label: '^', action: () => handleKeyPress('^') },

    { label: '(', action: () => handleKeyPress('(') },
    { label: ')', action: () => handleKeyPress(')') },
    { label: 'C', action: handleClear, isAccent: true },
    { label: '⌫', action: handleBackspace, isAccent: true },

    { label: '7', action: () => handleKeyPress('7') },
    { label: '8', action: () => handleKeyPress('8') },
    { label: '9', action: () => handleKeyPress('9') },
    { label: '/', action: () => handleKeyPress('/') },

    { label: '4', action: () => handleKeyPress('4') },
    { label: '5', action: () => handleKeyPress('5') },
    { label: '6', action: () => handleKeyPress('6') },
    { label: '*', action: () => handleKeyPress('*') },

    { label: '1', action: () => handleKeyPress('1') },
    { label: '2', action: () => handleKeyPress('2') },
    { label: '3', action: () => handleKeyPress('3') },
    { label: '-', action: () => handleKeyPress('-') },

    { label: '0', action: () => handleKeyPress('0') },
    { label: '.', action: () => handleKeyPress('.') },
    { label: '=', action: evaluateExpression, isPrimary: true },
    { label: '+', action: () => handleKeyPress('+') },
  ];

  return (
    <div
      className="surface-card noise-overlay animate-scale-in"
      style={{
        width: '320px',
        padding: '1.25rem',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        userSelect: 'none',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Scientific Calculator</span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', padding: 0 }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Screen Display */}
      <div
        className="surface-well"
        style={{
          padding: '0.75rem 1rem',
          minHeight: '80px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          borderRadius: 'var(--radius-md)',
          wordBreak: 'break-all',
        }}
      >
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', minHeight: '1.25rem' }}>
          {display || '0'}
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)', minHeight: '2.25rem', display: 'flex', alignItems: 'flex-end' }}>
          {result}
        </div>
      </div>

      {/* Keypad Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
        {buttons.map((btn, idx) => {
          let btnStyle: React.CSSProperties = {
            padding: '0.625rem 0',
            fontSize: '0.875rem',
            fontWeight: 600,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--surface-2)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.15s ease',
          };

          if (btn.isAccent) {
            btnStyle.background = 'var(--color-warning-subtle)';
            btnStyle.color = 'var(--color-warning)';
            btnStyle.borderColor = 'transparent';
          } else if (btn.isPrimary) {
            btnStyle.background = 'var(--primary)';
            btnStyle.color = 'var(--primary-fg)';
            btnStyle.borderColor = 'transparent';
            btnStyle.fontWeight = 700;
          }

          return (
            <button
              key={idx}
              onClick={btn.action}
              style={btnStyle}
              onMouseEnter={(e) => {
                if (!btn.isPrimary && !btn.isAccent) {
                  e.currentTarget.style.background = 'var(--surface-3)';
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                }
              }}
              onMouseLeave={(e) => {
                if (!btn.isPrimary && !btn.isAccent) {
                  e.currentTarget.style.background = 'var(--surface-2)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }
              }}
            >
              {btn.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
