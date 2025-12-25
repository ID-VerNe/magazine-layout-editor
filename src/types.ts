
export type PageType = 'cover' | 'article';

export interface Paragraph {
  id: string;
  en: string;
  zh: string;
  enFont?: string;
  zhFont?: string;
}

export interface ImageConfig {
  scale: number;
  x: number;
  y: number;
  height: number;
}

export interface PageData {
  id: string;
  type: PageType;
  layoutId?: string;
  lastCoverLayoutId?: string;
  lastArticleLayoutId?: string;
  image: string;
  logo?: string; 
  logoSize?: number;
  badgeColor?: string;
  badgeRadius?: number;
  hideDisclaimer?: boolean;
  backgroundColor?: string;
  imageConfig?: ImageConfig;
  titleEn: string;
  titleZh: string;
  byline: string;
  footerLeft: string;
  footerRight: string;
  lineHeight?: number; // Line spacing for paragraphs
  paragraphSpacing?: number; // Spacing between paragraphs
  
  // Font settings
  titleEnFont?: string;
  titleZhFont?: string;
  bylineFont?: string;
  quoteEnFont?: string;
  quoteZhFont?: string;
  footerFont?: string;
  paragraphEnFont?: string;
  paragraphZhFont?: string;
  footnoteFont?: string;

  // Cover specific
  quoteEn?: string;
  quoteZh?: string;
  featuredText?: string;
  // Article specific
  paragraphs?: Paragraph[];
  footnote?: string;
}

export interface CustomFont {
  name: string;
  family: string;
  dataUrl?: string; // Store actual font data for export/import
}

export interface ProjectData {
  version: string;
  pages: PageData[];
  customFonts: CustomFont[];
  settings: {
    enforceA4: boolean;
  }
}

export interface AppState {
  pages: PageData[];
  currentPageId: string;
}
