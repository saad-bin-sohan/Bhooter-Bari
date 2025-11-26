'use client'
import clsx from 'clsx'

type Props = {
  label: string
  value: boolean
  onChange: (val: boolean) => void
}

export const Toggle = ({ label, value, onChange }: Props) => {
  return (
    <button
      type="button"
      className={clsx('w-full flex items-center justify-between rounded-xl px-4 py-3 shadow-neu bg-[#f4f5f7] transition', value ? 'text-[#6c7ae0]' : 'text-[#0f172a]')}
      onClick={() => onChange(!value)}
    >
      <span>{label}</span>
      <span className={clsx('w-12 h-6 rounded-full transition relative', value ? 'bg-[#6c7ae0]' : 'bg-[#d7dbe5]')}>
        <span
          className={clsx('absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-neu transition-transform', value ? 'translate-x-6' : 'translate-x-0')}
        />
      </span>
    </button>
  )
}
