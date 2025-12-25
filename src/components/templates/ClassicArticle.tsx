import React from 'react';
import { PageData } from '../../types';

interface TemplateProps {
  page: PageData;
}

const ImageFrame: React.FC<{ page: PageData, defaultHeight: number }> = ({ page, defaultHeight }) => {
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

export default function ClassicArticle({ page }: TemplateProps) {
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
}
