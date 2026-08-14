import React from 'react';
import { Input } from './Base';

interface ColorPickerFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const ColorPickerField: React.FC<ColorPickerFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  className = '',
}) => {
  const displayValue = value || '#ffffff';

  return (
    <div className={`flex gap-3 items-center ${className}`}>
      <div
        className="relative overflow-hidden w-10 h-10 rounded-lg shadow-sm ring-1 ring-slate-200 shrink-0"
        title={label || 'Pick a color'}
      >
        <input
          type="color"
          aria-label={label ? `${label} color picker` : 'Color picker'}
          className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0"
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <Input
        type="text"
        aria-label={label ? `${label} hex value` : 'Color hex code'}
        className="font-mono uppercase text-xs"
        placeholder={placeholder || 'Color Hex'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};
