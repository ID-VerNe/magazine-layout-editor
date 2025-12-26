import { useState, useCallback, useEffect, useRef } from 'react';

interface UsePreviewOptions {
  enforceA4: boolean;
  pages: any[];
  currentPageIndex: number;
}

export function usePreview({ enforceA4, pages, currentPageIndex }: UsePreviewOptions) {
  const [previewZoom, setPreviewZoom] = useState(0.8);
  const [isAutoFit, setIsAutoFit] = useState(true);
  const [pagesOverflow, setPagesOverflow] = useState<Record<string, boolean>>({});
  
  const previewRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const calculateFitZoom = useCallback(() => {
    if (!previewContainerRef.current) return 0.8;
    
    const rect = previewContainerRef.current.getBoundingClientRect();
    const containerHeight = rect.height;
    
    if (containerHeight <= 0) return 0.8;

    const padding = 96; 
    
    let targetHeight = 1131;
    if (previewRef.current) {
      const currentPageEl = previewRef.current.querySelector('.magazine-page-container.block .magazine-page');
      if (currentPageEl) {
        targetHeight = Math.max(1131, currentPageEl.scrollHeight);
      }
    }

    const availableHeight = containerHeight - padding;
    return Math.min(Math.max(0.1, availableHeight / targetHeight), 1.5);
  }, [enforceA4, pages, currentPageIndex]);

  useEffect(() => {
    if (!previewContainerRef.current) return;

    const observer = new ResizeObserver(() => {
      if (isAutoFit) {
        setPreviewZoom(calculateFitZoom());
      }
    });

    observer.observe(previewContainerRef.current);
    
    const timeoutId = setTimeout(() => {
      if (isAutoFit) {
        setPreviewZoom(calculateFitZoom());
      }
    }, 50);

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [isAutoFit, calculateFitZoom]);

  useEffect(() => {
    if (isAutoFit) {
      setPreviewZoom(calculateFitZoom());
    }
  }, [currentPageIndex, enforceA4, isAutoFit, calculateFitZoom, pages]);

  const handleManualZoom = (value: number) => {
    setIsAutoFit(false);
    setPreviewZoom(value);
  };

  const toggleFit = () => {
    setIsAutoFit(!isAutoFit);
  };

  const handleOverflowChange = (pageId: string, isOverflowing: boolean) => {
    setPagesOverflow(prev => {
      if (prev[pageId] === isOverflowing) return prev;
      return { ...prev, [pageId]: isOverflowing };
    });
  };

  return {
    previewZoom,
    setPreviewZoom,
    isAutoFit,
    setIsAutoFit,
    pagesOverflow,
    previewRef,
    previewContainerRef,
    handleManualZoom,
    toggleFit,
    handleOverflowChange
  };
}
