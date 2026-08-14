import React from 'react';
import { CustomFont } from '../../types';
import { Input, TextArea } from './Base';
import { FontSelect } from './FontSelect';

interface FormFieldWithFontProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  fontFamily?: string;
  onFontChange: (fontFamily: string) => void;
  customFonts: CustomFont[];
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  className?: string;
  fontSelectWidth?: string;
  italic?: boolean;
}

export const FormFieldWithFont: React.FC<FormFieldWithFontProps> = ({
  label,
  value,
  onChange,
  fontFamily,
  onFontChange,
  customFonts,
  placeholder,
  multiline = false,
  rows = 2,
  className = '',
  fontSelectWidth = 'w-32',
  italic = false,
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-end gap-2">
        <span className="text-[10px] text-slate-400 font-bold uppercase">{label}</span>
        <div className={fontSelectWidth}>
          <FontSelect
            customFonts={customFonts}
            value={fontFamily}
            onChange={onFontChange}
          />
        </div>
      </div>
      {multiline ? (
        <TextArea
          rows={rows}
          className={italic ? 'italic' : ''}
          style={{ fontFamily }}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input
          type="text"
          className={italic ? 'italic' : ''}
          style={{ fontFamily }}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
};
