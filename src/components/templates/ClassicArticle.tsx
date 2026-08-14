import React from 'react';
import { TemplateProps } from '../../types';
import { ArticleLayoutShell } from './ArticleLayoutShell';
import { formatMagazineText } from '../../utils/formatter';

export default function ClassicArticle({ page, pageIndex, totalPages }: TemplateProps) {
  const lineHeight = page.lineHeight || 1.6;
  const spacing = page.paragraphSpacing ?? 32;
  const accentColor = page.accentColor || '#367237';
  const imgPos = page.imagePosition || 'middle';
  const ratio = page.splitRatio || 64;
  const balance = page.fontBalance || 0;

  return (
    <ArticleLayoutShell page={page} pageIndex={pageIndex} totalPages={totalPages}>
      <div className="flex flex-col">
        {page.paragraphs?.map((p, index) => {
          const isLast = index === (page.paragraphs?.length || 0) - 1;
          const showBottomSpacing = !isLast || (isLast && imgPos === 'bottom');

          return (
            <div
              key={p.id}
              className="grid relative items-stretch"
              style={{
                gridTemplateColumns: `${ratio}fr ${100 - ratio}fr`,
                gap: '40px',
                marginBottom: showBottomSpacing ? `${spacing}px` : 0,
              }}
            >
              <div
                className={`transition-all duration-300 ${p.emphasis ? 'p-4 rounded-lg border-l-4' : ''}`}
                style={{
                  backgroundColor: p.emphasis ? `${accentColor}10` : 'transparent',
                  borderLeftColor: p.emphasis ? accentColor : 'transparent',
                }}
              >
                <p
                  className="text-justify whitespace-pre-wrap"
                  style={{
                    fontFamily: page.paragraphEnFont || "'Inter', sans-serif",
                    lineHeight,
                    fontSize: `${16.5 - balance * 0.5}px`,
                  }}
                >
                  {formatMagazineText(p.en || '')}
                </p>
              </div>
              <div
                className="border-l pl-10 transition-all duration-300"
                style={{
                  borderLeftColor: p.emphasis ? `${accentColor}40` : '#e5e5e5',
                  backgroundColor: p.emphasis ? `${accentColor}08` : 'transparent',
                }}
              >
                <p
                  className="text-neutral-700 font-normal text-justify whitespace-pre-wrap"
                  style={{
                    fontFamily: page.paragraphZhFont || "'Crimson Pro', serif",
                    lineHeight,
                    fontSize: `${19 + balance * 0.8}px`,
                  }}
                >
                  {formatMagazineText(p.zh || '')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </ArticleLayoutShell>
  );
}
