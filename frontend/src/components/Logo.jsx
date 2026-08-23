export default function Logo({ size = 32, showText = true, textSize = 20 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Ticket stub shape with notched edges */}
        <path
          d="M4 12C4 9.79086 5.79086 8 8 8H32C34.2091 8 36 9.79086 36 12V16C34.3431 16 33 17.3431 33 19C33 20.6569 34.3431 22 36 22V26C36 28.2091 34.2091 30 32 30H8C5.79086 30 4 28.2091 4 26V22C5.65685 22 7 20.6569 7 19C7 17.3431 5.65685 16 4 16V12Z"
          fill="var(--gold)"
        />
        {/* Perforation line */}
        <line x1="20" y1="8" x2="20" y2="30" stroke="var(--bg)" strokeWidth="1.5" strokeDasharray="2 2" />
        {/* Star punch detail */}
        <circle cx="26" cy="19" r="3" fill="var(--bg)" />
      </svg>
      {showText && (
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: textSize,
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
          color: 'var(--text)',
        }}>
          EventBook
        </span>
      )}
    </div>
  );
}
