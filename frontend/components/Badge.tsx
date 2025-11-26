'use client'
import { HTMLAttributes } from 'react'
import clsx from 'clsx'

export const Badge = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => {
  return <div className={clsx('px-3 py-1 rounded-full bg-[#eef1f6] shadow-neuSm text-sm', className)} {...rest} />
}
