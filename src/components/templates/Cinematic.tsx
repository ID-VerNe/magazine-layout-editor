import React, { useRef, useState, useLayoutEffect } from 'react';
import { PageData } from '../../types';
import AutoFitHeadline from '../AutoFitHeadline';
import { formatMagazineText } from '../../utils/formatter';
import { FooterDisplay } from './SharedComponents';

interface TemplateProps {
  page: PageData;
  pageIndex: number;
  totalPages: number;
}

export default function Cinematic({ page, pageIndex, totalPages }: TemplateProps) {
  const config = page.imageConfig || { scale: 1, x: 0, y: 0, height: 450 };
  const posX = 50 - (config.x / 2);
  const posY = 50 - (config.y / 2);

  // Split byline: expecting "Author | Magazine"
  const parts = (page.byline || "").split('|').map(s => s.trim());
  let author = parts[0] || '';
  const magazine = parts[1] || '';

  author = author.replace(/^(by\s+|By\s+)/i, '');

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden">
      <div className="flex-1 flex flex-col items-center pt-32">
        {/* Top Metadata */}
        <div className="absolute top-12 left-0 w-full px-16 flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 leading-none">Issue</span>
            <span className="text-xl font-black text-[#367237] mt-1">#042</span>
          </div>
          
          <div className="text-right flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 leading-none whitespace-pre-wrap" style={{ fontFamily: page.footerFont }}>
              {formatMagazineText(magazine || 'Publication')}
            </span>
            <span className="text-xl font-black text-[#367237] mt-1 uppercase tracking-tight whitespace-pre-wrap" style={{ fontFamily: page.bylineFont }}>
              {formatMagazineText(author || 'Author')}
            </span>
          </div>
        </div>

        {/* Cinematic Frame */}
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
        </div>

        {/* Bottom Content */}
        <div className="px-16 flex flex-col items-center justify-center text-center flex-1 w-full min-h-0">
          <div className="space-y-6 w-full py-12">
            <AutoFitHeadline
              as="h1"
              text={page.titleEn || ""}
              maxSize={28}
              lineHeight={1.2}
              maxLines={4}
              fontFamily={page.titleEnFont || "'Inter', sans-serif"}
              className="font-black uppercase tracking-[0.6em] text-slate-900"
            />
            <AutoFitHeadline
              as="h2"
              text={page.titleZh || ""}
              maxSize={42}
              lineHeight={1.3}
              maxLines={3}
              fontFamily={page.titleZhFont || "'Noto Serif SC', serif"}
              className="font-black tracking-[0.1em] text-slate-800"
            />
          </div>
        </div>
      </div>
      <FooterDisplay page={page} pageIndex={pageIndex} totalPages={totalPages} />
    </div>
  );
}