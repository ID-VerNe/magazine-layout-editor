import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';
import { formatMagazineText } from '../utils/formatter';

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
  const [version, setVersion] = useState(0); 
  const ref = useRef<HTMLHeadingElement>(null);

  // Reset font size whenever content or constraints change
  useLayoutEffect(() => {
    setFontSize(maxSize);
  }, [text, maxSize, fontFamily, maxLines, version]);

  // Scaling logic
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const maxHeight = fontSize * lineHeight * maxLines; 
    
    if (el.scrollHeight > maxHeight + 1 && fontSize > minSize) {
      const ratio = maxHeight / el.scrollHeight;
      if (ratio < 0.95) {
        setFontSize(prev => Math.max(minSize, Math.floor(prev * ratio)));
      } else {
        setFontSize(prev => prev - 1);
      }
    }
  }, [text, fontSize, lineHeight, maxLines, minSize, version]);

  useEffect(() => {
    if (document.fonts) {
      document.fonts.ready.then(() => setVersion(v => v + 1));
    }
    const observer = new ResizeObserver(() => setVersion(v => v + 1));
    if (ref.current) observer.observe(ref.current);
    const timeout = setTimeout(() => setVersion(v => v + 1), 500);
    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [text]);

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
        whiteSpace: 'pre-wrap', // 关键：允许手动换行
      }}
    >
      {text ? formatMagazineText(text) : ' '}
    </Tag>
  );
};

export default AutoFitHeadline;