import React from 'react';
import { TemplateProps } from '../../types';
import { ArticleLayoutShell } from './ArticleLayoutShell';
import { SplitIntensiveGrid, AnnotationStyles, DEFAULT_EN_FONT, DEFAULT_ZH_FONT } from './SplitLayout';
import { clampSplitRatio, clampFontBalance } from '../../utils/layoutMath';

export const IntensiveReading: React.FC<TemplateProps> = ({ page, pageIndex, totalPages }) => {
  const lineHeight = page.lineHeight || 1.6;
  const ratio = clampSplitRatio(page.splitRatio);
  const balance = clampFontBalance(page.fontBalance);
  const pageClass = `intensive-page-${page.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  return (
    <ArticleLayoutShell
      page={page}
      pageIndex={pageIndex}
      totalPages={totalPages}
      className={`magazine-page ${pageClass} ${page.annotationStyle === 'single' ? 'annotation-style-single' : ''}`}
    >
      <SplitIntensiveGrid
        className="flex-1"
        leftContent={page.leftContent || ''}
        annotations={page.annotations || []}
        enFont={page.paragraphEnFont || DEFAULT_EN_FONT}
        zhFont={page.paragraphZhFont || DEFAULT_ZH_FONT}
        lineHeight={lineHeight}
        ratio={ratio}
        balance={balance}
        hideAnnotationSeq={page.hideAnnotationSeq}
      />
      <AnnotationStyles
        pageClass={pageClass}
        annotationTheme={page.annotationTheme}
        hideAnnotationSeq={page.hideAnnotationSeq}
      />
    </ArticleLayoutShell>
  );
};