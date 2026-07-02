interface Props {
  label: string
  color?: string
}

export function Badge({ label, color = '#22c55e' }: Props) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: `${color}25`, color }}
    >
      {label}
    </span>
  )
}
