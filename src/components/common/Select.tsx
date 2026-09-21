interface Option {
  value: string
  label: string
  disabled?: boolean
}

interface Props {
  label: string
  value: string
  options: Option[]
  onChange: (value: string) => void
  disabled?: boolean
}

export function Select({ label, value, options, onChange, disabled }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-fg-muted font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="bg-surface border border-border text-fg text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-teal disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
