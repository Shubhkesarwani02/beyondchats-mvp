"use client";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import clsx from "clsx";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[.98]",
  {
    variants: {
      variant: {
        primary: "bg-gradient-to-tr from-indigo-600 to-fuchsia-500 text-white shadow hover:shadow-md",
        subtle: "bg-[var(--color-bg)]/70 border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-alt)]",
        outline: "bg-transparent border border-[var(--color-border)] hover:bg-[var(--color-bg)]/50",
        ghost: "bg-transparent hover:bg-[var(--color-bg)]/60",
        danger: "bg-red-600 text-white shadow hover:bg-red-500",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-lg",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-sm",
        icon: "h-10 w-10 p-0 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  variant?: 'primary' | 'subtle' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={clsx(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";

export { buttonVariants };