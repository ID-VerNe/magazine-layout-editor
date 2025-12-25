import React from 'react';
import { PageData } from '../../types';
import AutoFitHeadline from '../AutoFitHeadline';

interface TemplateProps {
  page: PageData;
}

export default function ImpactBold({ page }: TemplateProps) {
  const config = page.imageConfig || { scale: 1, x: 0, y: 0, height: 1131 };
  const posX = 50 - (config.x / 2);
  const posY = 50 - (config.y / 2);

  return (
    <div className="relative w-full h-full flex flex-col justify-center overflow-hidden bg-slate-950">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        {page.image && (
          <img 
            src={page.image} 
            className="w-full h-full object-cover" 
            style={{
              transform: `scale(${config.scale})`,
              objectPosition: `${posX}% ${posY}%`,
            }}
          />
        )}
        {/* Strong Global Dark Mask for maximum readability */}
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 p-16 space-y-12 text-white text-center flex flex-col items-center">
        <div className="space-y-8 w-full max-w-3xl">
          <AutoFitHeadline
            as="h1"
            text={page.titleEn}
            maxSize={44}
            lineHeight={1.1}
            maxLines={4}
            fontFamily={page.titleEnFont || "'Inter', sans-serif"}
            className="font-black uppercase tracking-tighter"
          />
          <AutoFitHeadline
            as="h2"
            text={page.titleZh}
            maxSize={60}
            lineHeight={1.2}
            maxLines={4}
            fontFamily={page.titleZhFont || "'Noto Serif SC', serif"}
            className="font-black tracking-tight"
          />
        </div>

        <div className="flex flex-col items-center gap-4 pt-4">
          <div className="h-[2px] w-12 bg-white" />
          <span 
            className="text-lg font-black tracking-[0.2em] uppercase opacity-90"
            style={{ fontFamily: page.bylineFont || "'Inter', sans-serif" }}
          >
            {page.byline}
          </span>
        </div>

        {(page.quoteEn || page.quoteZh) && (
          <div className="max-w-2xl border-t-2 border-white/20 pt-8 space-y-4 mt-4">
            {page.quoteEn && (
              <p className="text-xl italic font-medium opacity-90 leading-relaxed" style={{ fontFamily: page.quoteEnFont }}>
                "{page.quoteEn}"
              </p>
            )}
            {page.quoteZh && (
              <p className="text-2xl font-light opacity-80 leading-snug" style={{ fontFamily: page.quoteZhFont }}>
                {page.quoteZh}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}