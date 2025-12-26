import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';

interface AutoFitHeadlineProps {
  text: string;
  maxSize: number;
  lineHeight: number;
  fontFamily: string;
  className: string;
  maxLines: number;
  minSize?: number;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p';
}

const AutoFitHeadline: React.FC<AutoFitHeadlineProps> = ({ 
  text, 
  maxSize, 
  lineHeight, 
  fontFamily, 
  className, 
  maxLines, 
  minSize = 8,
  as: Tag = 'h1' 
}) => {
  const [fontSize, setFontSize] = useState(maxSize);
  const [version, setVersion] = useState(0); // Used to force re-checks
  const ref = useRef<HTMLHeadingElement>(null);

  // 1. Reset font size whenever content or container constraints change
  useLayoutEffect(() => {
    setFontSize(maxSize);
  }, [text, maxSize, fontFamily, maxLines]);

  // 2. Core measurement and scaling logic
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const checkAndScale = () => {
      const maxHeight = fontSize * lineHeight * maxLines; 
      
      // We use a very strict check (+1px tolerance)
      if (el.scrollHeight > maxHeight + 1 && fontSize > minSize) {
        const ratio = maxHeight / el.scrollHeight;
        if (ratio < 0.95) {
          // Significant overflow: aggressive jump
          setFontSize(prev => Math.max(minSize, Math.floor(prev * ratio)));
        } else {
          // Minor overflow: fine tuning
          setFontSize(prev => prev - 1);
        }
      }
    };

    // Run the check
    checkAndScale();
  }, [text, fontSize, lineHeight, maxLines, minSize, version]);

  // 3. Handle initial load and font loading issues
  useEffect(() => {
    // Check when fonts are ready (crucial for initial load)
    if (document.fonts) {
      document.fonts.ready.then(() => {
        setVersion(v => v + 1);
      });
    }

    // Use ResizeObserver to catch any layout shifts or delayed renders
    const observer = new ResizeObserver(() => {
      setVersion(v => v + 1);
    });

    if (ref.current) {
      observer.observe(ref.current);
    }

    // Final fallback: check again after a short delay
    const timeout = setTimeout(() => setVersion(v => v + 1), 500);

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [text]); // Re-run observers when text changes

  return (
    <Tag 
      ref={ref}
      className={className}
      style={{ 
        fontFamily,
        fontSize: `${fontSize}px`,
        lineHeight: lineHeight,
        display: 'block',
        wordBreak: 'break-word',
        visibility: fontSize === maxSize && text ? 'hidden' : 'visible' // Hide during first calc frame to avoid flicker
      }}
    >
      {text}
    </Tag>
  );
};

export default AutoFitHeadline;
