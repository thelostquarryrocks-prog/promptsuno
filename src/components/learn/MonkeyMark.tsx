type MonkeyMarkProps = {
  className?: string
}

export function MonkeyMark({ className }: MonkeyMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M13 19C6 18 5 8 12 6c5-2 9 2 9 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M35 19c7-1 8-11 1-13-5-2-9 2-9 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M38 25c0 10-6 17-14 17S10 35 10 25 16 9 24 9s14 6 14 16Z" fill="currentColor" opacity=".16" />
      <path d="M34 29c0 7-4 11-10 11s-10-4-10-11c0-5 4-8 10-8s10 3 10 8Z" stroke="currentColor" strokeWidth="3" />
      <circle cx="18.5" cy="22.5" r="2" fill="currentColor" />
      <circle cx="29.5" cy="22.5" r="2" fill="currentColor" />
      <path d="M20 33c2 1 6 1 8 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
