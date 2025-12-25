import React, { useRef, useState, useLayoutEffect } from 'react';
import { PageData } from '../../types';
import AutoFitHeadline from '../AutoFitHeadline';

interface TemplateProps {
  page: PageData;
}

export default function Cinematic({ page }: TemplateProps) {
  const config = page.imageConfig || { scale: 1, x: 0, y: 0, height: 450 };
  const posX = 50 - (config.x / 2);
  const posY = 50 - (config.y / 2);

  // Split byline: expecting "Author | Magazine"
  const parts = page.byline.split('|').map(s => s.trim());
  let author = parts[0] || '';
  const magazine = parts[1] || '';

  // Strip "By " or "by " from the beginning of author name
  author = author.replace(/^(by\s+|By\s+)/i, '');

  return (
    <div className="w-full h-full bg-white flex flex-col items-center pt-32 relative overflow-hidden">
      {/* Top Metadata */}
      <div className="absolute top-12 left-0 w-full px-16 flex justify-between items-start">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 leading-none">Issue</span>
          <span className="text-xl font-black text-[#264376] mt-1">#042</span>
        </div>
        
        {/* Mirrored Right Side: Magazine on top, Author below */}
        <div className="text-right flex flex-col items-end">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 leading-none">
            {magazine || 'Publication'}
          </span>
          <span className="text-xl font-black text-[#264376] mt-1 uppercase tracking-tight">
            {author || 'Author'}
          </span>
        </div>
      </div>

      {/* Cinematic Frame (16:9 Aspect Ratio) */}
      <div className="w-full relative bg-slate-900 border-y-[24px] border-black shadow-2xl group">
        <div className="aspect-[16/9] w-full overflow-hidden">
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
        </div>
        <div className="absolute inset-0 pointer-events-none bg-black/5 mix-blend-overlay" />
        
        <div className="absolute bottom-2 right-4 flex items-center gap-3 opacity-40 text-white pointer-events-none">
          <span className="text-[7px] font-bold uppercase tracking-[0.2em]">Captured on 35mm Digital</span>
          <div className="h-2 w-px bg-white/30" />
          <span className="text-[7px] font-bold uppercase tracking-[0.2em]">2.35:1 Anamorphic</span>
        </div>
      </div>

      {/* Minimalist Bottom Content - Centered in remaining space */}
      <div className="px-16 flex flex-col items-center justify-center text-center flex-1 w-full min-h-0">
        <div className="space-y-6 w-full py-12">
          <AutoFitHeadline
            as="h1"
            text={page.titleEn}
            maxSize={28}
            lineHeight={1.2}
            maxLines={4}
            fontFamily={page.titleEnFont || "'Inter', sans-serif"}
            className="font-black uppercase tracking-[0.6em] text-slate-900"
          />
          <AutoFitHeadline
            as="h2"
            text={page.titleZh}
            maxSize={42}
            lineHeight={1.3}
            maxLines={3}
            fontFamily={page.titleZhFont || "'Noto Serif SC', serif"}
            className="font-black tracking-[0.1em] text-slate-800"
          />
        </div>
      </div>
    </div>
  );
}