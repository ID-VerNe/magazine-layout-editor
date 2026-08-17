import {
  serializeProject,
  sanitizeProjectData,
  parseProjectFile,
} from './projectSerializer';

// 说明：projectSerializer 的清洗逻辑为纯函数（sanitizeProjectData / serializeProject），
// 可直接全覆盖。parseProjectFile 依赖 FileReader/File/Blob —— jsdom 已实现这些 API，
// 因此也可在此环境直接验证。无 IndexedDB 依赖，无需跳过分支。

const LEGAL_PAGE = {
  id: 'page1',
  type: 'article',
  layoutId: 'classic-article',
  titleEn: 'Hello',
  titleZh: '你好',
  byline: 'by',
  footerLeft: 'l',
  footerRight: 'r',
  paragraphs: undefined,
  annotations: undefined,
};

describe('serializeProject（序列化）', () => {
  it('返回固定 version 与 settings.pageSize', () => {
    const data = serializeProject([LEGAL_PAGE as any], [], 'A4');
    expect(data.version).toBe('1.0');
    expect(data.settings.pageSize).toBe('A4');
    expect(data.pages).toEqual([LEGAL_PAGE]);
    expect(data.customFonts).toEqual([]);
  });
});

describe('sanitizeProjectData（解析清洗，纯函数）', () => {
  it('合法输入正确解析，数值/布尔字段类型保真', () => {
    const raw = {
      version: '1.0',
      settings: { pageSize: 'A4' },
      pages: [
        {
          id: 'p1',
          type: 'article',
          layoutId: 'classic-article',
          image: 'https://cdn.example.com/a.png',
          hideDisclaimer: true,
          showApprovedStamp: false,
          logoSize: 42,
          lineHeight: 1.5,
          titleEn: 'Title',
          paragraphs: [
            { id: 'pa1', en: 'EN', zh: '中文', emphasis: true, enFont: 'Serif', zhFont: 'Sans' },
          ],
          annotations: [
            { id: 'ann1', seq: 2, text: 'note', from: 0, to: 12, comment: '批注' },
          ],
        },
      ],
    };
    const out = sanitizeProjectData(raw);
    expect(out.pages[0].type).toBe('article');
    expect(out.pages[0].hideDisclaimer).toBe(true);
    expect(out.pages[0].showApprovedStamp).toBe(false);
    expect(out.pages[0].logoSize).toBe(42);
    expect(out.pages[0].lineHeight).toBe(1.5);
    expect(out.pages[0].paragraphs![0].emphasis).toBe(true);
    expect(out.pages[0].paragraphs![0].zh).toBe('中文');
    expect(out.pages[0].annotations![0].seq).toBe(2);
    expect(out.pages[0].annotations![0].comment).toBe('批注');
  });

  it('畸形/缺字段输入具备容错：root 不是对象时仍产出空结构', () => {
    const out = sanitizeProjectData(null);
    expect(out.pages).toEqual([]);
    expect(out.customFonts).toEqual([]);
    expect(out.settings.pageSize).toBe('A4');
    expect(out.version).toBe('1.0');
  });

  it('pages 缺数组时容错为空数组', () => {
    const out = sanitizeProjectData({ pages: 'not-array' });
    expect(out.pages).toEqual([]);
  });

  it('pages 内元素非法时回落到 cover 默认页', () => {
    const out = sanitizeProjectData({ pages: [null, 123, 'x'] });
    expect(out.pages).toHaveLength(3);
    out.pages.forEach((p, i) => {
      expect(p.type).toBe('cover');
      expect(p.layoutId).toBe('classic-cover');
      expect(p.titleEn).toBe('Untitled');
      expect(p.titleZh).toBe('无标题');
    });
  });

  it('type 非法时回落到 cover，layoutId 根据 type 回落到对应默认', () => {
    const out = sanitizeProjectData({
      pages: [
        { ...LEGAL_PAGE, type: 'bogus', layoutId: '' },
        { ...LEGAL_PAGE, id: 'p2', type: 'article', layoutId: '  ' },
      ],
    });
    expect(out.pages[0].type).toBe('cover');
    expect(out.pages[0].layoutId).toBe('classic-cover');
    expect(out.pages[1].type).toBe('article');
    expect(out.pages[1].layoutId).toBe('classic-article');
  });

  it('pageSize 白名单之外回落到 A4', () => {
    const out = sanitizeProjectData({ settings: { pageSize: 'A3' }, pages: [] });
    expect(out.settings.pageSize).toBe('A4');
  });

  it('sanitizeId 防护原型污染：__proto__/constructor/prototype 被拒绝并回退', () => {
    ['__proto__', 'constructor', 'prototype'].forEach((bad) => {
      const out = sanitizeProjectData({ pages: [LEGAL_PAGE] });
      const badPage = { ...LEGAL_PAGE, id: bad };
      const out2 = sanitizeProjectData({ pages: [badPage] });
      expect(out2.pages[0].id).not.toBe(bad);
    });
  });

  it('图片 URL 协议白名单：javascript:/data 非图片等非法协议被剥离', () => {
    const out = sanitizeProjectData({
      pages: [
        { ...LEGAL_PAGE, image: 'javascript:alert(1)', logo: 'data:text/plain;base64,xxx', footerLogo: 'https://ok.com/x.png' },
      ],
    });
    expect(out.pages[0].image).toBe('');
    expect(out.pages[0].logo).toBeUndefined();
    expect(out.pages[0].footerLogo).toBe('https://ok.com/x.png');
  });

  it('picture 风格的合法 data 图片 URL 被保留', () => {
    const out = sanitizeProjectData({
      pages: [{ ...LEGAL_PAGE, image: 'data:image/png;base64,iVBORw0KGgo=' }],
    });
    expect(out.pages[0].image).toContain('data:image/png;base64,');
  });

  it('字体清洗：非法条目被过滤，name/family 截断，family 去除非法字符', () => {
    const longStr = 'x'.repeat(200);
    const out = sanitizeProjectData({
      customFonts: [
        undefined,
        42,
        { name: 123 }, // 缺 family，被过滤
        { name: longStr, family: 'a!b@c', dataUrl: 'data:font/woff2;base64,AA==', },
        { name: 'ok', family: '文/字', dataUrl: 'not-a-data-url', },
      ],
    });
    // 只有后两个合法条目保留
    expect(out.customFonts).toHaveLength(2);
    expect(out.customFonts[0].name).toHaveLength(100);
    expect(out.customFonts[0].family).toBe('abc');
    expect(out.customFonts[0].dataUrl).toBe('data:font/woff2;base64,AA==');
    // 非 data: 前缀的 dataUrl 应为 undefined
    expect(out.customFonts[1].dataUrl).toBeUndefined();
  });
});

describe('parseProjectFile（FileReader 解析）', () => {
  it('合法 JSON 文件成功解析并清洗', async () => {
    const file = new File([JSON.stringify({ version: '1.0', settings: { pageSize: '9:15' }, pages: [LEGAL_PAGE] })], 'p.wdzmaga', { type: 'application/json' });
    const data = await parseProjectFile(file);
    expect(data.settings.pageSize).toBe('9:15');
    expect(data.pages).toHaveLength(1);
    expect(data.pages[0].id).toBe('page1');
  });

  it('空文件/非字符串内容被拒绝', async () => {
    const file = new File([''], 'empty.wdzmaga');
    await expect(parseProjectFile(file)).rejects.toThrow(/empty|unreadable/i);
  });

  it('畸形 JSON 被拒绝', async () => {
    const file = new File(['{ not valid json '], 'bad.wdzmaga');
    await expect(parseProjectFile(file)).rejects.toThrow();
  });

  it('root 非对象被拒绝', async () => {
    const file = new File(['"just a string"'], 'bad.wdzmaga');
    await expect(parseProjectFile(file)).rejects.toThrow(/object/i);
  });

  it('pages 缺失或为空数组被拒绝', async () => {
    const f1 = new File(['{}'], 'bad.wdzmaga');
    const f2 = new File(['{"pages":[]}'], 'bad.wdzmaga');
    await expect(parseProjectFile(f1)).rejects.toThrow(/pages/i);
    await expect(parseProjectFile(f2)).rejects.toThrow(/empty/i);
  });

  it('超长/非法字段在解析时被清洗而不报错', async () => {
    const long = 'y'.repeat(300);
    const file = new File(
      [JSON.stringify({ version: '1.0', settings: { pageSize: 'Unlimited' }, pages: [{ ...LEGAL_PAGE, id: 'constructor', titleEn: long, paragraphs: [{ id: '__proto__', en: long, zh: '短', emphasis: 'yes' }], annotations: [{ id: 'ann', seq: 'bad', text: long }] }] })],
      'big.wdzmaga',
    );
    const data = await parseProjectFile(file);
    const p = data.pages[0];
    expect(p.id).not.toBe('constructor'); // id 被回退
    expect(p.titleEn).toHaveLength(300); // 字符串原样保留（不截断）
    expect(p.paragraphs![0].id).not.toBe('__proto__');
    expect(p.paragraphs![0].emphasis).toBeUndefined(); // 非布尔被剥成 undefined
    expect(p.annotations![0].seq).toBe(1); // 非数值 seq 回退为 idx+1
  });
});