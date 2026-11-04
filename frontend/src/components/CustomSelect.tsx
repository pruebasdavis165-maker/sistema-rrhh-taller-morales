'use client';

import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface CustomSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  icon?: React.ReactNode;
  placeholderOption?: string;
}

const CustomSelect = forwardRef<HTMLSelectElement, CustomSelectProps>(
  ({ label, options, icon, placeholderOption, className = '', ...props }, ref) => {
    return (
      <div className="relative inline-block w-full text-left">
        {label && (
          <label className="block text-[11px] font-semibold text-slate-700 mb-1 tracking-wide">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 pointer-events-none text-slate-400">
              {icon}
            </div>
          )}
          <select
            ref={ref}
            className={`w-full appearance-none bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/90 focus:border-blue-500 focus:bg-white text-slate-800 text-xs font-medium rounded-xl py-2 transition-all cursor-pointer shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed ${
              icon ? 'pl-9' : 'pl-3.5'
            } pr-9 ${className}`}
            {...props}
          >
            {placeholderOption !== undefined && (
              <option value="" className="text-slate-400">
                {placeholderOption}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="text-slate-800 py-1">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 pointer-events-none text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>
    );
  }
);

CustomSelect.displayName = 'CustomSelect';

export default CustomSelect;
