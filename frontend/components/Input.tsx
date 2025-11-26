'use client'
import { InputHTMLAttributes } from 'react'
import clsx from 'clsx'

export const Input = ({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) => {
  return <input className={clsx('w-full rounded-xl px-4 py-3 bg-[#f4f5f7] shadow-neuInset focus:outline-none focus:ring-2 focus:ring-[#6c7ae0]', className)} {...rest} />
}
