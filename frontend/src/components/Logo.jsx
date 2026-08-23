export default function Logo({ size = 32, showText = true, textSize = 20 }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_8px_rgba(232,181,99,0.4)]">
        <defs>
          <linearGradient id="goldGradient" x1="4" y1="8" x2="36" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F0C57B" />
            <stop offset="1" stopColor="#E8B563" />
          </linearGradient>
        </defs>
        <path
          d="M4 12C4 9.79086 5.79086 8 8 8H32C34.2091 8 36 9.79086 36 12V16C34.3431 16 33 17.3431 33 19C33 20.6569 34.3431 22 36 22V26C36 28.2091 34.2091 30 32 30H8C5.79086 30 4 28.2091 4 26V22C5.65685 22 7 20.6569 7 19C7 17.3431 5.65685 16 4 16V12Z"
          fill="url(#goldGradient)"
        />
        <line x1="20" y1="8" x2="20" y2="30" stroke="#0B0E14" strokeWidth="1.5" strokeDasharray="2 2" />
        <circle cx="26" cy="19" r="3" fill="#0B0E14" />
      </svg>
      {showText && (
        <span 
          className="font-display font-bold uppercase tracking-wider bg-gradient-to-r from-white to-[#8B93A7] bg-clip-text text-transparent"
          style={{ fontSize: textSize }}
        >
          EventBook
        </span>
      )}
    </div>
  );
}
