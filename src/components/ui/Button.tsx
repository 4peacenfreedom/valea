import React from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'arena'
  size?: 'sm' | 'md' | 'lg'
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-opensans font-medium tracking-widest uppercase transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-brand-blue text-brand-lino hover:bg-brand-tierra border border-brand-blue hover:border-brand-tierra',
    secondary: 'bg-transparent text-brand-blue border border-brand-blue hover:bg-brand-blue hover:text-brand-lino',
    ghost: 'bg-transparent text-brand-tierra hover:text-brand-blue underline-offset-4 hover:underline',
    arena: 'bg-brand-arena text-brand-blue hover:bg-brand-tierra hover:text-brand-lino border border-brand-arena hover:border-brand-tierra',
  }

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-xs',
    lg: 'px-8 py-4 text-sm',
  }

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  )
}
