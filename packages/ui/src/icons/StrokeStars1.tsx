import React, { SVGAttributes } from "react";

const StrokeStars1 = ({...props}:SVGAttributes<SVGSVGElement>) => {
  return (
    <svg
    width={111}
    height={111}
    viewBox="0 0 111 111"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M47.05 16.154c.294 6.322-.1 12.84.51 19.128M29.93 41.721c3.226-.23 7.229-1.512 10.44-1.149M52.93 39.346c3.85.46 7.714-.151 11.58.29M47.304 45.837c-.13 4.774-.113 9.55-.114 14.325M38.727 75.218c-2.157.04-3.03 3.402-.556 3.832 1.115.193 2.886-1.556 1.938-2.573M61.529 60.901c-.343 3.755-.045 7.48.03 11.238M53.2 77.65c1.25-.157 2.545-.389 3.81-.379M66.607 76.88c1.68.055 3.316-.15 4.99-.24M62.118 82.16c-.186 4.08-.144 8.166-.147 12.249M74.923 43.68c-2.804.673-3.315 4.485.045 4.548 1.166.023 3.629-2.286 1.88-3.074M76.868 26.836c-4.332-1.478-9.817 4.97-4.782 7.502 5.418 2.724 11.853-4.002 6.138-7.643"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeMiterlimit={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
  )
}

export default StrokeStars1
