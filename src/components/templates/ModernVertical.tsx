import React from 'react';
import { TemplateProps } from '../../types';
import { ArticleLayoutShell } from './ArticleLayoutShell';
import { Quote } from 'lucide-react';
import { formatMagazineText } from '../../utils/formatter';

export default function ModernVertical({ page, pageIndex, totalPages }: TemplateProps) {
  const lineHeight = page.lineHeight || 1.6;
  const spacing = page.paragraphSpacing ?? 32;
  const accentColor = page.accentColor || '#367237';
  const imgPos = page.imagePosition || 'middle';

  return (
    <ArticleLayoutShell page={page} pageIndex={pageIndex} totalPages={totalPages}>
      <div className="flex flex-col">
        {page.paragraphs?.map((p, index) => {
          const isLast = index === (page.paragraphs?.length || 0) - 1;
          const showBottomSpacing = !isLast || (isLast && imgPos === 'bottom');

          return (
            <div
              key={p.id}
              className={`relative transition-all duration-300 ${
                p.emphasis ? 'p-5 mb-4 rounded-lg border-l-4 shadow-sm' : ''
              }`}
              style={{
                marginBottom: showBottomSpacing ? `${spacing}px` : 0,
                backgroundColor: p.emphasis ? `${accentColor}10` : 'transparent',
                borderLeftColor: p.emphasis ? accentColor : 'transparent',
              }}
            >
              {p.emphasis && (
                <div className="absolute top-2 right-3" style={{ color: `${accentColor}0D` }}>
                  <Quote size={20} />
                </div>
              )}
              <p
                className={`text-[17px] text-neutral-800 text-justify whitespace-pre-wrap ${
                  p.emphasis ? 'font-medium italic leading-relaxed' : ''
                }`}
                style={{
                  fontFamily: page.paragraphEnFont || "'Inter', sans-serif",
                  lineHeight,
                }}
              >
                {formatMagazineText(p.en || '')}
              </p>
            </div>
          );
        })}
      </div>
    </ArticleLayoutShell>
  );
}