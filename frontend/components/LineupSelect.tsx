'use client'

import { useState } from 'react'
import { LINEUP_OPTIONS } from '@/lib/lineupOptions'

const CUSTOM_VALUE = '__custom__'

interface LineupSelectProps {
  id?: string
  value: string
  onChange: (value: string) => void
  className?: string
}

const defaultFieldClassName =
  'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition'

export default function LineupSelect({ id, value, onChange, className }: LineupSelectProps) {
  const matchedOption = LINEUP_OPTIONS.find((opt) => opt.link === value)
  const [isCustom, setIsCustom] = useState(!!value && !matchedOption)

  const fieldClassName = className || defaultFieldClassName
  const selectValue = isCustom ? CUSTOM_VALUE : matchedOption?.link || ''

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value
    if (next === CUSTOM_VALUE) {
      setIsCustom(true)
      onChange('')
      return
    }
    setIsCustom(false)
    onChange(next)
  }

  return (
    <div className="flex-1 space-y-2">
      <select id={id} value={selectValue} onChange={handleSelectChange} className={fieldClassName}>
        <option value="">— none —</option>
        {LINEUP_OPTIONS.map((opt) => (
          <option key={opt.link} value={opt.link}>
            {opt.name}
          </option>
        ))}
        <option value={CUSTOM_VALUE}>Other (custom link)…</option>
      </select>
      {isCustom && (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className={fieldClassName}
        />
      )}
    </div>
  )
}
