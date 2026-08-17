import React from 'react';
import { Quote, Box, Plus, Trash2 } from 'lucide-react';
import { PageData, CustomFont } from '../../../types';
import { Label, Input, Slider } from '../../ui/Base';
import { FormFieldWithFont } from '../../ui/FormFieldWithFont';
import { readImageFileAsDataUrl } from '../../../utils/imageUtils';

interface SectionProps {
  page: PageData;
  onUpdate: (page: PageData) => void;
  customFonts: CustomFont[];
}

export const CoverFeaturesSection: React.FC<SectionProps> = ({ page, onUpdate, customFonts }) => {
  const handleChange = <K extends keyof PageData>(field: K, value: PageData[K]) => {
    onUpdate({ ...page, [field]: value });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const dataUrl = await readImageFileAsDataUrl(file);
        handleChange('logo', dataUrl);
      } catch (err) {
        console.error('Logo upload error', err);
      }
    }
  };

  const showQuotes = page.layoutId !== 'impact-bold';

  return (
    <section className="space-y-4">
      <Label icon={Quote}>Cover Features</Label>
      <div className="space-y-8">
        {/* Logo Section */}
        <div className="space-y-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Box size={12} aria-hidden="true" /> Custom Logo
          </span>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Logo URL..."
              value={page.logo || ''}
              onChange={(e) => handleChange('logo', e.target.value)}
              aria-label="Logo URL"
            />
            <label
              className="cursor-pointer bg-slate-50 p-2 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all flex items-center justify-center min-w-[40px] focus-within:ring-2 focus-within:ring-[#264376]"
              aria-label="Upload logo"
              title="Upload logo"
            >
              {page.logo ? (
                <div className="w-5 h-5 overflow-hidden">
                  <img src={page.logo} className="w-full h-full object-contain" alt="Logo preview" />
                </div>
              ) : (
                <Plus size={16} className="text-slate-400" aria-hidden="true" />
              )}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleLogoUpload}
              />
            </label>
            {page.logo && (
              <button
                type="button"
                onClick={() => handleChange('logo', '')}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                aria-label="Remove logo"
                title="Remove logo"
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            )}
          </div>

          {page.logo && !page.featuredText && (
            <div className="pt-2 space-y-4">
              <Slider
                label="Logo Size"
                value={page.logoSize || 32}
                min={16}
                max={200}
                step={4}
                onChange={(v) => handleChange('logoSize', v)}
              />

              <div className="space-y-3 pt-2 border-t border-slate-50">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Logo Position
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdate({ ...page, logoX: 0, logoY: 0 })}
                    className="text-[10px] text-[#264376] font-black uppercase tracking-widest hover:brightness-125 transition-all"
                  >
                    Reset
                  </button>
                </div>

                <Slider
                  label="X Offset"
                  value={page.logoX || 0}
                  min={-100}
                  max={300}
                  step={1}
                  onChange={(v) => handleChange('logoX', v)}
                />

                <Slider
                  label="Y Offset"
                  value={page.logoY || 0}
                  min={-100}
                  max={300}
                  step={1}
                  onChange={(v) => handleChange('logoY', v)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Badge Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Badge</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-slate-500 uppercase font-bold">Color</span>
                <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-md border border-slate-200">
                  <input
                    type="color"
                    aria-label="Badge color picker"
                    className="w-4 h-4 rounded-sm border-none cursor-pointer p-0 bg-transparent"
                    value={page.badgeColor || (page.featuredText ? '#ccff33' : '#ffffff')}
                    onChange={(e) => handleChange('badgeColor', e.target.value)}
                  />
                  <input
                    type="text"
                    aria-label="Badge color hex"
                    className="w-16 text-[9px] font-mono uppercase bg-transparent border-none text-slate-700 focus:outline-none"
                    value={page.badgeColor || (page.featuredText ? '#ccff33' : '#ffffff')}
                    onChange={(e) => handleChange('badgeColor', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Text</span>
              <Input
                type="text"
                value={page.featuredText || ''}
                onChange={(e) => handleChange('featuredText', e.target.value)}
                placeholder="@Tag"
                aria-label="Badge text"
              />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Radius</span>
              <input
                type="number"
                aria-label="Badge border radius"
                className="w-full bg-slate-50 border-transparent rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#264376]"
                value={page.badgeRadius ?? 15}
                onChange={(e) => handleChange('badgeRadius', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        {/* Quotes Section */}
        {showQuotes && (
          <div className="space-y-4">
            <FormFieldWithFont
              label="Quote (EN)"
              value={page.quoteEn || ''}
              onChange={(v) => handleChange('quoteEn', v)}
              fontFamily={page.quoteEnFont}
              onFontChange={(v) => handleChange('quoteEnFont', v)}
              customFonts={customFonts}
              multiline
              rows={2}
              italic
            />
            <FormFieldWithFont
              label="Quote (ZH)"
              value={page.quoteZh || ''}
              onChange={(v) => handleChange('quoteZh', v)}
              fontFamily={page.quoteZhFont}
              onFontChange={(v) => handleChange('quoteZhFont', v)}
              customFonts={customFonts}
              multiline
              rows={2}
            />
          </div>
        )}
      </div>
    </section>
  );
};
