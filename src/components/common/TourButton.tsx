interface Props {
  onClick: () => void
}

export function TourButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Ver tour de esta página"
      aria-label="Ver tour de esta página"
      className="fixed bottom-24 right-5 z-40 w-10 h-10 rounded-full bg-brand-teal text-white font-bold shadow-lg hover:bg-brand-teal-dark transition-colors"
    >
      ?
    </button>
  )
}
