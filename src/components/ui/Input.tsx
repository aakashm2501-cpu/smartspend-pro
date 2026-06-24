import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, className = '', ...props }, ref) => {
    return (
      <div className="w-full mb-4">
        <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full bg-gray-800/50 border ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-brand-orange'} text-white rounded-lg px-4 py-2.5 outline-none transition-colors ${leftIcon ? 'pl-10' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
