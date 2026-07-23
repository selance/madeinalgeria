import React, { SVGAttributes } from "react";

const NormalStars1 = ({...props}:SVGAttributes<SVGSVGElement>) => {
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
      clipRule="evenodd"
      d="M83.88 37.852c-33.84 20.515-39.54 22.954-52.86 10.91 3.303 11.51 1.795 19.878-4.362 28.439 15.236-4.644 18.015-.401 25.75 4.908-4.76-15.029 1.916-19.975 31.473-44.256z"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeMiterlimit={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M71.18 68.413c.483 1.58.675 3.256.985 4.874M64.813 78.59c1.254-.192 2.52-.549 3.759-.839M73.684 80.714c-.004 1.551.273 3.555.761 5.051M77.684 76.247c1.671.135 3.433-.539 5.104-.747M40.809 24.311c.18 1.771.48 3.52.832 5.262M33.85 34.245a42.72 42.72 0 003.9-.522M43.043 36.919c.028 1.656.358 3.417.693 5.046M47.228 32.383c1.51-.375 2.905-.884 4.466-1.062"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeMiterlimit={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
  )
}

export default NormalStars1
