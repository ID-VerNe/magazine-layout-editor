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
  minSize = 12,
  as: Tag = 'h1' 
}) => {
  const [fontSize, setFontSize] = useState(maxSize);
  const [isFontReady, setIsFontReady] = useState(false);
  const ref = useRef<HTMLHeadingElement>(null);

  // Reset to max size when text or constraints change
  useLayoutEffect(() => {
    setFontSize(maxSize);
  }, [text, maxSize, fontFamily, maxLines]);

  // Wait for fonts to be ready
  useEffect(() => {
    if (document.fonts) {
      document.fonts.ready.then(() => setIsFontReady(true));
    } else {
      setIsFontReady(true);
    }
  }, [fontFamily]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !isFontReady) return;

    const checkAndScale = () => {
      // Current allowed height
      const maxHeight = fontSize * lineHeight * maxLines; 
      
      // If overflowing
      if (el.scrollHeight > maxHeight + 2 && fontSize > minSize) {
        const ratio = maxHeight / el.scrollHeight;
        if (ratio < 0.9) {
          // Large jump for efficiency
          setFontSize(prev => Math.max(minSize, Math.floor(prev * ratio)));
        } else {
          // Fine tuning
          setFontSize(prev => prev - 1);
        }
      }
    };

    // Run immediately
    checkAndScale();

    // Also run after a tiny delay to catch any late layout shifts (common in Cinematic template)
    const timer = setTimeout(checkAndScale, 50);
    return () => clearTimeout(timer);
    
  }, [text, fontSize, lineHeight, maxLines, minSize, isFontReady]);

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
        visibility: isFontReady ? 'visible' : 'hidden' // Avoid flash of unstyled text
      }}
    >
      {text}
    </Tag>
  );
};

export default AutoFitHeadline;