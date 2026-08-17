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
    // 关键：观察父容器而非自身。字号变化只会改变元素自身高度，
    // 不影响父容器宽度，因此缩放后不会再次触发 observer，彻底消除
    // “改字号 → 尺寸变 → 触发重测 → 又改字号”的自反馈震荡（layout thrash）。
    // 父容器尺寸变化（窗口缩放/布局变更）、字体加载、超时仍会触发重测。
    const parent = ref.current?.parentElement;
    if (document.fonts) {
      document.fonts.ready.then(() => setVersion(v => v + 1));
    }
    let observer: ResizeObserver | undefined;
    if (parent) {
      observer = new ResizeObserver(() => setVersion(v => v + 1));
      observer.observe(parent);
    }
    const timeout = setTimeout(() => setVersion(v => v + 1), 500);
    return () => {
      observer?.disconnect();
      clearTimeout(timeout);
    };
  }, [text, maxSize, maxLines]);

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