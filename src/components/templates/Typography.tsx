import React from 'react';
import { PageData } from '../../types';
import AutoFitHeadline from '../AutoFitHeadline';
import { formatMagazineText } from '../../utils/formatter';
import { FooterDisplay } from './SharedComponents';

interface TemplateProps {
  page: PageData;
  pageIndex: number;
  totalPages: number;
}

function getBrightness(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

export default function Typography({ page, pageIndex, totalPages }: TemplateProps) {
  const bgColor = page.backgroundColor || '#020617';
  const isDark = getBrightness(bgColor) < 128;
  
  const accentColor = page.accentColor || '#367237';
  const baseTextColor = isDark ? 'text-white' : 'text-slate-900';
  const labelMutedColor = isDark ? 'text-white/30' : 'text-slate-400';
  const navBorderColor = isDark ? 'border-white/10' : 'border-slate-200';

  return (
    <div className="w-full h-full flex flex-col font-sans relative overflow-hidden" style={{ backgroundColor: bgColor }}>
      <div className={`flex-1 flex flex-col p-12 justify-between ${baseTextColor}`}>
        {/* Subtle Grain/Noise Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

        {/* Top Navigation */}
        <div className={`flex justify-between items-start z-10 border-b pb-4 ${navBorderColor}`}>
          <span className={`text-[10px] font-black uppercase tracking-[0.5em] ${labelMutedColor}`}>Edition // 2025</span>
          <div className={`flex gap-12 text-[10px] font-black uppercase tracking-[0.5em] ${labelMutedColor}`}>
            <span>Vision</span>
            <span>Statement</span>
            <span>Archive</span>
          </div>
        </div>

        {/* Massive Typographic Section */}
        <div className="flex-1 flex flex-col justify-center py-12 space-y-8 z-10 overflow-hidden">
          <div className="w-full">
            <AutoFitHeadline
              as="h1"
              text={page.titleEn || ""}
              maxSize={110}
              lineHeight={0.85}
              maxLines={6}
              fontFamily={page.titleEnFont || "'Inter', sans-serif"}
              className={`font-black uppercase tracking-[-0.05em] break-words ${baseTextColor}`}
            />
          </div>
          <div className="h-px w-full opacity-30" style={{ background: `linear-gradient(to right, ${accentColor}, transparent)` }} />
          <div className="w-full">
            <AutoFitHeadline
              as="h2"
              text={page.titleZh || ""}
              maxSize={64}
              lineHeight={1.1}
              maxLines={3}
              fontFamily={page.titleZhFont || "'Noto Serif SC', serif"}
              className={`font-black tracking-tighter ${isDark ? 'text-white/60' : 'text-slate-500'}`}
            />
          </div>
        </div>

        {/* Bottom Metadata Section */}
        <div className={`grid grid-cols-2 gap-12 z-10 pt-12 border-t ${navBorderColor}`}>
          <div className="space-y-4">
            <span className={`inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${isDark ? 'bg-white text-black' : 'bg-slate-900 text-white'}`}>
              Author_Credit
            </span>
            <p className={`text-lg font-bold uppercase tracking-tight whitespace-pre-wrap ${isDark ? 'text-white/80' : 'text-slate-800'}`}>
              {formatMagazineText(page.byline || "")}
            </p>
          </div>

          <div className="space-y-4 flex flex-col justify-between">
            {(page.quoteEn || page.quoteZh) && (
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: accentColor, opacity: 0.8 }}>Abstract_Context</span>
                <div className={`space-y-2 line-clamp-4 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                  {page.quoteEn && <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap">{formatMagazineText(page.quoteEn)}</p>}
                  {page.quoteZh && <p className="text-xs font-bold leading-relaxed whitespace-pre-wrap">{formatMagazineText(page.quoteZh)}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <FooterDisplay page={page} pageIndex={pageIndex} totalPages={totalPages} />
    </div>
  );
}
