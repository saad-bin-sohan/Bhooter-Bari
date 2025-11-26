'use client'
import { HTMLAttributes } from 'react'
import clsx from 'clsx'

export const Card = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => {
  return <div className={clsx('neu-surface p-6 transition hover:shadow-neuLg', className)} {...rest} />
}
