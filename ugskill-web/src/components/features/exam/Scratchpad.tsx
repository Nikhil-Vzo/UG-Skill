import React, { useRef, useState, useEffect } from 'react';
import { X, Trash2, Edit3, Circle } from 'lucide-react';

interface ScratchpadProps {
  onClose: () => void;
}

export const Scratchpad: React.FC<ScratchpadProps> = ({ onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#60a5fa'); // default primary blue
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');

  // Set up canvas sizes and initial background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set height and width depending on client bounding box
    const rect = canvas.parentElement?.getBoundingClientRect();
    canvas.width = (rect?.width ?? 400) - 32; // padding buffer
    canvas.height = 280;

    // Draw dark slate workspace background
    ctx.fillStyle = '#0f1115';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = tool === 'eraser' ? '#0f1115' : color;
    
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f1115';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const colors = [
    '#f1f5f9', // white
    '#60a5fa', // blue
    '#22c55e', // green
    '#f59e0b', // orange
    '#ef4444', // red
  ];

  return (
    <div
      className="surface-card noise-overlay animate-scale-in"
      style={{
        width: '400px',
        padding: '1.25rem',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Virtual Scratchpad</span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', padding: 0 }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Canvas workspace wrapper */}
      <div
        style={{
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          background: '#0f1115',
          touchAction: 'none',
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ display: 'block', cursor: tool === 'eraser' ? 'cell' : 'crosshair' }}
        />
      </div>

      {/* Tools Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        
        {/* Colors */}
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                setTool('pen');
              }}
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: c,
                border: color === c && tool === 'pen' ? '2px solid #3b82f6' : '1px solid var(--surface-3)',
                cursor: 'pointer',
                padding: 0,
                outline: 'none',
                boxShadow: color === c && tool === 'pen' ? '0 0 4px var(--primary)' : 'none',
              }}
            />
          ))}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Eraser */}
          <button
            onClick={() => setTool('eraser')}
            style={{
              padding: '0.35rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: 500,
              borderRadius: 'var(--radius-sm)',
              border: tool === 'eraser' ? '1px solid var(--primary-glow)' : '1px solid var(--border-subtle)',
              background: tool === 'eraser' ? 'var(--primary-subtle)' : 'var(--surface-2)',
              color: tool === 'eraser' ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            Eraser
          </button>

          {/* Size */}
          <select
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--surface-2)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              outline: 'none',
            }}
          >
            <option value="2">Thin</option>
            <option value="4">Medium</option>
            <option value="8">Thick</option>
            <option value="16">Extra Thick</option>
          </select>

          {/* Clear */}
          <button
            onClick={clearCanvas}
            style={{
              padding: '0.35rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: 500,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-error-subtle)',
              background: 'var(--color-error-subtle)',
              color: 'var(--color-error)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <Trash2 size={12} />
            Clear
          </button>
        </div>

      </div>
    </div>
  );
};
