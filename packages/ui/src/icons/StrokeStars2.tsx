import React, { SVGAttributes } from "react";

const StrokeStars2 = ({ ...props }: SVGAttributes<SVGSVGElement>) => {
  return (
    <svg width={48} height={71} viewBox="0 0 48 71" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M9.25 18.564c.031 1.786.154 3.563.267 5.344M2 27.97c1.258-.035 2.506-.14 3.762-.211"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeMiterlimit={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13.32 27.943c1.098-.205 2.194-.418 3.289-.64z" fill="currentColor" />
      <path
        d="M13.32 27.943c1.098-.205 2.194-.418 3.289-.64M10.153 31.678c-.126 1.733-.257 3.57-.051 5.31M20.219 60.236c.964-.092 1.973-.099 2.927-.279M27.152 50.032c-.129 1.776.087 3.543.131 5.32M27.353 63.876c-.006 1.735-.14 3.749.178 5.463M32.598 59.64a41.262 41.262 0 004.008-.362M35.935 2c.113 1.817.277 3.624.322 5.445M27.918 13.296c1.41-.208 2.836-.277 4.24-.478"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeMiterlimit={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M36.857 16.61c.32 2.296.378 4.903 1.018 7.142z" fill="currentColor" />
      <path
        d="M36.857 16.61c.32 2.296.378 4.903 1.018 7.142M42.08 11.82c1.387-.158 2.778-.184 4.167-.305"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeMiterlimit={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default StrokeStars2;
