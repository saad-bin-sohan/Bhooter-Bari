'use client'
import { ReactNode } from 'react'

type PrivacyGroupProps = {
  label: string
  description?: string
  children: ReactNode
  first?: boolean
}

export const PrivacyGroup = ({
  label,
  description,
  children,
  first = false
}: PrivacyGroupProps) => {
  return (
    <div>
      {!first && <div className="divider mb-5" />}
      <div className="mb-3">
        <p className="text-xs font-medium text-muted">{label}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-muted/70">{description}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  )
}
