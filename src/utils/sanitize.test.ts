import { sanitizeComment, sanitizeRichContent } from './sanitize';

// 说明：sanitize 依赖 DOMPurify，vitest 已配置 jsdom 环境（vitest.config.ts），
// 提供真实的 window/DOMPurify 支撑，因此可在此环境中直接验证各白名单口径。

describe('sanitizeComment（富文本批注消毒，最窄白名单）', () => {
  it('剥离 script 标签防 XSS', () => {
    const out = sanitizeComment("<p>你好</p><script>alert('xss')</script>");
    expect(out).not.toContain('script');
    expect(out).toContain('你好');
  });

  it('剥离 img 的 onerror 事件属性', () => {
    const out = sanitizeComment('<img src="x" onerror="alert(1)">');
    expect(out).not.toContain('onerror');
  });

  it('剥离 a 标签的 javascript: 协议', () => {
    const out = sanitizeComment('<a href="javascript:alert(1)">点我</a>');
    expect(out).not.toContain('javascript:');
    // a 不在注释白名单内，整个标签应被去除，但文字保留
    expect(out).not.toContain('<a');
    expect(out).toContain('点我');
  });

  it('保留允许的文本排版标签 p/strong/em/u', () => {
    const out = sanitizeComment('<p><strong>加粗</strong><em>斜体</em><u>下划线</u></p>');
    expect(out).toContain('<strong>加粗</strong>');
    expect(out).toContain('<em>斜体</em>');
    expect(out).toContain('<u>下划线</u>');
    expect(out).toContain('<p>');
  });

  it('剥离白名单之外的 div/h1/blockquote/a，但保留内部文字', () => {
    const out = sanitizeComment('<div><h1>标题</h1><blockquote>引用<a>链接</a></blockquote></div>');
    expect(out).not.toContain('<div');
    expect(out).not.toContain('<h1');
    expect(out).not.toContain('<blockquote');
    expect(out).not.toContain('<a');
    expect(out).toContain('标题');
    expect(out).toContain('引用');
    expect(out).toContain('链接');
  });

  // 说明：sanitizeComment 显式设置了 ALLOW_DATA_ATTR:false（本文件顶部逻辑配套），
  // 批注为纯文本排版、不携带 data-* 语义，故 data-* 与 class/id/事件属性一并剥离；
  // 仅白名单中的 style 保留。
  it('只允许 style 属性，剥离 class/id/data-* 与事件属性', () => {
    const out = sanitizeComment(
      '<p class="x" id="y" data-seq="3" onclick="alert(1)" style="color:red">正文</p>',
    );
    expect(out).toContain('style="color:red"');
    expect(out).not.toContain('data-seq="3"'); // ALLOW_DATA_ATTR:false，data-* 被剥离
    expect(out).not.toContain('class');
    expect(out).not.toContain('id=');
    expect(out).not.toContain('onclick');
  });

  it('纯文本输入原样返回', () => {
    const text = '这是一段纯文本，没有标签。';
    expect(sanitizeComment(text)).toBe(text);
  });
});

describe('sanitizeRichContent（编辑器正文消毒，宽白名单）', () => {
  it('剥离 script 标签', () => {
    const out = sanitizeRichContent('<p>正文</p><script>alert(1)</script>');
    expect(out).not.toContain('script');
    expect(out).toContain('正文');
  });

  it('剥离 style 标签（其内容不注入正文）', () => {
    const out = sanitizeRichContent('<style>body{display:none}</style><p>正文</p>');
    expect(out).not.toContain('<style');
    expect(out).not.toContain('display:none');
    expect(out).toContain('正文');
  });

  it('剥离 on* 事件属性', () => {
    const out = sanitizeRichContent('<p onclick="alert(1)" onmouseover="evil()">正文</p>');
    expect(out).not.toContain('onclick');
    expect(out).not.toContain('onmouseover');
    expect(out).toContain('正文');
  });

  it('剥离 javascript: 协议', () => {
    const out = sanitizeRichContent('<a href="javascript:alert(1)">链接</a>');
    expect(out).not.toContain('javascript:');
    expect(out).toContain('链接');
  });

  it('保留富文本排版标签 p/strong/em/u/s', () => {
    const out = sanitizeRichContent('<p><strong>粗</strong><em>斜</em><u>下</u><s>删</s></p>');
    expect(out).toContain('<strong>粗</strong>');
    expect(out).toContain('<em>斜</em>');
    expect(out).toContain('<u>下</u>');
    expect(out).toContain('<s>删</s>');
  });

  it('保留列表标签 ul/ol/li', () => {
    const out = sanitizeRichContent('<ul><li>甲</li></ul><ol><li>乙</li></ol>');
    expect(out).toContain('<ul>');
    expect(out).toContain('<ol>');
    expect(out).toContain('<li>甲</li>');
  });

  it('保留 blockquote 与 h1-h4 标题', () => {
    const out = sanitizeRichContent('<blockquote>引用</blockquote><h1>一</h1><h2>二</h2><h3>三</h3><h4>四</h4>');
    expect(out).toContain('<blockquote>');
    expect(out).toContain('<h1>一</h1>');
    expect(out).toContain('<h2>二</h2>');
    expect(out).toContain('<h3>三</h3>');
    expect(out).toContain('<h4>四</h4>');
  });

  it('保留批注 mark 及其 data-annotation-id/data-seq 与 class/style', () => {
    const out = sanitizeRichContent(
      '<mark data-annotation-id="ann-1" data-seq="3" class="hl" style="background:yellow">批注</mark>',
    );
    expect(out).toContain('<mark');
    expect(out).toContain('data-annotation-id="ann-1"');
    expect(out).toContain('data-seq="3"');
    expect(out).toContain('class');
    expect(out).toContain('style');
  });

  it('a 标签在 rich 中保留（comment 中被剥），口径差异验证', () => {
    const input = '<a href="https://example.com" target="_blank">外链</a>';
    const commentOut = sanitizeComment(input);
    const richOut = sanitizeRichContent(input);
    expect(commentOut).not.toContain('<a');
    expect(richOut).toContain('<a');
    expect(richOut).toContain('https://example.com');
  });

  it('空字符串返回空字符串', () => {
    expect(sanitizeRichContent('')).toBe('');
  });
});