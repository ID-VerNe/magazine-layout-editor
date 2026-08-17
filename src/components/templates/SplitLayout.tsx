import React from 'react';
import { Paragraph, ExternalAnnotation, PageData } from '../../types';
import { formatMagazineText } from '../../utils/formatter';
import { getAnnotationThemeCSS } from '../editor/intensive/annotationHelpers';
import { sanitizeRichContent, sanitizeComment } from '../../utils/sanitize';
import { DEFAULT_FONTS } from '../../utils/themeConstants';

// 双栏模板共用的默认字体（权威来源见 utils/themeConstants.ts）
export const DEFAULT_EN_FONT = DEFAULT_FONTS.en;
export const DEFAULT_ZH_FONT = DEFAULT_FONTS.zh;

/**
 * 段落双栏块（英 / 中对照）。
 * 供 classic-article 与 classic-cover 复用段落渲染，避免两份重复实现。
 */
export const SplitParagraphBlock: React.FC<{
  p: Paragraph;
  enFont: string;
  zhFont: string;
  lineHeight: number;
  ratio: number;
  balance: number;
  accentColor: string;
  marginBottom?: number;
}> = ({ p, enFont, zhFont, lineHeight, ratio, balance, accentColor, marginBottom = 0 }) => (
  <div
    className="grid relative items-stretch"
    style={{
      gridTemplateColumns: `${ratio}fr ${100 - ratio}fr`,
      gap: '40px',
      marginBottom,
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
        style={{ fontFamily: enFont, lineHeight, fontSize: `${16.5 - balance * 0.5}px` }}
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
        style={{ fontFamily: zhFont, lineHeight, fontSize: `${19 + balance * 0.8}px` }}
      >
        {formatMagazineText(p.zh || '')}
      </p>
    </div>
  </div>
);

/**
 * 注解双栏（正文 + 注解列）。
 * 供 classic-cover 与 intensive-reading 复用；className 可透传（如 flex-1 占满）。
 */
export const SplitIntensiveGrid: React.FC<{
  leftContent: string;
  annotations: ExternalAnnotation[];
  enFont: string;
  zhFont: string;
  lineHeight: number;
  ratio: number;
  balance: number;
  hideAnnotationSeq?: boolean;
  className?: string;
}> = ({
  leftContent,
  annotations,
  enFont,
  zhFont,
  lineHeight,
  ratio,
  balance,
  hideAnnotationSeq,
  className = '',
}) => (
  <div
    className={`grid relative items-stretch ${className}`}
    style={{
      gridTemplateColumns: `${ratio}fr ${100 - ratio}fr`,
      gap: '40px',
    }}
  >
    <div
      className="prose max-w-none"
      style={{ fontFamily: enFont, lineHeight, fontSize: `${16.5 - balance * 0.5}px` }}
      dangerouslySetInnerHTML={{ __html: sanitizeRichContent(leftContent) }}
    />
    <div
      className="border-l pl-10 border-neutral-200 prose max-w-none"
      style={{ fontFamily: zhFont, lineHeight, fontSize: `${14 + balance * 0.5}px` }}
    >
      {(annotations || []).map((ann) => (
        <div key={ann.id} className="annotation-block">
          <div className="annotation-label">
            {!hideAnnotationSeq && <span className="annotation-seq">[{ann.seq}]</span>}{' '}
            <span className="annotation-word" style={ann.fontSize ? { fontSize: ann.fontSize } : undefined}>
              {ann.text}
            </span>
          </div>
          <div
            className="annotation-content"
            dangerouslySetInnerHTML={{ __html: sanitizeComment(ann.comment || '') }}
          />
        </div>
      ))}
    </div>
  </div>
);

/**
 * 注解 mark 的页面级样式注入。
 * 供 classic-cover 与 intensive-reading 复用，避免重复的 <style> 片段。
 */
export const AnnotationStyles: React.FC<{
  pageClass: string;
  annotationTheme?: PageData['annotationTheme'];
  hideAnnotationSeq?: boolean;
}> = ({ pageClass, annotationTheme, hideAnnotationSeq }) => (
  <style
    dangerouslySetInnerHTML={{
      __html: `
     .${pageClass} mark[data-annotation-id] {
       ${getAnnotationThemeCSS(annotationTheme)}
       position: relative;
       color: inherit;
     }
     ${
       !hideAnnotationSeq
         ? `
     .${pageClass} mark[data-annotation-id]::after {
       content: "[" attr(data-seq) "]";
       vertical-align: super;
       font-size: 0.75em;
       color: inherit;
       margin-left: 2px;
       font-weight: bold;
     }
     `
         : ''
     }
   `,
    }}
  />
);