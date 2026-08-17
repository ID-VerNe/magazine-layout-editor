import React from 'react';
import { Image as ImageIcon, Move } from 'lucide-react';
import { PageData, CustomFont } from '../../../types';
import { Label, Input, Slider } from '../../ui/Base';
import { FontSelect } from '../../ui/FontSelect';
import { readImageFileAsDataUrl } from '../../../utils/imageUtils';

interface SectionProps {
  page: PageData;
  onUpdate: (page: PageData) => void;
  customFonts: CustomFont[];
}

export const FooterSection: React.FC<SectionProps> = ({ page, onUpdate, customFonts }) => {
  const handleChange = <K extends keyof PageData>(field: K, value: PageData[K]) => {
    onUpdate({ ...page, [field]: value });
  };

  const handleFooterLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const dataUrl = await readImageFileAsDataUrl(file);
        handleChange('footerLogo', dataUrl);
      } catch (err) {
        console.error('Footer logo upload error', err);
      }
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-end mb-4">
        <Label className="mb-0">Footer Layout</Label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer group">
            <span className="text-[9px] text-slate-500 font-bold uppercase group-hover:text-slate-700 transition-colors">
              Swap Position
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={!!page.footerSwap}
              aria-label="Swap footer left and right positions"
              className={`w-8 h-4 rounded-full relative transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#264376] focus-visible:ring-offset-1 ${
                page.footerSwap ? 'bg-[#264376]' : 'bg-slate-200'
              }`}
              onClick={() => handleChange('footerSwap', !page.footerSwap)}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  handleChange('footerSwap', !page.footerSwap);
                }
              }}
            >
              <span
                className={`block absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${
                  page.footerSwap ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>
          <div className="w-24">
            <FontSelect
              customFonts={customFonts}
              value={page.footerFont}
              onChange={(v) => handleChange('footerFont', v)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <span className="text-[9px] text-slate-500 font-bold uppercase">Left Text</span>
          <Input
            type="text"
            className="text-xs"
            value={page.footerLeft}
            onChange={(e) => handleChange('footerLeft', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <span className="text-[9px] text-slate-500 font-bold uppercase">Right Content</span>
          <div className="flex bg-slate-100 p-0.5 rounded-md mb-1">
            <button
              type="button"
              onClick={() => handleChange('footerRightType', 'text')}
              className={`flex-1 text-[8px] py-1 rounded ${
                page.footerRightType !== 'logo' ? 'bg-white shadow-sm font-bold text-slate-800' : 'text-slate-500'
              }`}
            >
              TEXT
            </button>
            <button
              type="button"
              onClick={() => handleChange('footerRightType', 'logo')}
              className={`flex-1 text-[8px] py-1 rounded ${
                page.footerRightType === 'logo' ? 'bg-white shadow-sm font-bold text-slate-800' : 'text-slate-500'
              }`}
            >
              LOGO
            </button>
          </div>
          {page.footerRightType === 'logo' ? (
            <div className="flex gap-1">
              <Input
                type="text"
                placeholder="Logo URL..."
                value={page.footerLogo || ''}
                onChange={(e) => handleChange('footerLogo', e.target.value)}
                className="text-[10px] py-1 px-2"
              />
              <label
                className="cursor-pointer bg-slate-50 p-1.5 rounded hover:bg-slate-100 text-slate-500 flex items-center"
                aria-label="Upload footer logo"
              >
                <ImageIcon size={12} aria-hidden="true" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFooterLogoUpload}
                />
              </label>
            </div>
          ) : (
            <Input
              type="text"
              className="text-xs"
              value={page.footerRight}
              onChange={(e) => handleChange('footerRight', e.target.value)}
            />
          )}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-50">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Move size={12} className="text-[#264376]" aria-hidden="true" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Content Fine-tuning
            </span>
          </div>
          <button
            type="button"
            onClick={() => onUpdate({ ...page, footerRightX: 0, footerRightY: 0 })}
            className="text-[10px] text-[#264376] font-black uppercase tracking-widest hover:brightness-125 transition-all"
          >
            Reset
          </button>
        </div>
        <Slider
          label="X Offset"
          value={page.footerRightX || 0}
          min={-100}
          max={100}
          step={1}
          onChange={(v) => handleChange('footerRightX', v)}
        />
        <Slider
          label="Y Offset"
          value={page.footerRightY || 0}
          min={-50}
          max={50}
          step={1}
          onChange={(v) => handleChange('footerRightY', v)}
        />
        {page.footerRightType === 'logo' && (
          <Slider
            label="Logo Size"
            value={page.footerLogoSize || 24}
            min={10}
            max={600}
            step={1}
            onChange={(v) => handleChange('footerLogoSize', v)}
          />
        )}
      </div>

      <div className="pt-4 border-t border-slate-100">
        <label className="flex items-center gap-2 cursor-pointer group">
          <span className="text-[9px] text-slate-500 font-bold uppercase group-hover:text-slate-700 transition-colors">
            Hide Disclaimer
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={!!page.hideDisclaimer}
            aria-label="Hide footer disclaimer text"
            className={`w-8 h-4 rounded-full relative transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#264376] focus-visible:ring-offset-1 ${
              page.hideDisclaimer ? 'bg-[#264376]' : 'bg-slate-200'
            }`}
            onClick={() => handleChange('hideDisclaimer', !page.hideDisclaimer)}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                handleChange('hideDisclaimer', !page.hideDisclaimer);
              }
            }}
          >
            <span
              className={`block absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${
                page.hideDisclaimer ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </label>
      </div>
    </section>
  );
};