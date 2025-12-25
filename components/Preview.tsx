
import React, { useRef, useEffect } from 'react';
import { PageData, ImageConfig } from '../types';

interface PreviewProps {
  page: PageData;
  pageIndex: number;
  totalPages: number;
  enforceA4?: boolean;
  onOverflowChange?: (isOverflowing: boolean) => void;
}

const BylineDisplay: React.FC<{ byline: string, fontFamily: string, className?: string }> = ({ byline, fontFamily, className }) => {
  if (!byline.includes('|')) {
    return <span className={`italic ${className}`} style={{ fontFamily }}>{byline}</span>;
  }
  
  const [name, ...rest] = byline.split('|');
  const org = '|' + rest.join('|');
  
  return (
    <span className={className} style={{ fontFamily }}>
      <span className="italic">{name}</span>
      <span>{org}</span>
    </span>
  );
};

const Preview: React.FC<PreviewProps> = ({ page, pageIndex, totalPages, enforceA4 = true, onOverflowChange }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  
  const pageHeightStyle = enforceA4 
    ? { height: '1131px', overflow: 'hidden' as const } 
    : { minHeight: '1131px' };

  // Detect overflow
  useEffect(() => {
    if (!enforceA4 || !contentRef.current || !onOverflowChange) return;

    const checkOverflow = () => {
      const element = contentRef.current;
      if (element) {
        // The content area is flex-1. We check if its scrollHeight is greater than its offsetHeight.
        // Actually, since it's flex-1, its offsetHeight is fixed by the flex layout.
        const isOverflowing = element.scrollHeight > element.offsetHeight;
        onOverflowChange(isOverflowing);
      }
    };

    // Check after render and on resize/content change
    checkOverflow();
    
    // Create a MutationObserver to watch for content changes
    const observer = new MutationObserver(checkOverflow);
    observer.observe(contentRef.current, { childList: true, subtree: true, characterData: true });

    window.addEventListener('resize', checkOverflow);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', checkOverflow);
    };
  }, [page, enforceA4, onOverflowChange]);

  // Show disclaimer if it's a cover OR if it's an article without a custom footnote
  // and it's not explicitly hidden
  const showDisclaimer = !page.hideDisclaimer && (page.type === 'cover' || (page.type === 'article' && !page.footnote));

  return (
    <div 
      className="magazine-page relative shadow-2xl mx-auto border border-neutral-300"
      style={{ 
        width: '800px', 
        backgroundColor: page.backgroundColor || '#FAF9F4',
        ...pageHeightStyle,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div ref={contentRef} className="flex-1 flex flex-col overflow-hidden">
        {page.type === 'cover' ? (
          <CoverContent page={page} />
        ) : (
          <ArticleContent page={page} />
        )}
      </div>

      <div 
        className="px-10 py-8 border-t border-neutral-200 flex flex-col text-neutral-500 text-lg z-10"
        style={{ 
          fontFamily: page.footerFont || "'Inter', sans-serif",
          backgroundColor: page.backgroundColor || '#FAF9F4'
        }}
      >
        {/* Full-width content above footer line */}
        <div className="w-full mb-6">
           {showDisclaimer ? (
             <p className="text-[14px] opacity-40 leading-relaxed text-justify w-full">
               本文是为提供一般信息的用途所撰写/翻译，并非旨在成为可依赖的专业意见。文章仅代表原作者个人观点，文章的发布和译文处理不代表本账号立场。
             </p>
           ) : page.footnote ? (
             <p 
               className="text-[14px] leading-relaxed text-neutral-400 text-left whitespace-pre-line"
               style={{ fontFamily: page.footnoteFont || page.footerFont }}
             >
               {page.footnote}
             </p>
           ) : null}
        </div>

        {/* Traditional Footer Line */}
        <div className="flex justify-between items-end">
          <span>{page.footerLeft}</span>
          <div className="flex items-center gap-4">
            <span>{page.footerRight}</span>
            <div className="flex gap-1.5 mb-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <div key={i} className={`w-2.5 h-2.5 rounded-full ${i === pageIndex ? 'bg-neutral-600' : 'bg-neutral-200'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ImageFrame: React.FC<{ page: PageData, defaultHeight: number }> = ({ page, defaultHeight }) => {
  const config = page.imageConfig || { scale: 1, x: 0, y: 0, height: defaultHeight };
  
  // Convert -100 to 100 range to 0% to 100% object-position
  // Inverting x/y because decreasing percentage moves image Right/Down (revealing Left/Top) which matches "Offset" intuition
  const posX = 50 - (config.x / 2);
  const posY = 50 - (config.y / 2);

  return (
    <div 
      className="relative bg-neutral-100 overflow-hidden" 
      style={{ height: `${config.height}px` }}
    >
      {page.image && (
        <img 
          src={page.image} 
          alt="feature" 
          className="w-full h-full object-cover" 
          style={{
            transform: `scale(${config.scale})`,
            objectPosition: `${posX}% ${posY}%`,
            transformOrigin: 'center center'
          }}
        />
      )}
      {page.type === 'cover' && (page.featuredText || page.logo) && (
        <div 
          className="absolute top-8 left-8 flex items-center gap-2 z-10"
          style={{ 
            backgroundColor: page.featuredText ? (page.badgeColor || '#ccff33') : 'transparent',
            padding: page.featuredText ? '4px 12px' : '0px',
            borderRadius: `${page.badgeRadius ?? (page.featuredText ? 15 : 0)}px`,
            boxShadow: page.featuredText ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none'
          }}
        >
           <div 
            className="flex items-center justify-center overflow-hidden"
            style={{ 
              width: page.featuredText ? '32px' : 'auto', 
              height: `${page.featuredText ? 32 : (page.logoSize || 32)}px`,
              borderRadius: `${(page.badgeRadius ?? 15) / 2}px`
            }}
           >
             {page.logo ? (
               <img src={page.logo} className="h-full w-auto object-contain" alt="Logo" />
             ) : (
               <div className="w-full h-full bg-blue-500 rounded flex items-center justify-center text-white font-bold text-lg">W</div>
             )}
           </div>
           {page.featuredText && (
             <span className="font-bold text-xl magazine-serif-zh text-[#111]">{page.featuredText}</span>
           )}
        </div>
      )}
    </div>
  );
};

const AutoFitHeadline: React.FC<{
  text: string,
  maxSize: number,
  lineHeight: number,
  fontFamily: string,
  className: string,
  as?: 'h1' | 'h2' | 'h3'
}> = ({ text, maxSize, lineHeight, fontFamily, className, as: Tag = 'h1' }) => {
  const [fontSize, setFontSize] = React.useState(maxSize);
  const ref = React.useRef<HTMLHeadingElement>(null);

  // Reset to max size whenever text or font changes to start recalculating down
  React.useLayoutEffect(() => {
    setFontSize(maxSize);
  }, [text, maxSize, fontFamily]);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Calculate if it exceeds 3 lines
    // We use a small buffer (3.2) to account for different font rendering
    const maxHeight = fontSize * lineHeight * 3.2;
    if (el.scrollHeight > maxHeight && fontSize > 12) {
      setFontSize(prev => prev - 1);
    }
  }, [text, fontSize, lineHeight, maxSize]);

  return (
    <Tag 
      ref={ref}
      className={className}
      style={{ 
        fontFamily,
        fontSize: `${fontSize}px`,
        lineHeight: lineHeight,
        display: 'block'
      }}
    >
      {text}
    </Tag>
  );
};

const CoverContent: React.FC<{ page: PageData }> = ({ page }) => {
  return (
    <>
      {page.image ? (
            <ImageFrame page={page} defaultHeight={500} />
          ) : (
        <div className="pt-20 px-10 relative">
          {(page.featuredText || page.logo) && (
            <div 
              className="inline-flex items-center gap-2 mb-6"
              style={{ 
                backgroundColor: page.featuredText ? (page.badgeColor || '#ccff33') : 'transparent',
                padding: page.featuredText ? '4px 12px' : '0px',
                borderRadius: `${page.badgeRadius ?? (page.featuredText ? 15 : 0)}px`,
                boxShadow: page.featuredText ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none'
              }}
            >
               <div 
                className="flex items-center justify-center overflow-hidden"
                style={{ 
                  width: page.featuredText ? '32px' : 'auto', 
                  height: `${page.featuredText ? 32 : (page.logoSize || 32)}px`,
                  borderRadius: `${(page.badgeRadius ?? 15) / 2}px`
                }}
               >
                {page.logo ? (
                  <img src={page.logo} className="h-full w-auto object-contain" alt="Logo" />
                ) : (
                  <div className="w-full h-full bg-blue-500 rounded flex items-center justify-center text-white font-bold text-lg">W</div>
                )}
               </div>
               {page.featuredText && (
                 <span className="font-bold text-xl magazine-serif-zh text-[#111]">{page.featuredText}</span>
               )}
            </div>
          )}
        </div>
      )}

      <div className={`px-10 flex-1 ${page.image ? 'py-10' : 'pb-10 pt-4'}`}>
        <div className="space-y-6">
          <AutoFitHeadline
            as="h1"
            text={page.titleEn}
            maxSize={34}
            lineHeight={1.15}
            fontFamily={page.titleEnFont || "'Inter', sans-serif"}
            className="font-bold text-[#222] max-w-[90%]"
          />
          <AutoFitHeadline
            as="h2"
            text={page.titleZh}
            maxSize={52}
            lineHeight={1.1}
            fontFamily={page.titleZhFont || "'Crimson Pro', serif"}
            className="font-black text-[#1a1a1a] tracking-tight"
          />
          
          <div className="flex items-center gap-3 pt-4">
            <span className="text-neutral-300 text-3xl">•</span>
            <BylineDisplay 
              byline={page.byline}
              fontFamily={page.bylineFont || "'Inter', sans-serif"}
              className="text-xl text-neutral-500"
            />
          </div>

          {(page.quoteEn || page.quoteZh) && (
            <div className="mt-10 bg-neutral-50 p-8 rounded-2xl border border-neutral-100/50 space-y-4 shadow-inner">
              {page.quoteEn && (
                <p 
                  className="text-xl text-neutral-600 italic"
                  style={{ 
                    fontFamily: page.quoteEnFont || "'Inter', sans-serif",
                    lineHeight: page.lineHeight || 1.6
                  }}
                >
                  {page.quoteEn}
                </p>
              )}
              {page.quoteZh && (
                <p 
                  className="text-2xl text-neutral-500 font-light"
                  style={{ 
                    fontFamily: page.quoteZhFont || "'Crimson Pro', serif",
                    lineHeight: page.lineHeight || 1.6
                  }}
                >
                  {page.quoteZh}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const ArticleContent: React.FC<{ page: PageData }> = ({ page }) => {
  const paragraphStyle = {
    lineHeight: page.lineHeight || 1.6
  };

  return (
    <div className="pt-10 pb-10">
       <div className="px-10 mb-2">
          <h3 
            className="font-bold text-lg mb-1 leading-tight"
            style={{ fontFamily: page.titleEnFont || "'Inter', sans-serif" }}
          >
            {page.titleEn}
          </h3>
          <div className="w-full h-[3px] bg-neutral-800 mb-4" />
          <div className="flex justify-between items-center text-neutral-500 mb-6">
            <BylineDisplay 
              byline={page.byline}
              fontFamily={page.bylineFont || "'Inter', sans-serif"}
            />
            <span className="font-bold not-italic" style={{ fontFamily: page.footerFont || "'Inter', sans-serif" }}>{page.footerLeft}</span>
          </div>
       </div>

      <div className="px-10 flex flex-col gap-8">
        {page.image && (
          <ImageFrame page={page} defaultHeight={300} />
        )}

        <div className="grid grid-cols-2 gap-x-12">
          {page.paragraphs?.map((p, index) => (
            <React.Fragment key={p.id}>
              <div 
                className={index !== (page.paragraphs?.length || 0) - 1 ? 'pb-8' : ''}
                style={{ paddingBottom: index !== (page.paragraphs?.length || 0) - 1 ? `${page.paragraphSpacing ?? 32}px` : 0 }}
              >
                <p 
                  className="text-[17px] text-neutral-800 text-justify"
                  style={{ 
                    fontFamily: page.paragraphEnFont || "'Inter', sans-serif",
                    ...paragraphStyle 
                  }}
                >
                  {p.en}
                </p>
              </div>
              <div 
                className={`border-l border-neutral-200 pl-12 ${index !== (page.paragraphs?.length || 0) - 1 ? 'pb-8' : ''}`}
                style={{ paddingBottom: index !== (page.paragraphs?.length || 0) - 1 ? `${page.paragraphSpacing ?? 32}px` : 0 }}
              >
                <p 
                  className="text-[18px] text-neutral-700 font-normal text-justify"
                  style={{ 
                    fontFamily: page.paragraphZhFont || "'Crimson Pro', serif",
                    ...paragraphStyle 
                  }}
                >
                  {p.zh}
                </p>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Preview;
