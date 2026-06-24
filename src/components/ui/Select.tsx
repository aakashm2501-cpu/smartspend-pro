import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string | number; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full mb-4">
        <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
        <select
          ref={ref}
          className={`w-full bg-gray-800/50 border ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-brand-orange'} text-white rounded-lg px-4 py-2.5 outline-none transition-colors appearance-none ${className}`}
          {...props}
        >
          <option value="" disabled>Select an option</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-brand-dark">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
