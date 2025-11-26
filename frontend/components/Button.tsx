'use client'
import { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'

const base = 'rounded-xl px-4 py-3 font-semibold transition transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6c7ae0]'

export const Button = ({ variant = 'primary', className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'secondary' }) => {
  const styles = {
    primary: 'bg-gradient-to-br from-[#6c7ae0] to-[#8ea2ff] text-white shadow-neu',
    secondary: 'bg-[#f4f5f7] text-[#0f172a] shadow-neu hover:shadow-neuLg',
    ghost: 'bg-[#f4f5f7] text-[#6c7ae0] shadow-neu hover:shadow-neuLg'
  }
  return <button className={clsx(base, styles[variant], className)} {...rest} />
}
