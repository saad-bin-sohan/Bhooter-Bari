'use client'

type LogoProps = {
  className?: string
  showWordmark?: boolean
}

export const Logo = ({ className, showWordmark = true }: LogoProps) => {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ''}`}>
      {/* PLACEHOLDER LOGOMARK — product owner will replace this SVG */}
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/*
          INSTRUCTIONS FOR PRODUCT OWNER:
          Replace the placeholder shape below with your brand mark SVG paths.
          - Use `currentColor` for any fills/strokes that should inherit the foreground text color
          - Use `hsl(var(--primary))` inline style for teal-colored elements
          - Use `hsl(var(--accent))` inline style for amber-colored elements
          - Keep viewBox="0 0 32 32" unless your mark has a different natural aspect ratio
        */}
        <rect
          width="32"
          height="32"
          rx="8"
          fill="hsl(var(--primary))"
          fillOpacity="0.15"
        />
        <text
          x="16"
          y="21"
          textAnchor="middle"
          fontSize="14"
          fontWeight="700"
          fontFamily="var(--font-display)"
          fill="hsl(var(--primary))"
        >
          B
        </text>
      </svg>

      {showWordmark && (
        <span className="font-display text-base font-semibold tracking-tight text-foreground">
          Bhooter Bari
        </span>
      )}
    </div>
  )
}
