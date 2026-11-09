import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import { BOUNDARY_CHARS } from '../intensive/annotationHelpers';

export const ClickWordSelection = Extension.create({
  name: 'clickWordSelection',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('clickWordSelection'),
        props: {
          handleClick(view, pos) {
            const { state } = view;
            if (view.editable) return false;

            // 点击已有批注的标记时，滚动定位到批注列对应卡片（与序号跳转互为反向）
            const annMark = state.doc.resolve(pos).marks()
              .find(m => m.type.name === 'annotationMark');
            if (annMark) {
              view.dom.dispatchEvent(new CustomEvent('annotation:focus', {
                bubbles: true,
                detail: { id: annMark.attrs.id },
              }));
              return true;
            }

            const $pos = state.doc.resolve(pos);
            if (!$pos.parent.isTextblock) return false;

            const text = $pos.parent.textContent;
            const parentOffset = $pos.parentOffset;

            let start = parentOffset;
            while (start > 0 && !BOUNDARY_CHARS.has(text[start - 1])) start--;

            let end = parentOffset;
            while (end < text.length && !BOUNDARY_CHARS.has(text[end])) end++;

            const absStart = $pos.pos - parentOffset + start;
            const absEnd = $pos.pos - parentOffset + end;

            if (absStart < absEnd) {
              const tr = state.tr;
              tr.setSelection(TextSelection.create(state.doc, absStart, absEnd));
              view.dispatch(tr);
              return true;
            }
            return false;
          },
        },
      }),
    ];
  },
});
