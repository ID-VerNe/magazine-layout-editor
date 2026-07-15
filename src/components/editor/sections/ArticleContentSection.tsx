import React from 'react';
import { MessageSquare, Zap, Trash2, Plus, Info } from 'lucide-react';
import { PageData, CustomFont, Paragraph } from '../../../types';
import { Label, TextArea } from '../../ui/Base';
import { FontSelect } from '../../ui/FontSelect';

interface SectionProps {
  page: PageData;
  onUpdate: (page: PageData) => void;
  customFonts: CustomFont[];
}

export const ArticleContentSection: React.FC<SectionProps> = ({ page, onUpdate, customFonts }) => {
  const handleChange = (field: keyof PageData, value: any) => {
    onUpdate({ ...page, [field]: value });
  };

  const handleParagraphChange = (id: string, field: keyof Paragraph, value: any) => {
    if (!page.paragraphs) return;
    const updated = page.paragraphs.map(p => p.id === id ? { ...p, [field]: value } : p);
    handleChange('paragraphs', updated);
  };

  const toggleEmphasis = (id: string) => {
    if (!page.paragraphs) return;
    const p = page.paragraphs.find(p => p.id === id);
    if (p) {
      handleParagraphChange(id, 'emphasis', !p.emphasis);
    }
  };

  const addParagraph = () => {
    const newP: Paragraph = { id: `p-${Date.now()}`, en: '', zh: '' };
    const currentP = page.paragraphs || [];
    handleChange('paragraphs', [...currentP, newP]);
  };

  const removeParagraph = (id: string) => {
    const updated = page.paragraphs?.filter(p => p.id !== id);
    handleChange('paragraphs', updated);
  };

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <Label icon={MessageSquare} className="mb-0">Content</Label>
        <div className="flex gap-2 w-1/2">
           <FontSelect customFonts={customFonts} value={page.paragraphEnFont} onChange={(v) => handleChange('paragraphEnFont', v)} label="EN" />
           <FontSelect customFonts={customFonts} value={page.paragraphZhFont} onChange={(v) => handleChange('paragraphZhFont', v)} label="ZH" />
        </div>
      </div>
      
      <div className="space-y-6">
        {page.paragraphs?.map((p, idx) => (
          <div key={p.id} className={`relative group p-4 rounded-xl transition-all ${p.emphasis ? 'bg-[#264376]/5 ring-1 ring-[#264376]/20' : 'bg-slate-50/50 hover:bg-slate-50'}`}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded shadow-sm font-bold border transition-colors ${p.emphasis ? 'bg-[#264376] text-white border-[#264376]' : 'bg-white text-slate-400 border-slate-100'}`}>P{idx + 1}</span>
                <button 
                  onClick={() => toggleEmphasis(p.id)}
                  className="p-1 rounded transition-colors"
                  style={{ 
                    color: p.emphasis ? (page.accentColor || '#264376') : '#cbd5e1',
                    backgroundColor: p.emphasis ? `${page.accentColor || '#264376'}1A` : 'transparent'
                  }}
                  title="Toggle Emphasis"
                >
                  <Zap size={14} fill={p.emphasis ? "currentColor" : "none"} />
                </button>
              </div>
              <button 
                onClick={() => removeParagraph(p.id)} 
                className="text-slate-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="space-y-3">
              <TextArea
                placeholder={page.layoutId === 'modern-vertical' ? "Paragraph text..." : "English paragraph..."}
                rows={4}
                className="bg-white focus:bg-white"
                style={{ 
                  fontFamily: page.paragraphEnFont,
                  borderColor: p.emphasis ? page.accentColor : 'transparent'
                }}
                value={p.en}
                onChange={(e) => handleParagraphChange(p.id, 'en', e.target.value)}
              />
              {page.layoutId !== 'modern-vertical' && (
                <TextArea
                  placeholder="中文段落..."
                  rows={4}
                  className="bg-white focus:bg-white"
                  style={{ fontFamily: page.paragraphZhFont }}
                  value={p.zh}
                  onChange={(e) => handleParagraphChange(p.id, 'zh', e.target.value)}
                />
              )}
            </div>
          </div>
        ))}

        <button 
          onClick={addParagraph} 
          className="w-full py-3 border border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-[#264376] hover:text-[#264376] hover:bg-[#264376]/5 transition-all flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest"
        >
          <Plus size={16} />
          Add Paragraph
        </button>
      </div>

      <div className="mt-8 space-y-3 pt-6 border-t border-slate-100">
        <div className="flex justify-between items-end">
          <Label icon={Info}>Footnote</Label>
          <div className="w-32"><FontSelect customFonts={customFonts} value={page.footnoteFont} onChange={(v) => handleChange('footnoteFont', v)} /></div>
        </div>
        <TextArea
          className="h-20 text-xs"
          placeholder="Add specific footnotes for this article..."
          value={page.footnote || ''}
          onChange={(e) => handleChange('footnote', e.target.value)}
        />
      </div>
    </section>
  );
};
