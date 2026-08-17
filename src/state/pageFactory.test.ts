import { describe, it, expect } from 'vitest';
import {
  createPageFromTemplate,
  DEFAULT_INHERIT_FIELDS,
  getTemplateSpec,
  nextParagraphId,
} from './pageFactory';
import {
  DEFAULT_ACCENT,
  DEFAULT_PAPER,
  DEFAULT_FONTS,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_PARAGRAPH_SPACING,
} from '../utils/themeConstants';
import type { PageData } from '../types';

/**
 * pageFactory.ts 单元测试。
 *
 * 说明：
 * - pageFactory 是纯逻辑模块，不依赖 IndexedDB 或浏览器私有 API，jsdom 下可完整运行，
 *   因此无需跳过任何用例。
 * - 下方「越界字段」用例验证：pageFactory 在返回前会统一钳制 splitRatio（50~80）与
 *   fontBalance（-5~5），与 utils/layoutMath 的防御性兜底保持一致；越界值经 sourcePage
 *   继承时会被拉回安全范围，而非法值（undefined/NaN）则回退到默认 64 / 0。
 */

// 构造一个字段完整的 sourcePage，便于测试继承/不可变性
const makeSourcePage = (overrides: Partial<PageData> = {}): PageData => ({
  id: 'source-page-1',
  type: 'cover',
  layoutId: 'classic-cover',
  image: 'https://example.com/source.jpg',
  titleEn: 'Source English Title',
  titleZh: '来源中文标题',
  byline: 'Source Byline',
  footerLeft: 'Source Footer Left',
  footerRight: 'Source Footer Right',
  splitRatio: 70,
  fontBalance: 5,
  accentColor: '#123456',
  ...overrides,
});

describe('createPageFromTemplate：新页面创建', () => {
  it('无参数调用创建默认封面页，基础字段齐全且符合 types.ts / templates.ts 约定', () => {
    const page = createPageFromTemplate();
    // 身份字段
    expect(page.id).toMatch(/^page-\d+-[a-z0-9]{6}$/);
    expect(page.type).toBe('cover');
    expect(page.layoutId).toBe('classic-cover'); // DEFAULT_COVER_TEMPLATE_ID
    // 图片与文字默认值
    expect(page.image).toBe('https://picsum.photos/id/43/1200/1600');
    expect(page.titleEn).toBe('Example English Title');
    expect(page.titleZh).toBe('示例中文标题');
    expect(page.byline).toBe('By Author Name | PUBLICATION');
    expect(page.footerLeft).toBe('Footer Left Label');
    expect(page.footerRight).toBe('Footer Right Label');
    // 版式与颜色默认值（来自 themeConstants）
    expect(page.lineHeight).toBe(DEFAULT_LINE_HEIGHT); // 1.6
    expect(page.paragraphSpacing).toBe(DEFAULT_PARAGRAPH_SPACING); // 32
    expect(page.backgroundColor).toBe(DEFAULT_PAPER);
    expect(page.accentColor).toBe(DEFAULT_ACCENT);
    expect(page.splitRatio).toBe(64);
    expect(page.fontBalance).toBe(0);
    // 页脚默认值
    expect(page.footerSwap).toBe(false);
    expect(page.footerRightType).toBe('text');
    expect(page.footerLogoSize).toBe(24);
    expect(page.footerRightX).toBe(0);
    expect(page.footerRightY).toBe(0);
    // 字体默认值（来自 themeConstants：英文回退 Inter，中文回退 Crimson Pro）
    expect(page.titleEnFont).toBe(DEFAULT_FONTS.en);
    expect(page.titleZhFont).toBe(DEFAULT_FONTS.zh);
    expect(page.paragraphEnFont).toBe(DEFAULT_FONTS.en);
    expect(page.paragraphZhFont).toBe(DEFAULT_FONTS.zh);
    expect(page.bylineFont).toBe(DEFAULT_FONTS.en);
    expect(page.footerFont).toBe(DEFAULT_FONTS.en);
    expect(page.quoteEnFont).toBe(DEFAULT_FONTS.en);
    expect(page.quoteZhFont).toBe(DEFAULT_FONTS.zh);
  });

  it('每次创建生成互不相同的 id，避免 id 冲突', () => {
    const a = createPageFromTemplate();
    const b = createPageFromTemplate();
    expect(a.id).not.toBe(b.id);
  });

  it('空配置 createPageFromTemplate({}) 与无参调用结果等价（回退到默认封面）', () => {
    const empty = createPageFromTemplate({});
    expect(empty.type).toBe('cover');
    expect(empty.layoutId).toBe('classic-cover');
    expect(empty.coverContentMode).toBe('split');
  });
});

describe('createPageFromTemplate：模板初始化结构差异', () => {
  it('classic-cover 默认正文模式为 split（双栏段落），清空引言、无 leftContent、预置一条默认段落', () => {
    const page = createPageFromTemplate({ templateId: 'classic-cover' });
    // 项目约定：classic-cover 走双栏段落模式
    expect(page.coverContentMode).toBe('split');
    // 双栏段落模式清空引言，避免与新页面的段落双栏叠加渲染
    expect(page.quoteEn).toBeUndefined();
    expect(page.quoteZh).toBeUndefined();
    expect(page.leftContent).toBeUndefined();
    expect(page.annotations).toBeUndefined();
    // 双栏模式下默认给出一条待写作段落
    expect(page.paragraphs).toHaveLength(1);
    expect(page.paragraphs![0]).toMatchObject({ en: 'Start writing...', zh: '开始写作...' });
    // 尾注徽标保留默认值
    expect(page.featuredText).toBe('@ExampleBadge');
  });

  it('非 classic 的封面模板（impact-bold）不套用 split 约定，保留引言、无段落', () => {
    const page = createPageFromTemplate({ templateId: 'impact-bold' });
    expect(page.type).toBe('cover');
    expect(page.layoutId).toBe('impact-bold');
    // 缺 coverContentMode：源码仅对 classic-cover 兜底为 'split'，其它封面模板为 undefined
    expect(page.coverContentMode).toBeUndefined();
    expect(page.quoteEn).toBe('This is an example quote text in English.');
    expect(page.quoteZh).toBe('这是一段示例引言中文文字。');
    expect(page.paragraphs).toBeUndefined();
    expect(page.annotationStyle).toBeUndefined();
  });

  it('classic-article 创建文章页，预置默认段落，且不触发任何特殊分支', () => {
    const page = createPageFromTemplate({ templateId: 'classic-article' });
    expect(page.type).toBe('article');
    expect(page.layoutId).toBe('classic-article');
    expect(page.paragraphs).toHaveLength(1);
    expect(page.leftContent).toBeUndefined();
    expect(page.coverContentMode).toBeUndefined();
  });

  it('intensive-reading 走精读分支：初始化 leftContent 与 annotations，清空普通段落', () => {
    const page = createPageFromTemplate({ templateId: 'intensive-reading' });
    expect(page.type).toBe('article');
    expect(page.layoutId).toBe('intensive-reading');
    expect(page.leftContent).toBe('<p>Start typing the main article text here...</p>');
    expect(page.annotations).toEqual([]);
    expect(page.annotationStyle).toBe('dual');
    expect(page.annotationTheme).toBe('highlight');
    expect(page.hideAnnotationSeq).toBe(false);
    // 精读模式不保留普通段落，避免双栏重复叠加渲染
    expect(page.paragraphs).toBeUndefined();
  });

  it('仅指定 type 为 article 时，回退到默认文章模板', () => {
    const page = createPageFromTemplate({ type: 'article' });
    expect(page.type).toBe('article');
    expect(page.layoutId).toBe('classic-article'); // DEFAULT_ARTICLE_TEMPLATE_ID
  });

  it('传入未知 templateId 时，回退到默认封面模板', () => {
    const page = createPageFromTemplate({ templateId: 'not-a-real-template' });
    expect(page.type).toBe('cover');
    expect(page.layoutId).toBe('classic-cover');
  });
});

describe('createPageFromTemplate：数据清洗 / 字段兜底', () => {
  it('缺 coverContentMode 时，classic-cover 兜底为 split；其它模板保持 undefined', () => {
    const classic = createPageFromTemplate({ templateId: 'classic-cover' });
    const impact = createPageFromTemplate({ templateId: 'impact-bold' });
    expect(classic.coverContentMode).toBe('split');
    expect(impact.coverContentMode).toBeUndefined();
  });

  it('sourcePage 中字段为 undefined 时不覆盖默认值（空文本兜底）', () => {
    const source = makeSourcePage({ titleEn: undefined as unknown as string });
    const page = createPageFromTemplate({
      sourcePage: source,
      inheritFields: ['titleEn'],
    });
    // 继承逻辑仅在 sourcePage[field] !== undefined 时才复制，因此保留默认标题
    expect(page.titleEn).toBe('Example English Title');
  });

  it('splitRatio / fontBalance 越界值经继承时被钳制回安全范围', () => {
    const source = makeSourcePage({ splitRatio: 999, fontBalance: 1000 });
    const page = createPageFromTemplate({
      sourcePage: source,
      inheritFields: ['splitRatio', 'fontBalance'],
    });
    // pageFactory 返回前统一走 clampSplitRatio / clampFontBalance：越界拉回边界。
    expect(page.splitRatio).toBe(80);
    expect(page.fontBalance).toBe(5);
  });

  it('splitRatio / fontBalance 非法值经继承时回退到默认 64 / 0', () => {
    const source = makeSourcePage({ splitRatio: NaN, fontBalance: -Infinity });
    const page = createPageFromTemplate({
      sourcePage: source,
      inheritFields: ['splitRatio', 'fontBalance'],
    });
    // Number.isFinite 拦截非有限值，回退默认值。
    expect(page.splitRatio).toBe(64);
    expect(page.fontBalance).toBe(0);
  });
});

describe('createPageFromTemplate：不可变性与返回值', () => {
  it('从 sourcePage 继承指定字段（titleEn/titleZh/splitRatio/fontBalance/accentColor）', () => {
    const source = makeSourcePage({
      titleEn: 'Inherited EN',
      titleZh: '继承中文',
      splitRatio: 70,
      fontBalance: 5,
      accentColor: '#123456',
    });
    const page = createPageFromTemplate({
      sourcePage: source,
      inheritFields: ['titleEn', 'titleZh', 'splitRatio', 'fontBalance', 'accentColor'],
    });
    expect(page.titleEn).toBe('Inherited EN');
    expect(page.titleZh).toBe('继承中文');
    expect(page.splitRatio).toBe(70);
    expect(page.fontBalance).toBe(5);
    expect(page.accentColor).toBe('#123456');
  });

  it('返回全新对象，不修改入参 sourcePage（不可变性）', () => {
    const source = makeSourcePage({
      titleEn: 'Keep Me',
      splitRatio: 70,
      accentColor: '#123456',
    });
    const initialSplitRatio = source.splitRatio;
    const initialAccent = source.accentColor;
    const initialTitle = source.titleEn;

    const page = createPageFromTemplate({
      sourcePage: source,
      inheritFields: ['titleEn', 'splitRatio', 'accentColor'],
    });

    // 返回值与入参不是同一对象引用
    expect(page).not.toBe(source);
    // 入参未被改动
    expect(source.titleEn).toBe(initialTitle);
    expect(source.splitRatio).toBe(initialSplitRatio);
    expect(source.accentColor).toBe(initialAccent);
    // 返回值保留了正确结果（同时证明继承生效但不在原对象上发生）
    expect(page.titleEn).toBe('Keep Me');
    expect(page.splitRatio).toBe(70);
    expect(typeof page.id).toBe('string');
  });

  it('继承的引用类型字段（paragraphs）为深拷贝，与 source 非同一引用', () => {
    const srcParagraphs = [{ id: 'p-source', en: 'A', zh: '甲', emphasis: true }];
    const source = makeSourcePage({ paragraphs: srcParagraphs });
    const page = createPageFromTemplate({ sourcePage: source, inheritFields: ['paragraphs'] });
    // 内容一致
    expect(page.paragraphs).toEqual(srcParagraphs);
    // 但非同一引用（深拷贝，避免修改返回值污染来源页）
    expect(page.paragraphs).not.toBe(srcParagraphs);
  });
});

describe('辅助导出', () => {
  it('nextParagraphId 生成唯一、以 p- 开头且带随机段的段落 id', () => {
    const a = nextParagraphId();
    const b = nextParagraphId();
    expect(a).toMatch(/^p-\d+-[a-z0-9]{6}$/);
    expect(a).not.toBe(b);
  });

  it('getTemplateSpec 已知模板返回规格，未知模板返回 null', () => {
    expect(getTemplateSpec('classic-cover')?.id).toBe('classic-cover');
    expect(getTemplateSpec('CLASSIC-COVER')?.id).toBe('classic-cover'); // 匹配忽略大小写
    expect(getTemplateSpec('does-not-exist')).toBeNull();
    expect(getTemplateSpec(undefined)).toBeNull();
    expect(getTemplateSpec(null)).toBeNull();
  });

  it('DEFAULT_INHERIT_FIELDS 覆盖关键可继承字段（含 coverContentMode）', () => {
    expect(DEFAULT_INHERIT_FIELDS).toContain('coverContentMode');
    expect(DEFAULT_INHERIT_FIELDS).toContain('splitRatio');
    expect(DEFAULT_INHERIT_FIELDS).toContain('fontBalance');
  });
});