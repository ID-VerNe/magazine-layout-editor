import React from 'react';
import { Image as ImageIcon, X, Plus } from 'lucide-react';
import { PageData, ImageConfig } from '../../../types';
import { Label, Input, Slider } from '../../ui/Base';

interface SectionProps {
  page: PageData;
  onUpdate: (page: PageData) => void;
  isOverflowing?: boolean;
  enforceA4?: boolean;
}

export const ImageSection: React.FC<SectionProps> = ({ page, onUpdate, isOverflowing, enforceA4 }) => {
  const handleChange = (field: keyof PageData, value: any) => {
    onUpdate({ ...page, [field]: value });
  };

  const handleImageConfigChange = (field: keyof ImageConfig, value: number) => {
    const currentConfig = page.imageConfig || { scale: 1, x: 0, y: 0, height: page.type === 'cover' ? 500 : 300 };
    if (enforceA4 && isOverflowing) {
       if (field === 'height' && value > currentConfig.height) return;
       if (field === 'scale' && value > currentConfig.scale) return;
    }
    handleChange('imageConfig', { ...currentConfig, [field]: value });
  };

  const resetImageConfig = () => {
    handleChange('imageConfig', {
      scale: 1,
      x: 0,
      y: 0,
      height: page.type === 'cover' ? 500 : 300
    });
  };

  const imgConfig = page.imageConfig || { scale: 1, x: 0, y: 0, height: page.type === 'cover' ? 500 : 300 };

  return (
    <section className="space-y-4">
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
             <button onClick={resetImageConfig} className="text-[10px] text-[#367237] hover:brightness-125 font-black uppercase tracking-widest cursor-pointer transition-all">
                Reset
             </button>
          </div>
          
          <div className="space-y-4 px-1">
            <Slider 
              label="Zoom" 
              value={parseFloat(imgConfig.scale.toFixed(1))} 
              min={1} max={5} step={0.1} 
              onChange={(v) => handleImageConfigChange('scale', v)} 
            />
            <Slider 
              label="X Offset" 
              value={imgConfig.x} 
              min={-100} max={100} step={1} 
              onChange={(v) => handleImageConfigChange('x', v)} 
            />
            <Slider 
              label="Y Offset" 
              value={imgConfig.y} 
              min={-100} max={100} step={1} 
              onChange={(v) => handleImageConfigChange('y', v)} 
            />
            <Slider 
              label="Height" 
              value={imgConfig.height} 
              min={100} max={800} step={10} 
              onChange={(v) => handleImageConfigChange('height', v)} 
            />
          </div>
        </div>
      )}
    </section>
  );
};
