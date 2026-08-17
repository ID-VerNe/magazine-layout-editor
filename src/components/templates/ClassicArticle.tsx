import React from 'react';
import { TemplateProps } from '../../types';
import { ArticleLayoutShell } from './ArticleLayoutShell';
import { SplitParagraphBlock, DEFAULT_EN_FONT, DEFAULT_ZH_FONT } from './SplitLayout';
import { clampSplitRatio, clampFontBalance } from '../../utils/layoutMath';

export default function ClassicArticle({ page, pageIndex, totalPages }: TemplateProps) {
  const lineHeight = page.lineHeight || 1.6;
  const spacing = page.paragraphSpacing ?? 32;
  const accentColor = page.accentColor || '#367237';
  const imgPos = page.imagePosition || 'middle';
  const ratio = clampSplitRatio(page.splitRatio);
  const balance = clampFontBalance(page.fontBalance);

  return (
    <ArticleLayoutShell page={page} pageIndex={pageIndex} totalPages={totalPages}>
      <div className="flex flex-col">
        {page.paragraphs?.map((p, index) => {
          const isLast = index === (page.paragraphs?.length || 0) - 1;
          const showBottomSpacing = !isLast || (isLast && imgPos === 'bottom');
          return (
            <SplitParagraphBlock
              key={p.id}
              p={p}
              enFont={page.paragraphEnFont || DEFAULT_EN_FONT}
              zhFont={page.paragraphZhFont || DEFAULT_ZH_FONT}
              lineHeight={lineHeight}
              ratio={ratio}
              balance={balance}
              accentColor={accentColor}
              marginBottom={showBottomSpacing ? spacing : 0}
            />
          );
        })}
      </div>
    </ArticleLayoutShell>
  );
}