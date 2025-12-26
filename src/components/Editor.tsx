import React from 'react';
import { PageData, Paragraph, CustomFont, ImageConfig } from '../types';
import { Plus, Trash2, Image as ImageIcon, Type, Quote, MessageSquare, X, ChevronDown, Move, Maximize2, RotateCcw, Box, AlignJustify, Info, AlertTriangle, Settings, Check, Layout } from 'lucide-react';

interface EditorProps {
  page: PageData;
  onUpdate: (page: PageData) => void;
  customFonts: CustomFont[];
  isOverflowing?: boolean;
  enforceA4?: boolean;
}

// --- UI Components ---

const Label = ({ children, icon: Icon, className = "" }: { children: React.ReactNode, icon?: any, className?: string }) => (
  <label className={`block text-xs font-black text-slate-900 uppercase tracking-widest mb-2 flex items-center gap-3 ${className}`}>
    {Icon && <Icon size={12} />}
    {children}
  </label>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`w-full bg-slate-50 border-transparent focus:border-[#264376] focus:bg-white focus:ring-2 focus:ring-[#264376]/20 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 transition-all placeholder-slate-400 ${props.className || ''}`}
  />
);

const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={`w-full bg-slate-50 border-transparent focus:border-[#264376] focus:bg-white focus:ring-2 focus:ring-[#264376]/20 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 transition-all placeholder-slate-400 ${props.className || ''}`}
  />
);

const Slider = ({ label, value, min, max, step, onChange, unit = "" }: { label: string, value: number, min: number, max: number, step: number, onChange: (val: number) => void, unit?: string }) => (
  <div className="grid grid-cols-[110px_1fr_44px] items-center gap-2 group min-h-[24px]">
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900 transition-colors truncate" title={label}>{label}</span>
    <div className="flex items-center h-full">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#264376] hover:brightness-110 transition-all"
      />
    </div>
    <div className="relative flex items-center h-full">
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full bg-transparent border border-transparent hover:bg-slate-50 hover:border-slate-200 focus:bg-white focus:border-[#264376] focus:ring-1 focus:ring-[#264376]/10 rounded px-1 py-0.5 text-[10px] font-bold font-mono text-slate-900 text-right focus:outline-none transition-all appearance-none" 
      />
    </div>
  </div>
);

const Section = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <section className={`space-y-4 ${className}`}>
    {children}
  </section>
);

// --- Editor Component ---

const Editor: React.FC<EditorProps> = ({ page, onUpdate, customFonts, isOverflowing, enforceA4 }) => {
  const handleChange = (field: keyof PageData, value: any) => {
    onUpdate({ ...page, [field]: value });
  };

  const handleImageConfigChange = (field: keyof ImageConfig, value: number) => {
    const currentConfig = page.imageConfig || { scale: 1, x: 0, y: 0, height: page.type === 'cover' ? 500 : 300 };
    
    // --- A4 Growth Lock ---
    if (enforceA4 && isOverflowing) {
       // If overflowing, only allow DECREASING values for parameters that affect height
       if (field === 'height' && value > currentConfig.height) return;
       if (field === 'scale' && value > currentConfig.scale) return;
    }
    
    handleChange('imageConfig', { ...currentConfig, [field]: value });
  };

  const handleSpacingChange = (field: 'lineHeight' | 'paragraphSpacing', value: number) => {
    // --- A4 Growth Lock ---
    if (enforceA4 && isOverflowing) {
      const currentValue = page[field] ?? (field === 'lineHeight' ? 1.6 : 32);
      // If overflowing, block any increase in spacing
      if (value > currentValue) return;
    }
    handleChange(field, value);
  };

  const resetImageConfig = () => {
    handleChange('imageConfig', {
      scale: 1,
      x: 0,
      y: 0,
      height: page.type === 'cover' ? 500 : 300
    });
  };

  const handleParagraphChange = (id: string, field: keyof Paragraph, value: string) => {
    if (!page.paragraphs) return;
    const updated = page.paragraphs.map(p => p.id === id ? { ...p, [field]: value } : p);
    handleChange('paragraphs', updated);
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

  const FontSelect = ({ value, onChange, label }: { value?: string, onChange: (v: string) => void, label?: string }) => (
    <div className="flex flex-col gap-1 w-full">
      {label && <span className="text-[10px] uppercase font-bold text-slate-400">{label}</span>}
      <div className="relative group">
        <select 
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-white text-xs font-medium text-slate-700 py-1.5 pl-2 pr-6 rounded hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#264376]/20 cursor-pointer border border-transparent hover:border-slate-200"
        >
          <option value="">Default Font</option>
          <optgroup label="Custom Fonts">
            {customFonts.map(f => (
              <option key={f.family} value={f.family}>{f.name}</option>
            ))}
          </optgroup>
          <optgroup label="System">
             <option value="'Inter', sans-serif">Inter</option>
             <option value="'Crimson Pro', serif">Crimson Pro</option>
             <option value="'Noto Serif SC', serif">Noto Serif SC</option>
          </optgroup>
        </select>
        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );

  const imgConfig = page.imageConfig || { scale: 1, x: 0, y: 0, height: page.type === 'cover' ? 500 : 300 };

  return (
    <div className="space-y-10 pb-20">
      {enforceA4 && isOverflowing && (
        <div className="bg-red-50 rounded-xl p-4 flex items-start gap-3 animate-pulse">
          <AlertTriangle className="text-red-500 shrink-0" size={20} />
          <div>
            <h4 className="text-red-800 text-xs font-bold uppercase tracking-wider">Content Overflow</h4>
            <p className="text-red-600 text-[10px] mt-1 leading-relaxed">Content exceeds A4 page limits. Growth parameters are locked. Please reduce font size or content.</p>
          </div>
        </div>
      )}

      <Section>
        <Label icon={Layout}>Page Layout</Label>
        <div className="relative group">
          <select 
            value={page.layoutId || (page.type === 'cover' ? 'classic-cover' : 'classic-article')} 
            onChange={(e) => handleChange('layoutId', e.target.value)}
            className="w-full appearance-none bg-slate-50 text-xs font-black uppercase tracking-widest text-slate-900 py-2.5 pl-3 pr-8 rounded-lg hover:bg-slate-100 transition-all focus:outline-none focus:ring-2 focus:ring-[#264376]/20 cursor-pointer"
          >
            {page.type === 'cover' ? (
              <optgroup label="Cover Layouts">
                <option value="classic-cover">Classic Editorial</option>
                <option value="impact-bold">Impact Bold</option>
                <option value="cinematic">Cinematic 16:9</option>
                <option value="blueprint">Engineering Blueprint</option>
                <option value="tabloid">Tabloid News</option>
                <option value="typography">Typographic Poster</option>
              </optgroup>
            ) : (
              <optgroup label="Article Layouts">
                <option value="classic-article">Modern Split</option>
                <option value="blueprint-article">Engineering Blueprint</option>
              </optgroup>
            )}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </Section>

      {/* Main Image Section */}
      <Section>
        <div className="flex justify-between items-center mb-2">
          <Label icon={ImageIcon}>Main Image</Label>
          {page.image && (
            <button onClick={() => handleChange('image', '')} className="text-[10px] text-red-500 hover:text-red-600 font-bold uppercase flex items-center gap-1 transition-colors">
              <X size={10} /> Remove
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2 mb-6">
          <Input
            type="text"
            placeholder="Image URL..."
            value={page.image}
            onChange={(e) => handleChange('image', e.target.value)}
          />
          <label className="cursor-pointer bg-slate-50 p-2.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ImageIcon size={18} />
            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => handleChange('image', reader.result as string);
                reader.readAsDataURL(file);
              }
            }} />
          </label>
        </div>

        {page.image && (
          <div className="space-y-5 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-center">
               <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  Adjust Framing
               </h4>
               <button onClick={resetImageConfig} className="text-[10px] text-[#264376] hover:brightness-125 font-black uppercase tracking-widest cursor-pointer transition-all">
                  Reset
               </button>
            </div>
            
            <div className="space-y-4 px-1">
              <Slider 
                label="Zoom" 
                value={parseFloat(imgConfig.scale.toFixed(1))} 
                min={1} max={5} step={0.1} 
                onChange={(v) => handleImageConfigChange('scale', v)} 
                unit="x"
              />
              <Slider 
                label="X Offset" 
                value={imgConfig.x} 
                min={-100} max={100} step={1} 
                onChange={(v) => handleImageConfigChange('x', v)} 
                unit="%"
              />
              <Slider 
                label="Y Offset" 
                value={imgConfig.y} 
                min={-100} max={100} step={1} 
                onChange={(v) => handleImageConfigChange('y', v)} 
                unit="%"
              />
              <Slider 
                label="Height" 
                value={imgConfig.height} 
                min={100} max={800} step={10} 
                onChange={(v) => handleImageConfigChange('height', v)} 
                unit="px"
              />
            </div>
          </div>
        )}
      </Section>

      {/* Spacing Settings */}
      <Section className="pt-6 border-t border-slate-100">
        <Label icon={AlignJustify}>Typography Spacing</Label>
        <div className="space-y-4 px-1">
           <Slider 
             label="Line Height" 
             value={parseFloat((page.lineHeight || 1.6).toFixed(1))} 
             min={1.0} max={2.5} step={0.1} 
             onChange={(v) => handleSpacingChange('lineHeight', v)} 
             unit="x"
           />
           <Slider 
             label="Paragraph" 
             value={page.paragraphSpacing ?? 32} 
             min={0} max={100} step={4} 
             onChange={(v) => handleSpacingChange('paragraphSpacing', v)} 
             unit="px"
           />
        </div>
      </Section>

      {/* Headlines Section */}
      <Section className="pt-6 border-t border-slate-100">
        <Label icon={Type}>Headlines & Bylines</Label>
        <div className="space-y-6">
          <div className="space-y-2">
             <div className="flex justify-between items-end gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">English Headline</span>
                <div className="w-32"><FontSelect value={page.titleEnFont} onChange={(v) => handleChange('titleEnFont', v)} /></div>
             </div>
             <TextArea
                rows={2}
                style={{ fontFamily: page.titleEnFont }}
                value={page.titleEn}
                onChange={(e) => handleChange('titleEn', e.target.value)}
              />
          </div>
          <div className="space-y-2">
             <div className="flex justify-between items-end gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Chinese Headline</span>
                <div className="w-32"><FontSelect value={page.titleZhFont} onChange={(v) => handleChange('titleZhFont', v)} /></div>
             </div>
             <TextArea
                rows={2}
                style={{ fontFamily: page.titleZhFont }}
                value={page.titleZh}
                onChange={(e) => handleChange('titleZh', e.target.value)}
              />
          </div>
          <div className="space-y-2">
             <div className="flex justify-between items-end gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Byline</span>
                <div className="w-32"><FontSelect value={page.bylineFont} onChange={(v) => handleChange('bylineFont', v)} /></div>
             </div>
             <Input
                type="text"
                style={{ fontFamily: page.bylineFont }}
                value={page.byline}
                onChange={(e) => handleChange('byline', e.target.value)}
              />
          </div>
        </div>
      </Section>

      {page.type === 'cover' ? (
        <Section className="pt-6 border-t border-slate-100">
          <Label icon={Quote}>Cover Features</Label>
          <div className="space-y-8">
             {/* Logo Section */}
             <div className="space-y-3">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                 <Box size={12} /> Custom Logo
               </span>
               <div className="flex gap-2">
                 <Input
                   type="text"
                   placeholder="Logo URL..."
                   value={page.logo || ''}
                   onChange={(e) => handleChange('logo', e.target.value)}
                 />
                 <label className="cursor-pointer bg-slate-50 p-2 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all flex items-center justify-center min-w-[40px]">
                   {page.logo ? 
                    <div className="w-5 h-5 overflow-hidden"><img src={page.logo} className="w-full h-full object-contain" /></div> : 
                    <Plus size={16} className="text-slate-400" />
                   }
                   <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                     const file = e.target.files?.[0];
                     if (file) {
                       const reader = new FileReader();
                       reader.onloadend = () => handleChange('logo', reader.result as string);
                       reader.readAsDataURL(file);
                     }
                   }} />
                 </label>
                 {page.logo && (
                   <button onClick={() => handleChange('logo', '')} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                     <Trash2 size={16} />
                   </button>
                 )}
               </div>
               
               {page.logo && !page.featuredText && (
                 <div className="pt-2">
                    <Slider 
                      label="Logo Size"
                      value={page.logoSize || 32}
                      min={16} max={200} step={4}
                      onChange={(v) => handleChange('logoSize', v)}
                      unit="px"
                    />
                 </div>
               )}
             </div>

             {/* Badge Section */}
             <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Badge</span>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] text-slate-400 uppercase font-bold">Color</span>
                            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-md">
                                <input 
                                    type="color" 
                                    className="w-4 h-4 rounded-sm border-none cursor-pointer p-0 bg-transparent"
                                    value={page.badgeColor || (page.featuredText ? '#ccff33' : '#ffffff')}
                                    onChange={(e) => handleChange('badgeColor', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Text</span>
                        <Input
                            type="text"
                            value={page.featuredText || ''}
                            onChange={(e) => handleChange('featuredText', e.target.value)}
                            placeholder="@Tag"
                        />
                    </div>
                    <div className="space-y-2">
                         <span className="text-[10px] text-slate-400 font-bold uppercase">Radius</span>
                         <input 
                            type="number"
                            className="w-full bg-slate-50 border-transparent rounded-lg px-3 py-2 text-sm text-slate-700"
                            value={page.badgeRadius ?? 15}
                            onChange={(e) => handleChange('badgeRadius', parseInt(e.target.value))}
                         />
                    </div>
                </div>
             </div>

             {/* Quotes */}
             <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between items-end gap-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Quote (EN)</span>
                      <div className="w-32"><FontSelect value={page.quoteEnFont} onChange={(v) => handleChange('quoteEnFont', v)} /></div>
                    </div>
                    <TextArea
                      rows={2}
                      className="italic"
                      style={{ fontFamily: page.quoteEnFont }}
                      value={page.quoteEn}
                      onChange={(e) => handleChange('quoteEn', e.target.value)}
                    />
                 </div>
                 <div className="space-y-2">
                    <div className="flex justify-between items-end gap-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Quote (ZH)</span>
                      <div className="w-32"><FontSelect value={page.quoteZhFont} onChange={(v) => handleChange('quoteZhFont', v)} /></div>
                    </div>
                    <TextArea
                      rows={2}
                      style={{ fontFamily: page.quoteZhFont }}
                      value={page.quoteZh}
                      onChange={(e) => handleChange('quoteZh', e.target.value)}
                    />
                 </div>
             </div>
          </div>
        </Section>
      ) : (
        <Section className="pt-6 border-t border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <Label icon={MessageSquare} className="mb-0">Content</Label>
            <div className="flex gap-2 w-1/2">
               <FontSelect value={page.paragraphEnFont} onChange={(v) => handleChange('paragraphEnFont', v)} label="EN" />
               <FontSelect value={page.paragraphZhFont} onChange={(v) => handleChange('paragraphZhFont', v)} label="ZH" />
            </div>
          </div>
          
          <div className="space-y-6">
            {page.paragraphs?.map((p, idx) => (
              <div key={p.id} className="relative group p-4 bg-slate-50/50 hover:bg-slate-50 rounded-xl transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] bg-white px-2 py-0.5 rounded shadow-sm text-slate-400 font-bold border border-slate-100">P{idx + 1}</span>
                  <button onClick={() => removeParagraph(p.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="space-y-3">
                  <TextArea
                    placeholder="English paragraph..."
                    rows={4}
                    className="bg-white focus:bg-white"
                    style={{ fontFamily: page.paragraphEnFont }}
                    value={p.en}
                    onChange={(e) => handleParagraphChange(p.id, 'en', e.target.value)}
                  />
                  <TextArea
                    placeholder="中文段落..."
                    rows={4}
                    className="bg-white focus:bg-white"
                    style={{ fontFamily: page.paragraphZhFont }}
                    value={p.zh}
                    onChange={(e) => handleParagraphChange(p.id, 'zh', e.target.value)}
                  />
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
              <div className="w-32"><FontSelect value={page.footnoteFont} onChange={(v) => handleChange('footnoteFont', v)} /></div>
            </div>
            <TextArea
              className="h-20 text-xs"
              placeholder="Add specific footnotes for this article..."
              value={page.footnote || ''}
              onChange={(e) => handleChange('footnote', e.target.value)}
            />
          </div>
        </Section>
      )}

      <Section className="pt-6 border-t border-slate-100">
        <Label icon={Settings}>Page Background</Label>
        <div className="flex gap-3 items-center">
            <div className="relative overflow-hidden w-10 h-10 rounded-lg shadow-sm ring-1 ring-slate-200">
                <input 
                type="color" 
                className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0"
                value={page.backgroundColor || '#FAF9F4'}
                onChange={(e) => handleChange('backgroundColor', e.target.value)}
                />
            </div>
            <Input 
                type="text" 
                className="font-mono uppercase"
                value={page.backgroundColor || '#FAF9F4'}
                onChange={(e) => handleChange('backgroundColor', e.target.value)}
            />
        </div>
      </Section>

      <Section className="pt-6 border-t border-slate-100">
        <div className="flex justify-between items-end mb-4">
          <Label className="mb-0">Footer</Label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <span className="text-[9px] text-slate-400 font-bold uppercase group-hover:text-slate-600 transition-colors">Hide Disclaimer</span>
              <div 
                className={`w-8 h-4 rounded-full relative transition-colors ${page.hideDisclaimer ? 'bg-blue-500' : 'bg-slate-200'}`}
                onClick={() => handleChange('hideDisclaimer', !page.hideDisclaimer)}
              >
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${page.hideDisclaimer ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </label>
            <div className="w-24"><FontSelect value={page.footerFont} onChange={(v) => handleChange('footerFont', v)} /></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
           <Input
             type="text"
             className="text-xs"
             style={{ fontFamily: page.footerFont }}
             value={page.footerLeft}
             onChange={(e) => handleChange('footerLeft', e.target.value)}
           />
           <Input
             type="text"
             className="text-xs text-right"
             style={{ fontFamily: page.footerFont }}
             value={page.footerRight}
             onChange={(e) => handleChange('footerRight', e.target.value)}
           />
        </div>
      </Section>
    </div>
  );
};

export default Editor;