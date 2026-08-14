import React, { useRef, useEffect } from 'react';
import { PageData, PageSize, TemplateProps } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import ClassicCover from './templates/ClassicCover';
import ClassicArticle from './templates/ClassicArticle';
import ModernVertical from './templates/ModernVertical';
import BlueprintArticle from './templates/BlueprintArticle';
import ImpactBold from './templates/ImpactBold';
import Cinematic from './templates/Cinematic';
import Blueprint from './templates/Blueprint';
import Tabloid from './templates/Tabloid';
import Typography from './templates/Typography';
import { IntensiveReading } from './templates/IntensiveReading';

interface PreviewProps {
  page: PageData;
  pageIndex: number;
  totalPages: number;
  pageSize?: PageSize;
  onOverflowChange?: (isOverflowing: boolean) => void;
}

const TEMPLATE_COMPONENTS: Record<string, React.ComponentType<TemplateProps>> = {
  'classic-cover': ClassicCover,
  'classic-article': ClassicArticle,
  'modern-vertical': ModernVertical,
  'blueprint-article': BlueprintArticle,
  'impact-bold': ImpactBold,
  'cinematic': Cinematic,
  'blueprint': Blueprint,
  'tabloid': Tabloid,
  'typography': Typography,
  'intensive-reading': IntensiveReading,
};

const Preview: React.FC<PreviewProps> = ({ page, pageIndex, totalPages, pageSize = 'A4', onOverflowChange }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  
  const getPageHeight = () => {
    switch (pageSize) {
      case 'A4': return '1131px';
      case '9:15': return '1333px';
      case 'Unlimited': return 'auto';
      default: return '1131px';
    }
  };

  const isFixed = pageSize !== 'Unlimited';

  useEffect(() => {
    if (!isFixed || !contentRef.current || !onOverflowChange) return;
    const checkOverflow = () => {
      const element = contentRef.current;
      if (!element) return;

      const contentContainer = element.querySelector('.magazine-content-container') as HTMLElement;
      if (contentContainer) {
        const isOverflowing = contentContainer.scrollHeight > contentContainer.offsetHeight + 2;
        onOverflowChange(isOverflowing);
      } else {
        const isOverflowing = element.scrollHeight > element.offsetHeight + 2;
        onOverflowChange(isOverflowing);
      }
    };
    checkOverflow();
    const observer = new MutationObserver(checkOverflow);
    observer.observe(contentRef.current, { childList: true, subtree: true, characterData: true });
    window.addEventListener('resize', checkOverflow);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', checkOverflow);
    };
  }, [page, isFixed, pageSize, onOverflowChange]);

  const renderTemplate = () => {
    const layoutKey = page.layoutId || (page.type === 'cover' ? 'classic-cover' : 'classic-article');
    const Component = TEMPLATE_COMPONENTS[layoutKey] || (page.type === 'cover' ? ClassicCover : ClassicArticle);
    return <Component page={page} pageIndex={pageIndex} totalPages={totalPages} />;
  };

  return (
    <div 
      className="magazine-page relative shadow-2xl mx-auto border border-neutral-300 shrink-0"
      style={{
        width: '800px', 
        backgroundColor: page.backgroundColor || '#FAF9F4',
        height: getPageHeight(),
        minHeight: '1131px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div ref={contentRef} className="flex-1 flex flex-col overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={page.layoutId + page.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="w-full h-full flex flex-col"
          >
            {renderTemplate()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default React.memo(Preview, (prevProps, nextProps) => {
  return prevProps.page === nextProps.page &&
         prevProps.pageIndex === nextProps.pageIndex &&
         prevProps.totalPages === nextProps.totalPages &&
         prevProps.pageSize === nextProps.pageSize &&
         prevProps.onOverflowChange === nextProps.onOverflowChange;
});
