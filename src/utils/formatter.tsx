import React from 'react';

/**
 * LaTeX-Lite 格式化器
 * 支持: \b{粗体}, \i{斜体}, \u{下划线}, \s{删除线}
 */
export function formatMagazineText(text: string | undefined | null) {
  if (!text) return "";

  // 使用 RegExp 构造函数以避免工具链对正则表达式字面量的干扰
  // 匹配 \b{...} 等标签 或 换行符
  const regex = new RegExp('(\\\\[bius]\\{[^}]*\\}|\\n)', 'g');
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (!part) return null;

    if (part === '\n') {
      return <br key={i} />;
    }

    // 检查是否符合 \标记{内容} 格式
    if (part.startsWith('\\') && part.includes('{') && part.endsWith('}')) {
      const tag = part.charAt(1); // b, i, u, or s
      const openBraceIdx = part.indexOf('{');
      const content = part.slice(openBraceIdx + 1, -1);
      
      const style: React.CSSProperties = { 
        fontFamily: 'inherit',
        display: 'inline'
      };

      switch (tag) {
        case 'b': return <strong key={i} className="font-bold" style={style}>{content}</strong>;
        case 'i': return <em key={i} className="italic" style={style}>{content}</em>;
        case 'u': return <u key={i} className="underline decoration-current underline-offset-2" style={style}>{content}</u>;
        case 's': return <del key={i} className="line-through opacity-70" style={style}>{content}</del>;
      }
    }

    return part;
  });
}
