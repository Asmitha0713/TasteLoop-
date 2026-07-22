export default function PasswordEye({ visible }) {
  return visible ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 002.8 2.8" /><path d="M9.9 4.2A10.8 10.8 0 0112 4c5.5 0 9 5 9 5a16 16 0 01-3 3.5M6.6 6.6C4.4 8.1 3 10 3 10s3.5 5 9 5c1 0 2-.2 2.8-.5" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5z" /><circle cx="12" cy="12" r="2.5" />
    </svg>
  )
}
