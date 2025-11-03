export function WarrantyDeckLogo({ size = 32 }) {
  return (
    <svg 
      viewBox="0 0 32 32" 
      className={`h-${size} w-${size}`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shield outline */}
      <path
        d="M16 2L5 7V14C5 20.6 16 28 16 28C16 28 27 20.6 27 14V7L16 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-current"
      />
      {/* Card/Deck symbol inside shield */}
      <g>
        <path
          d="M11 16L21 16"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-current"
        />
        <path
          d="M11 19L21 19"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-current"
        />
        <path
          d="M11 22L18 22"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-current"
        />
      </g>
    </svg>
  )
}

