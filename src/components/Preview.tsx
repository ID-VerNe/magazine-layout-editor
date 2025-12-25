import React, { useRef, useEffect } from 'react';
import { PageData } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import ClassicCover from './templates/ClassicCover';
import ClassicArticle from './templates/ClassicArticle';
import ImpactBold from './templates/ImpactBold';
import Cinematic from './templates/Cinematic';
import Blueprint from './templates/Blueprint';
import Tabloid from './templates/Tabloid';
import Typography from './templates/Typography';

interface PreviewProps {
  page: PageData;
  pageIndex: number;
  totalPages: number;
  enforceA4?: boolean;
  onOverflowChange?: (isOverflowing: boolean) => void;
}

const Preview: React.FC<PreviewProps> = ({ page, pageIndex, totalPages, enforceA4 = true, onOverflowChange }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  
  const pageHeightStyle = enforceA4 
    ? { height: '1131px', overflow: 'hidden' as const } 
    : { minHeight: '1131px' };

  useEffect(() => {
    if (!enforceA4 || !contentRef.current || !onOverflowChange) return;
    const checkOverflow = () => {
      const element = contentRef.current;
      if (element) {
        const isOverflowing = element.scrollHeight > element.offsetHeight;
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
  }, [page, enforceA4, onOverflowChange]);

  const showDisclaimer = !page.hideDisclaimer && (page.type === 'cover' || (page.type === 'article' && !page.footnote));

  const renderTemplate = () => {
    const templates: Record<string, React.ReactNode> = {
      'classic-cover': <ClassicCover page={page} />,
      'classic-article': <ClassicArticle page={page} />,
      'impact-bold': <ImpactBold page={page} />,
      'cinematic': <Cinematic page={page} />,
      'blueprint': <Blueprint page={page} />,
      'tabloid': <Tabloid page={page} />,
      'typography': <Typography page={page} />,
    };
    return templates[page.layoutId || ''] || (page.type === 'cover' ? templates['classic-cover'] : templates['classic-article']);
  };

  // --- Adaptive Footer Logic ---
  const getFooterStyle = () => {
    const layout = page.layoutId;
    
    if (layout === 'blueprint') {
      return {
        container: "bg-[#f4f4f4] text-slate-500 border-t border-slate-300",
        disclaimer: "opacity-40",
        dots: { active: "bg-slate-800", inactive: "bg-slate-200" }
      };
    }
    
    // Default (Classic / Tabloid / Impact / Typography now use this)
    return {
      container: "bg-[#FAF9F4] text-neutral-500 border-t border-neutral-200",
      disclaimer: "opacity-40",
      dots: { active: "bg-neutral-600", inactive: "bg-neutral-200" }
    };
  };

  const footerStyle = getFooterStyle();

  return (
    <div 
      className="magazine-page relative shadow-2xl mx-auto border border-neutral-300 overflow-hidden"
      style={{ 
        width: '800px', 
        backgroundColor: page.backgroundColor || (page.layoutId === 'typography' ? '#020617' : '#FAF9F4'),
        ...pageHeightStyle,
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

      <div 
        className={`px-10 py-8 flex flex-col text-lg z-20 transition-all duration-500 ${footerStyle.container}`}
        style={{ fontFamily: page.footerFont || "'Inter', sans-serif" }}
      >
        <div className="w-full mb-6">
           {showDisclaimer ? (
             <p className={`text-[14px] leading-relaxed text-justify w-full transition-opacity ${footerStyle.disclaimer}`}>
               本文是为提供一般信息的用途所撰写/翻译，并非旨在成为可依赖的专业意见。文章仅代表原作者个人观点，文章的发布和译文处理不代表本账号立场。
             </p>
           ) : page.footnote ? (
             <p 
               className="text-[14px] leading-relaxed text-left whitespace-pre-line"
               style={{ fontFamily: page.footnoteFont || page.footerFont }}
             >
               {page.footnote}
             </p>
           ) : null}
        </div>

        <div className="flex justify-between items-end">
          <span className="font-black uppercase tracking-widest text-xs">{page.footerLeft}</span>
          <div className="flex items-center gap-4">
            <span className="font-black uppercase tracking-widest text-xs">{page.footerRight}</span>
            <div className="flex gap-1.5 mb-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <div 
                  key={i} 
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${i === pageIndex ? `scale-125 ${footerStyle.dots.active}` : footerStyle.dots.inactive}`} 
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preview;
