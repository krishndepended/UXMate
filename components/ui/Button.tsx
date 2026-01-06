import React, { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center font-black rounded-2xl transition-premium focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 active:scale-95 touch-manipulation select-none";
  
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-black shadow-lg shadow-slate-900/10",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900",
    outline: "bg-white border-2 border-slate-100 text-slate-700 hover:border-slate-300 hover:bg-slate-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border-2 border-red-100"
  };

  const sizes = {
    sm: "text-[10px] px-4 py-2 min-h-[40px] tracking-widest uppercase",
    md: "text-xs px-6 py-3 min-h-[48px] uppercase tracking-wider", 
    lg: "text-sm px-10 py-4 min-h-[56px] shadow-fab uppercase tracking-widest"
  };

  return (
    <button 
      ref={ref}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';