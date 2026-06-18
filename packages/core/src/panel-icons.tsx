export function SlidersIcon({ size }: { size: number }) {
  return (
    <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 16 16" width={size}>
      <rect
        fill="currentColor"
        fillOpacity="0.35"
        height="1.8"
        rx="0.9"
        width="15"
        x="0.5"
        y="2.75"
      />
      <circle cx="5" cy="3.65" fill="currentColor" r="3" />
      <rect
        fill="currentColor"
        fillOpacity="0.35"
        height="1.8"
        rx="0.9"
        width="15"
        x="0.5"
        y="7.1"
      />
      <circle cx="11.25" cy="8" fill="currentColor" r="3" />
      <rect
        fill="currentColor"
        fillOpacity="0.35"
        height="1.8"
        rx="0.9"
        width="15"
        x="0.5"
        y="11.45"
      />
      <circle cx="7.2" cy="12.35" fill="currentColor" r="3" />
    </svg>
  );
}

export function GearIcon({ size }: { size: number }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      width={size}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
