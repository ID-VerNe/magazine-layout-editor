import React from 'react';
import { PageData } from '../../types';

export const ImageFrame: React.FC<{ page: PageData, defaultHeight: number }> = ({ page, defaultHeight }) => {
  const config = page.imageConfig || { scale: 1, x: 0, y: 0, height: defaultHeight };
  
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

export const BylineDisplay: React.FC<{ byline: string, fontFamily: string, className?: string }> = ({ byline, fontFamily, className }) => {
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
