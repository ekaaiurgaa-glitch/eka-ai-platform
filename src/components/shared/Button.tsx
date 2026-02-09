import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 
  | 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  | 'success' | 'warning';

export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * Reusable Button Component
 * 
 * A versatile button with variants for different actions and states.
 * Supports loading states, icons, and various sizes.
 * 
 * @example
 * <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
 *   Create Job Card
 * </Button>
 * 
 * <Button variant="danger" size="sm" onClick={handleDelete}>
 *   Delete
 * </Button>
 */
const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-medium rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantStyles: Record<ButtonVariant, string> = {
    primary: `
      bg-orange-600 text-white
      hover:bg-orange-500
      active:bg-orange-700
      focus:ring-orange-500/50
      shadow-lg shadow-orange-600/20
    `,
    secondary: `
      bg-white/10 text-gray-200
      hover:bg-white/20
      active:bg-white/30
      focus:ring-white/30
      border border-white/10
    `,
    danger: `
      bg-red-600 text-white
      hover:bg-red-500
      active:bg-red-700
      focus:ring-red-500/50
      shadow-lg shadow-red-600/20
    `,
    ghost: `
      bg-transparent text-gray-400
      hover:text-white hover:bg-white/5
      active:bg-white/10
      focus:ring-white/20
    `,
    outline: `
      bg-transparent text-gray-300
      border border-white/20
      hover:bg-white/5 hover:text-white
      active:bg-white/10
      focus:ring-white/30
    `,
    success: `
      bg-emerald-600 text-white
      hover:bg-emerald-500
      active:bg-emerald-700
      focus:ring-emerald-500/50
      shadow-lg shadow-emerald-600/20
    `,
    warning: `
      bg-amber-600 text-white
      hover:bg-amber-500
      active:bg-amber-700
      focus:ring-amber-500/50
      shadow-lg shadow-amber-600/20
    `
  };

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!isLoading && leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};

export default Button;
