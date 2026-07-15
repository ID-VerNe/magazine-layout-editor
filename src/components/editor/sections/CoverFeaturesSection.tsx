import React from 'react';
import { Quote, Box, Plus, Trash2 } from 'lucide-react';
import { PageData, CustomFont } from '../../../types';
import { Label, Input, TextArea, Slider } from '../../ui/Base';
import { FontSelect } from '../../ui/FontSelect';

interface SectionProps {
  page: PageData;
  onUpdate: (page: PageData) => void;
  customFonts: CustomFont[];
}

export const CoverFeaturesSection: React.FC<SectionProps> = ({ page, onUpdate, customFonts }) => {
  const handleChange = (field: keyof PageData, value: any) => {
    onUpdate({ ...page, [field]: value });
  };

  return (
    <section className="space-y-4">
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
           
                            <div className="pt-2 space-y-4">
           
                               <Slider 
           
                                 label="Logo Size"
           
                                 value={page.logoSize || 32}
           
                                 min={16} max={200} step={4}
           
                                 onChange={(v) => handleChange('logoSize', v)}
           
                               />
           
                               <div className="space-y-3 pt-2 border-t border-slate-50">
           
                                 <div className="flex justify-between items-center">
           
                                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logo Position</span>
           
                                   <button 
           
                                     onClick={() => onUpdate({ ...page, logoX: 0, logoY: 0 })}
           
                                     className="text-[10px] text-[#264376] font-black uppercase tracking-widest hover:brightness-125 transition-all"
           
                                   >Reset</button>
           
                                 </div>
           
                                 <Slider 
           
                                   label="X Offset" 
           
                                   value={page.logoX || 0} 
           
                                   min={-100} max={300} step={1} 
           
                                   onChange={(v) => handleChange('logoX', v)} 
           
                                 />
           
                                 <Slider 
           
                                   label="Y Offset" 
           
                                   value={page.logoY || 0} 
           
                                   min={-100} max={300} step={1} 
           
                                   onChange={(v) => handleChange('logoY', v)} 
           
                                 />
           
                               </div>
           
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
                  <div className="w-32"><FontSelect customFonts={customFonts} value={page.quoteEnFont} onChange={(v) => handleChange('quoteEnFont', v)} /></div>
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
                  <div className="w-32"><FontSelect customFonts={customFonts} value={page.quoteZhFont} onChange={(v) => handleChange('quoteZhFont', v)} /></div>
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
    </section>
  );
};
