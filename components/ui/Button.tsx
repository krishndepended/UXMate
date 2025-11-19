
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
  // Added min-h-[44px] for touch targets on mobile for accessible interactions
  // Added active:scale-95 for better tap feedback
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 touch-manipulation";
  
  const variants = {
    primary: "bg-accent text-surface hover:bg-blue-400 active:bg-blue-500 shadow-sm",
    ghost: "bg-transparent text-muted hover:bg-white/5 hover:text-white border border-transparent hover:border-white/5",
    outline: "bg-transparent border border-white/10 text-muted hover:border-white/20 hover:text-white",
    danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
  };

  const sizes = {
    sm: "text-xs px-3 py-2 min-h-[32px] md:min-h-0", // Slightly larger touch area on mobile
    md: "text-sm px-4 py-3 md:py-2 min-h-[44px] md:min-h-[38px]", // Ensure 44px height on mobile
    lg: "text-base px-6 py-3 min-h-[48px]"
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
