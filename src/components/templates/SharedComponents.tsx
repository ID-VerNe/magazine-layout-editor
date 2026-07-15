import React from 'react';
import { PageData } from '../../types';
import { formatMagazineText } from '../../utils/formatter';

export const ImageFrame: React.FC<{ page: PageData, defaultHeight: number }> = ({ page, defaultHeight }) => {
  const config = page.imageConfig || { scale: 1, x: 0, y: 0, height: defaultHeight };
  const posX = 50 - (config.x / 2);
  const posY = 50 - (config.y / 2);

  return (
    <div className="relative overflow-hidden" style={{ height: `${config.height}px` }}>
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
            backgroundColor: page.featuredText ? (page.badgeColor || page.accentColor || '#ccff33') : 'transparent',
            padding: page.featuredText ? '4px 12px' : '0px',
            borderRadius: `${page.badgeRadius ?? (page.featuredText ? 15 : 0)}px`,
            boxShadow: page.featuredText ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none',
            transform: `translate(${page.logoX || 0}px, ${page.logoY || 0}px)`
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
             <span className="font-bold text-xl magazine-serif-zh text-[#111] whitespace-pre-wrap">
               {formatMagazineText(page.featuredText)}
             </span>
           )}
        </div>
      )}
    </div>
  );
};

export const BylineDisplay: React.FC<{ byline?: string, fontFamily: string, className?: string }> = ({ byline = "", fontFamily, className }) => {
  if (!byline || !byline.includes('|')) {
    return <span className={`italic ${className} whitespace-pre-wrap`} style={{ fontFamily }}>{formatMagazineText(byline)}</span>;
  }
  const [name, ...rest] = byline.split('|');
  const org = '|' + rest.join('|');
  return (
    <span className={`${className} whitespace-pre-wrap`} style={{ fontFamily }}>
      <span className="italic">{formatMagazineText(name)}</span>
      <span>{formatMagazineText(org)}</span>
    </span>
  );
};

export const FooterDisplay: React.FC<{ page: PageData, pageIndex: number, totalPages: number }> = ({ page, pageIndex, totalPages }) => {
  const layout = page.layoutId;
  const bgColor = page.backgroundColor || '#FAF9F4';
  const r = parseInt(bgColor.slice(1, 3), 16);
  const g = parseInt(bgColor.slice(3, 5), 16);
  const b = parseInt(bgColor.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  const isDark = brightness < 128;

  const showDisclaimer = !page.hideDisclaimer && (page.type === 'cover' || (page.type === 'article' && !page.footnote));
  const hasTopContent = showDisclaimer || page.footnote;

  const styles = layout === 'blueprint' 
    ? { container: "text-slate-500 border-t border-slate-300", dots: { active: "bg-slate-800", inactive: "bg-slate-200" } }
    : layout === 'typography'
    ? { container: `${isDark ? 'text-white/40' : 'text-slate-400'} border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`, dots: { active: isDark ? "bg-white/60" : "bg-slate-600", inactive: isDark ? "bg-white/10" : "bg-slate-200" } }
    : { container: "text-neutral-500 border-t border-neutral-200", dots: { active: "bg-neutral-600", inactive: "bg-neutral-200" } };

  const isReversed = page.footerSwap;
  const isLogo = page.footerRightType === 'logo';
  const offsetX = page.footerRightX || 0;
  const offsetY = page.footerRightY || 0;

  const DotsPart = (
    <div className="flex gap-1.5 mb-1 shrink-0">
      {Array.from({ length: totalPages }).map((_, i) => (
        <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === pageIndex ? `scale-125 ${styles.dots.active}` : styles.dots.inactive}`} />
      ))}
    </div>
  );

  const ContentPart = (
    <div className="relative flex items-center" style={{ transform: `translate(${offsetX}px, ${offsetY}px)` }}>
      {isLogo && page.footerLogo ? (
        <div style={{ height: `${page.footerLogoSize || 24}px` }} className="flex items-center">
          <img src={page.footerLogo} className="h-full w-auto object-contain" alt="Footer Logo" />
        </div>
      ) : (
        <span className="font-black uppercase tracking-widest text-[10px] whitespace-nowrap">
          {formatMagazineText(page.footerRight || page.footerLeft || "")}
        </span>
      )}
    </div>
  );

  return (
    <div 
      className={`px-10 flex flex-col text-lg z-20 mt-auto transition-all duration-500 ${styles.container} ${hasTopContent ? 'pt-8 pb-10' : 'pt-10 pb-10'}`} 
      style={{ 
        fontFamily: page.footerFont || "'Inter', sans-serif",
        backgroundColor: page.backgroundColor || '#FAF9F4'
      }}
    >
      {hasTopContent && (
        <div className="w-full mb-6 animate-in fade-in slide-in-from-top-1">
           {showDisclaimer ? (
             <p className="text-[14px] leading-relaxed text-justify w-full opacity-40">
               本文是为提供一般信息的用途所撰写/翻译，文章仅代表原作者个人观点，不代表本账号立场。
             </p>
           ) : page.footnote ? (
             <p className="text-[14px] leading-relaxed text-left whitespace-pre-line" style={{ fontFamily: page.footnoteFont || page.footerFont }}>
               {page.footnote}
             </p>
           ) : null}
        </div>
      )}
      
      <div className={`flex justify-between items-center w-full mt-auto ${isReversed ? 'flex-row-reverse' : ''}`}>
        {DotsPart}
        {ContentPart}
      </div>
    </div>
  );
};
