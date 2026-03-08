import React from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="font-opensans text-xs font-medium tracking-wider uppercase text-brand-lino/80">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-white/10 border border-white/20 text-brand-lino placeholder-brand-lino/40',
            'px-4 py-3 text-sm font-opensans',
            'focus:outline-none focus:border-brand-arena focus:bg-white/15',
            'transition-all duration-300',
            error && 'border-red-400',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-red-400 text-xs font-opensans">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="font-opensans text-xs font-medium tracking-wider uppercase text-brand-lino/80">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full bg-white/10 border border-white/20 text-brand-lino',
            'px-4 py-3 text-sm font-opensans',
            'focus:outline-none focus:border-brand-arena focus:bg-white/15',
            'transition-all duration-300 cursor-pointer',
            error && 'border-red-400',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p className="text-red-400 text-xs font-opensans">{error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="font-opensans text-xs font-medium tracking-wider uppercase text-brand-lino/80">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full bg-white/10 border border-white/20 text-brand-lino placeholder-brand-lino/40',
            'px-4 py-3 text-sm font-opensans resize-none',
            'focus:outline-none focus:border-brand-arena focus:bg-white/15',
            'transition-all duration-300',
            error && 'border-red-400',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-red-400 text-xs font-opensans">{error}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
