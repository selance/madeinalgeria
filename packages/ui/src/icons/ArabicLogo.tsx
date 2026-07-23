import * as React from "react";

/**
 * Neutral placeholder Arabic wordmark. Swap for your brand's logo.
 * Uses `currentColor` so it inherits text color like the other icons.
 */
function ArabicLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 450 162"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="صُنع في الجزائر"
      {...props}
    >
      <text
        x="225"
        y="110"
        textAnchor="middle"
        fontFamily="Graphik Arabic, system-ui, sans-serif"
        fontSize="110"
        fontWeight="800"
        fill="currentColor"
      >
        صُنع في الجزائر
      </text>
    </svg>
  );
}

export default ArabicLogo;
