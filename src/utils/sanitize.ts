import DOMPurify from 'dompurify';

/**
 * 统一的内容消毒入口。编辑器输入端（CommentEditor）与模板渲染端（dangerouslySetInnerHTML）
 * 共用同一套白名单，避免口径不一致导致“写入时已过滤、渲染时又放行”的缝隙。

 * 使用说明：
 * - 富文本批注（annotation.comment）：sanitizeComment
 * - 编辑器正文（leftContent，含批注 mark）：sanitizeRichContent
 * - 说明：DOMPurify 会剥离 <script>/<style>/事件属性 和 on* 代码，配合白名单做纵深防御。
 */

// 富文本批注允许的标签/属性白名单 —— 最窄，仅文本排版样式
const COMMENT_ALLOWED_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span'];
const COMMENT_ALLOWED_ATTR = ['style'];

// Tiptap 生成的正文允许的标签 —— 额外放行段落、行内标注 mark 及其 data-* 语义信息
const RICH_ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'span', 'mark', 'blockquote',
  'ul', 'ol', 'li', 'a', 'code', 'pre', 'h1', 'h2', 'h3', 'h4',
];
const RICH_ALLOWED_ATTR = ['style', 'class', 'href', 'target', 'rel', 'data-annotation-id', 'data-seq'];

/**
 * 富文本批注消毒（最窄白名单）。
 * 用于 CommentEditor 输入与模板渲染批注列。
 * ALLOW_DATA_ATTR: false —— 批注是纯文本排版，不携带 data-* 语义信息，
 * 显式关闭 DOMPurify 默认保留的 data-* 通道，收窄纵深攻击面
 *（正文消毒 sanitizeRichContent 需保留 data-annotation-id/data-seq，故不关闭）。
 */
export const sanitizeComment = (html: string) =>
  DOMPurify.sanitize(html, {
    ALLOWED_TAGS: COMMENT_ALLOWED_TAGS,
    ALLOWED_ATTR: COMMENT_ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });

/**
 * 编辑器正文消毒（含批注 mark 的宽白名单）。
 * 用于模板端 dangerouslySetInnerHTML 渲染 leftContent。
 */
export const sanitizeRichContent = (html: string) =>
  DOMPurify.sanitize(html, { ALLOWED_TAGS: RICH_ALLOWED_TAGS, ALLOWED_ATTR: RICH_ALLOWED_ATTR });